from rest_framework import mixins, viewsets

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
