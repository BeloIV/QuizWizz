from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

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