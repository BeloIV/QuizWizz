from rest_framework import mixins, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
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
