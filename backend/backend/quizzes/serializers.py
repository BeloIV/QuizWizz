from rest_framework import serializers

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
