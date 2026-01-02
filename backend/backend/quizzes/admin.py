from django.contrib import admin

from .models import Choice, Question, Quiz, Tag


class ChoiceInline(admin.TabularInline):
    model = Choice
    extra = 0


class QuestionInline(admin.StackedInline):
    model = Question
    extra = 0


@admin.register(Quiz)
class QuizAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "author")
    search_fields = ("id", "name", "author__username")
    inlines = [QuestionInline]


admin.site.register(Tag)
admin.site.register(Choice)
