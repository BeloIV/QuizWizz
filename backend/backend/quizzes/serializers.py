from rest_framework import serializers
import uuid
from django.contrib.auth.models import User

from .models import Choice, Question, Quiz, Tag, Message, QuizShare, Favorite, Comment



class ChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text", "is_correct", "image_url")


class QuestionSerializer(serializers.ModelSerializer):
    options = ChoiceSerializer(many=True)
    correct_index = serializers.SerializerMethodField()
    correct_indices = serializers.SerializerMethodField()  # For multiple correct answers

    class Meta:
        model = Question
        fields = ("id", "text", "image_url", "explanation", "options", "correct_index", "correct_indices")

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
    author = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "tags", "questions", "icon" , "likes", "dislikes")


class QuizListSerializer(serializers.ModelSerializer):
    tags = serializers.SlugRelatedField(many=True, read_only=True, slug_field="name")
    question_count = serializers.IntegerField(source="questions.count", read_only=True)
    author = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Quiz
        fields = ("id", "name", "author", "icon", "tags", "question_count", "likes", "dislikes")


class ChoiceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Choice
        fields = ("index", "text", "is_correct", "image_url")


class QuestionCreateSerializer(serializers.ModelSerializer):
    options = ChoiceCreateSerializer(many=True)
    # Allow backend to auto-generate IDs when not provided
    id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Question
        fields = ("id", "text", "image_url", "explanation", "order", "options")

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
        fields = ("id", "name", "icon", "description", "tags", "questions")

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

    def update(self, instance, validated_data):
        questions_data = validated_data.pop("questions", [])
        tag_names = validated_data.pop("tags", [])
        
        # Update basic fields
        instance.name = validated_data.get('name', instance.name)
        instance.description = validated_data.get('description', instance.description)
        instance.icon = validated_data.get('icon', instance.icon)
        instance.save()
        
        # Update tags
        tags = []
        for tag_name in tag_names:
            if isinstance(tag_name, str) and tag_name.strip():
                tag, created = Tag.objects.get_or_create(name=tag_name.strip())
                tags.append(tag)
        instance.tags.set(tags)
        
        # Delete all existing questions and recreate them
        # This is simpler than trying to update/match existing ones
        instance.questions.all().delete()
        
        # Create new questions
        for idx, question_data in enumerate(questions_data):
            question_data['quiz'] = instance
            question_data['order'] = idx
            QuestionCreateSerializer().create(question_data)
        
        return instance


class UserSerializer(serializers.ModelSerializer):
    """Basic user information serializer"""
    class Meta:
        model = User
        fields = ("id", "username")


class MessageSerializer(serializers.ModelSerializer):
    """Serializer for messages between users"""
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    recipient_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Message
        fields = ("id", "sender", "recipient", "sender_id", "recipient_id", 
                  "content", "created_at", "is_read")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        # Get recipient from recipient_id
        recipient_id = validated_data.pop('recipient_id')
        recipient = User.objects.get(id=recipient_id)
        validated_data['recipient'] = recipient
        # sender will be set in the view from request.user
        return super().create(validated_data)


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for quiz comments"""

    user = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Comment
        fields = ("id", "user", "text", "created_at")
        read_only_fields = ("id", "user", "created_at")

class QuizShareSerializer(serializers.ModelSerializer):
    """Serializer for sharing quizzes between users"""
    sender = UserSerializer(read_only=True)
    recipient = UserSerializer(read_only=True)
    quiz_data = QuizListSerializer(source="quiz", read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    recipient_id = serializers.IntegerField(write_only=True)
    quiz_id = serializers.CharField(write_only=True)

    class Meta:
        model = QuizShare
        fields = ("id", "sender", "recipient", "quiz_data", "sender_id", 
                  "recipient_id", "quiz_id", "message", "created_at", "is_viewed")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        # Get quiz from quiz_id
        quiz_id = validated_data.pop('quiz_id')
        quiz = Quiz.objects.get(id=quiz_id)
        validated_data['quiz'] = quiz
        # Get recipient from recipient_id
        recipient_id = validated_data.pop('recipient_id')
        recipient = User.objects.get(id=recipient_id)
        validated_data['recipient'] = recipient
        # sender will be set in the view from request.user
        return super().create(validated_data)


class FavoriteSerializer(serializers.ModelSerializer):
    """Serializer for user favorites"""
    quiz_id = serializers.CharField(write_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "quiz_id")
        read_only_fields = ("id",)

    def create(self, validated_data):
        quiz_id = validated_data.pop("quiz_id")
        quiz = Quiz.objects.get(id=quiz_id)
        user = self.context.get("request").user
        favorite, _ = Favorite.objects.get_or_create(user=user, quiz=quiz)
        return favorite


class FavoriteListSerializer(serializers.ModelSerializer):
    """Serializer for listing favorites with quiz data"""
    quiz = QuizListSerializer(read_only=True)

    class Meta:
        model = Favorite
        fields = ("id", "quiz")
        read_only_fields = ("id", "quiz")

