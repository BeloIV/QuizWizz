from django.db import models


class Tag(models.Model):
    name = models.CharField(max_length=64, unique=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Quiz(models.Model):
    id = models.SlugField(primary_key=True, max_length=100)
    name = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    tags = models.ManyToManyField(Tag, related_name="quizzes", blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name


class Question(models.Model):
    QUESTION_TYPES = [
        ('MULTIPLE_CHOICE', 'Multiple Choice'),
        ('FILL_IN_THE_GAP', 'Fill in the Gap'),
        ('IMAGE', 'Image-based'),
    ]
    
    id = models.CharField(primary_key=True, max_length=100)
    quiz = models.ForeignKey(Quiz, related_name="questions", on_delete=models.CASCADE)
    text = models.TextField()
    order = models.PositiveIntegerField(default=0)
    question_type = models.CharField(
        max_length=20,
        choices=QUESTION_TYPES,
        default='MULTIPLE_CHOICE',
    )
    # Optional relative path to an image served by the backend (e.g. under MEDIA_ROOT)
    image = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["order", "id"]

    def __str__(self) -> str:
        return f"{self.quiz_id}: {self.text[:48]}"


class Choice(models.Model):
    question = models.ForeignKey(Question, related_name="options", on_delete=models.CASCADE)
    text = models.CharField(max_length=255)
    index = models.PositiveIntegerField()
    is_correct = models.BooleanField(default=False)
    # Optional relative path to an image served by the backend (e.g. under MEDIA_ROOT)
    image = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["index"]
        unique_together = ("question", "index")

    def __str__(self) -> str:
        return f"{self.question_id}[{self.index}]"
