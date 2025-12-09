from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import QuizViewSet, UploadImageView

router = DefaultRouter()
router.register(r"quizzes", QuizViewSet, basename="quiz")

urlpatterns = [
    path("upload-image/", UploadImageView.as_view(), name="upload-image"),
] + router.urls
