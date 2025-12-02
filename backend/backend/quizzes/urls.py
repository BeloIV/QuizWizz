from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import QuizViewSet, ImageUploadView

router = DefaultRouter()
router.register(r"quizzes", QuizViewSet, basename="quiz")

urlpatterns = router.urls + [
    path("images/", ImageUploadView.as_view(), name="image-upload"),
]
