from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import action
from django.conf import settings
import os
import uuid
from .models import Quiz
from .serializers import QuizCreateSerializer, QuizListSerializer, QuizSerializer


class QuizViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    lookup_field = "id"
    serializer_action_map = {
        "list": QuizListSerializer,
        "retrieve": QuizSerializer,
        "create": QuizCreateSerializer,
    }

    def get_queryset(self):
        return (
            Quiz.objects.all()
            .prefetch_related("tags", "questions__options")
            .order_by("name")
        )

    def get_serializer_class(self):
        return self.serializer_action_map.get(self.action, QuizSerializer)

    @action(detail=True, methods=["post"])
    def like(self, request, id=None):
        quiz = self.get_object()
        previous = request.data.get("previous")
        current = request.data.get("current")

        if previous == "like" and current is None:
            quiz.likes = max(quiz.likes - 1, 0)
        elif previous == "dislike" and current == "like":
            quiz.dislikes = max(quiz.dislikes - 1, 0)
            quiz.likes += 1
        elif previous is None and current == "like":
            quiz.likes += 1

        quiz.save()
        return Response({"likes": quiz.likes, "dislikes": quiz.dislikes})

    @action(detail=True, methods=["post"])
    def dislike(self, request, id=None):
        quiz = self.get_object()
        previous = request.data.get("previous")
        current = request.data.get("current")

        if previous == "dislike" and current is None:
            quiz.dislikes = max(quiz.dislikes - 1, 0)
        elif previous == "like" and current == "dislike":
            quiz.likes = max(quiz.likes - 1, 0)
            quiz.dislikes += 1
        elif previous is None and current == "dislike":
            quiz.dislikes += 1

        quiz.save()
        return Response({"likes": quiz.likes, "dislikes": quiz.dislikes})


class ImageUploadView(APIView):
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        ext = os.path.splitext(file_obj.name)[1] or ""
        filename = f"{uuid.uuid4().hex}{ext}"
        upload_dir = os.path.join(settings.MEDIA_ROOT, "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        path = os.path.join(upload_dir, filename)

        with open(path, "wb+") as dest:
            for chunk in file_obj.chunks():
                dest.write(chunk)

        url = settings.MEDIA_URL + "uploads/" + filename
        return Response({"url": url}, status=status.HTTP_201_CREATED)
