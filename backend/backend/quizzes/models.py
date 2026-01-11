from django.db import models
from django.contrib.auth.models import User


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Quiz(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    name = models.CharField(max_length=255)
    author = models.ForeignKey(User, related_name="quizzes", on_delete=models.CASCADE)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, default="📝")
    tags = models.ManyToManyField(Tag, related_name="quizzes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    likes = models.PositiveIntegerField(default=0)
    dislikes = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Question(models.Model):
    id = models.CharField(primary_key=True, max_length=100)
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    image_url = models.CharField(max_length=512, blank=True)
    explanation = models.TextField(blank=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.quiz_id}: {self.text[:48]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name="options", on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    index = models.PositiveIntegerField()
    is_correct = models.BooleanField(default=False)
    image_url = models.CharField(max_length=512, blank=True)

    class Meta:
        ordering = ["index"]
        unique_together = ("question", "index")

    def __str__(self) -> str:
        return f"{self.question_id}[{self.index}]"


class Message(models.Model):
    """Messages between users for chat functionality"""
    sender = models.ForeignKey(User, related_name="sent_messages", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_messages", on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_read = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"From {self.sender.username} to {self.recipient.username}: {self.content[:30]}"


class QuizShare(models.Model):
    """Track quiz sharing between users"""
    quiz = models.ForeignKey(Quiz, related_name="shares", on_delete=models.CASCADE)
    sender = models.ForeignKey(User, related_name="shared_quizzes", on_delete=models.CASCADE)
    recipient = models.ForeignKey(User, related_name="received_quizzes", on_delete=models.CASCADE)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_viewed = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("quiz", "sender", "recipient")

    def __str__(self) -> str:
        return f"{self.sender.username} shared '{self.quiz.name}' with {self.recipient.username}"


class Favorite(models.Model):
    """Favorite quizzes per user"""
    user = models.ForeignKey(User, related_name="favorites", on_delete=models.CASCADE)
    quiz = models.ForeignKey(Quiz, related_name="favorites", on_delete=models.CASCADE)
class Comment(models.Model):
    """User comments on quizzes"""

    quiz = models.ForeignKey(Quiz, related_name="comments", on_delete=models.CASCADE)
    user = models.ForeignKey(User, related_name="quiz_comments", on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        unique_together = ("user", "quiz")
        indexes = [
            models.Index(fields=["quiz", "-created_at"]),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} on {self.quiz_id}: {self.text[:30]}"
