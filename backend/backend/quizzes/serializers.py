from rest_framework import serializers
import uuid

from .models import Choice, Question, Quiz, Tag


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text")


class QuestionSerializer(serializers.ModelSerializer):
    options = ChoiceSerializer(many=True)
    correct_index = serializers.SerializerMethodField()

    class Meta:
        model = Question
        fields = ("id", "text", "options", "correct_index")

    def get_correct_index(self, obj: Question) -> int:
        try:
            return next(option.index for option in obj.options.all() if option.is_correct)
        except StopIteration:
            return -1


class QuizSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "tags", "questions")


class QuizListSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "tags", "question_count")


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text", "is_correct")


class QuestionCreateSerializer(serializers.ModelSerializer):
    options = ChoiceCreateSerializer(many=True)

    class Meta:
        model = Question
        fields = ("id", "text", "order", "options")

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            Choice.objects.create(question=question, **option_data)
        return question


class QuizCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True)
    tags = serializers.SlugRelatedField(
        many=True, queryset=Tag.objects.all(), slug_field="name", required=False
    )
    id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "description", "tags", "questions")

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        tags = validated_data.pop("tags", [])
        
        # Auto-generate ID if not provided
        if not validated_data.get("id"):
            validated_data["id"] = f"quiz-{uuid.uuid4().hex[:8]}"
        
        quiz = Quiz.objects.create(**validated_data)
        quiz.tags.set(tags)
        for question_data in questions_data:
            QuestionCreateSerializer().create(
                {**question_data, "quiz": quiz}
            )
        return quiz

