from rest_framework import serializers
import uuid

from .models import Choice, Question, Quiz, Tag


class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text", "is_correct", "image")


class QuestionSerializer(serializers.ModelSerializer):
    options = ChoiceSerializer(many=True)
    correct_index = serializers.SerializerMethodField()
    correct_indices = serializers.SerializerMethodField()  # For multiple correct answers

    class Meta:
        model = Question
        fields = ("id", "text", "question_type", "image", "options", "correct_index", "correct_indices")

    def get_correct_index(self, obj: Question) -> int:
        """Returns first correct index for backward compatibility"""
        try:
            return next(option.index for option in obj.options.all() if option.is_correct)
        except StopIteration:
            return -1

    def get_correct_indices(self, obj: Question) -> list:
        """Returns all correct indices for multi-answer support"""
        return [option.index for option in obj.options.all() if option.is_correct]


class QuizSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    questions = QuestionSerializer(many=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "tags", "questions", "icon" , "likes", "dislikes")


class QuizListSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    question_count = serializers.IntegerField(source="questions.count", read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "icon", "tags", "question_count", "likes", "dislikes")


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text", "is_correct", "image")


class QuestionCreateSerializer(serializers.ModelSerializer):
    options = ChoiceCreateSerializer(many=True)
    # Allow backend to auto-generate IDs when not provided
    id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Question
        fields = ("id", "text", "order", "options", "question_type", "image")

    def create(self, validated_data):
        options_data = validated_data.pop("options", [])
        # Always generate a unique question ID to avoid collisions
        validated_data.pop("id", None)
        validated_data["id"] = f"q-{uuid.uuid4().hex[:8]}"
        question = Question.objects.create(**validated_data)
        for option_data in options_data:
            Choice.objects.create(question=question, **option_data)
        return question


class QuizCreateSerializer(serializers.ModelSerializer):
    questions = QuestionCreateSerializer(many=True, write_only=True)
    tags = serializers.ListField(
        child=serializers.CharField(), required=False, allow_empty=True, write_only=True
    )
    id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "description", "tags", "questions")

    def to_representation(self, instance):
        # After creation return full QuizSerializer representation
        return QuizSerializer(instance).data

    def create(self, validated_data):
        questions_data = validated_data.pop("questions", [])
        tag_names = validated_data.pop("tags", [])
        
        # Auto-generate ID if not provided
        if not validated_data.get("id"):
            validated_data["id"] = f"quiz-{uuid.uuid4().hex[:8]}"
        
        quiz = Quiz.objects.create(**validated_data)
        
        # Create tags if they don't exist and set them
        tags = []
        for tag_name in tag_names:
            if isinstance(tag_name, str) and tag_name.strip():
                tag, created = Tag.objects.get_or_create(name=tag_name.strip())
                tags.append(tag)
        quiz.tags.set(tags)
        
        # Create questions
        for idx, question_data in enumerate(questions_data):
            question_data['quiz'] = quiz
            question_data['order'] = idx
            QuestionCreateSerializer().create(question_data)
        
        return quiz
