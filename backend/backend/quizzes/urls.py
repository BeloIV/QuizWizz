from rest_framework.routers import DefaultRouter
from django.urls import path

from .views import (
    QuizViewSet, 
    UploadImageView,
    LoginView,
    RegisterView,
    LogoutView,
    CurrentUserView,
    UserListView,
    MessageViewSet,
    QuizShareViewSet,
    FavoriteViewSet,
)

router = DefaultRouter()
router.register(r"quizzes", QuizViewSet, basename="quiz")
router.register(r"messages", MessageViewSet, basename="message")
router.register(r"quiz-shares", QuizShareViewSet, basename="quiz-share")
router.register(r"favorites", FavoriteViewSet, basename="favorite")

urlpatterns = [
    path("upload-image/", UploadImageView.as_view(), name="upload-image"),
    path("auth/login/", LoginView.as_view(), name="login"),
    path("auth/register/", RegisterView.as_view(), name="register"),
    path("auth/logout/", LogoutView.as_view(), name="logout"),
    path("auth/current-user/", CurrentUserView.as_view(), name="current-user"),
    path("users/", UserListView.as_view(), name="user-list"),
] + router.urls
