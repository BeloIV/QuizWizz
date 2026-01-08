from rest_framework import mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.conf import settings
from django.db import models
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
import os
import uuid

from .models import Quiz, Favorite
from .serializers import QuizCreateSerializer, QuizListSerializer, QuizSerializer, FavoriteSerializer


class QuizViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    lookup_field = "id"
    permission_classes = [IsAuthenticatedOrReadOnly]
    serializer_action_map = {
        "list": QuizListSerializer,
        "retrieve": QuizSerializer,
        "create": QuizCreateSerializer,
        "update": QuizCreateSerializer,
        "partial_update": QuizCreateSerializer,
    }

    def get_queryset(self):
        return (
            Quiz.objects.all()
            .prefetch_related("tags", "questions__options")
            .order_by("name")
        )

    def get_serializer_class(self):
        return self.serializer_action_map.get(self.action, QuizSerializer)

    def perform_create(self, serializer):
        # Set author to the authenticated user (required)
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        # Ensure only the author can update their quiz
        quiz = self.get_object()
        if quiz.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only edit your own quizzes.")
        serializer.save()

    def perform_destroy(self, instance):
        # Ensure only the author can delete their quiz
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You can only delete your own quizzes.")
        instance.delete()

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


class FavoriteViewSet(viewsets.ModelViewSet):
    """Manage user favorites"""
    serializer_class = FavoriteSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = "quiz_id"
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        user = self.request.user
        if not user or not user.is_authenticated:
            return Favorite.objects.none()
        return (
            Favorite.objects.filter(user=user)
            .select_related("quiz", "quiz__author")
            .prefetch_related("quiz__tags")
        )

    def get_object(self):
        quiz_id = self.kwargs.get(self.lookup_field)
        queryset = self.filter_queryset(self.get_queryset())
        try:
            favorite = queryset.get(quiz__id=quiz_id)
        except Favorite.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound("Favorite not found")
        self.check_object_permissions(self.request, favorite)
        return favorite

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UploadImageView(APIView):
    parser_classes = (MultiPartParser, FormParser)
    # Use Django's configured upload limit; fall back to 5 MB if not set
    MAX_FILE_SIZE = getattr(settings, "FILE_UPLOAD_MAX_MEMORY_SIZE", 5 * 1024 * 1024)

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get("file")

        if not file_obj:
            return Response({"detail": "No file provided."}, status=status.HTTP_400_BAD_REQUEST)

        content_type = file_obj.content_type or ""
        if not content_type.startswith("image/"):
            return Response(
                {"detail": "Only image files are allowed."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file_obj.size > self.MAX_FILE_SIZE:
            max_mb = round(self.MAX_FILE_SIZE / (1024 * 1024))
            return Response(
                {"detail": f"Image is too large (max {max_mb}MB)."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        ext = os.path.splitext(file_obj.name)[1].lower()
        filename = f"{uuid.uuid4().hex}{ext}"
        relative_dir = "quiz_images"
        save_dir = os.path.join(settings.MEDIA_ROOT, relative_dir)
        os.makedirs(save_dir, exist_ok=True)

        file_path = os.path.join(save_dir, filename)
        with open(file_path, "wb+") as destination:
            for chunk in file_obj.chunks():
                destination.write(chunk)

        url = settings.MEDIA_URL.rstrip("/") + f"/{relative_dir}/{filename}"
        return Response({"url": url}, status=status.HTTP_201_CREATED)


# Authentication and User Management Views
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework.permissions import AllowAny
from .models import Message, QuizShare
from .serializers import UserSerializer, MessageSerializer, QuizShareSerializer


class LoginView(APIView):
    """Login endpoint - session based authentication"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "user": UserSerializer(user).data,
                "message": "Login successful"
            })
        else:
            return Response(
                {"detail": "Invalid credentials."},
                status=status.HTTP_401_UNAUTHORIZED
            )


class RegisterView(APIView):
    """Register a new user"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response(
                {"detail": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username already exists
        if User.objects.filter(username=username).exists():
            return Response(
                {"detail": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create new user
            user = User.objects.create_user(
                username=username,
                password=password
            )
            
            # Automatically log in the new user
            login(request, user)
            
            return Response({
                "user": UserSerializer(user).data,
                "message": "Registration successful"
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {"detail": f"Registration failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class LogoutView(APIView):
    """Logout endpoint"""
    permission_classes = [AllowAny]

    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"})


class CurrentUserView(APIView):
    """Get current logged in user"""
    permission_classes = [AllowAny]

    def get(self, request):
        if request.user.is_authenticated:
            return Response({"user": UserSerializer(request.user).data})
        return Response({"user": None})


class UserListView(APIView):
    """List all users (for messaging and sharing)"""
    permission_classes = [AllowAny]

    def get(self, request):
        users = User.objects.all().order_by("username")
        return Response({"users": UserSerializer(users, many=True).data})


class MessageViewSet(viewsets.ModelViewSet):
    """Messages between users"""
    serializer_class = MessageSerializer
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Message.objects.none()
        
        # Get messages where user is sender or recipient
        return Message.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).select_related("sender", "recipient").order_by("-created_at")

    def perform_create(self, serializer):
        print(f"Message create: User authenticated: {self.request.user.is_authenticated}, user: {self.request.user}")
        # Set sender from request user, or allow anonymous for demo
        if self.request.user.is_authenticated:
            serializer.save(sender=self.request.user)
        else:
            # For demo purposes, allow sending without auth
            sender_id = self.request.data.get("sender_id")
            if sender_id:
                sender = User.objects.get(id=sender_id)
                serializer.save(sender=sender)
            else:
                return Response(
                    {"detail": "Sender required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

    @action(detail=False, methods=["get"])
    def conversation(self, request):
        """Get conversation between current user and another user"""
        other_user_id = request.query_params.get("user_id")
        if not other_user_id:
            return Response(
                {"detail": "user_id parameter required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = request.user if request.user.is_authenticated else None
        # Allow viewing conversation even without auth for demo
        sender_id = request.query_params.get("sender_id")
        if not user and sender_id:
            user = User.objects.get(id=sender_id)

        if not user:
            return Response(
                {"detail": "Authentication required"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        messages = Message.objects.filter(
            models.Q(sender=user, recipient_id=other_user_id) |
            models.Q(sender_id=other_user_id, recipient=user)
        ).select_related("sender", "recipient").order_by("created_at")

        return Response(MessageSerializer(messages, many=True).data)

    @action(detail=True, methods=["post"])
    def mark_read(self, request, pk=None):
        """Mark a message as read"""
        message = self.get_object()
        message.is_read = True
        message.save()
        return Response({"status": "marked as read"})


class QuizShareViewSet(viewsets.ModelViewSet):
    """Quiz shares between users"""
    serializer_class = QuizShareSerializer
    permission_classes = [AllowAny]

    @method_decorator(csrf_exempt)
    def dispatch(self, *args, **kwargs):
        return super().dispatch(*args, **kwargs)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return QuizShare.objects.none()

        # Get shares sent to or from the user
        return QuizShare.objects.filter(
            models.Q(sender=user) | models.Q(recipient=user)
        ).select_related("sender", "recipient", "quiz").order_by("-created_at")

    def perform_create(self, serializer):
        print(f"QuizShare create: User authenticated: {self.request.user.is_authenticated}, user: {self.request.user}")
        # Set sender from request user, or allow for demo
        if self.request.user.is_authenticated:
            serializer.save(sender=self.request.user)
        else:
            # For demo purposes
            sender_id = self.request.data.get("sender_id")
            if sender_id:
                sender = User.objects.get(id=sender_id)
                serializer.save(sender=sender)
            else:
                return Response(
                    {"detail": "Sender required"},
                    status=status.HTTP_400_BAD_REQUEST
                )

    @action(detail=False, methods=["get"])
    def received(self, request):
        """Get quizzes shared with current user"""
        user = request.user if request.user.is_authenticated else None
        user_id = request.query_params.get("user_id")
        
        if not user and user_id:
            user = User.objects.get(id=user_id)

        if not user:
            return Response({"shares": []})

        shares = QuizShare.objects.filter(
            recipient=user
        ).select_related("sender", "recipient", "quiz").order_by("-created_at")

        return Response(QuizShareSerializer(shares, many=True).data)

    @action(detail=True, methods=["post"])
    def mark_viewed(self, request, pk=None):
        """Mark a quiz share as viewed"""
        share = self.get_object()
        share.is_viewed = True
        share.save()
        return Response({"status": "marked as viewed"})
