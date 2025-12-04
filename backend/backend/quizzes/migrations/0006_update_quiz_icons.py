# Generated migration to add icons to existing quizzes

from django.db import migrations


def add_icons_to_quizzes(apps, schema_editor):
    Quiz = apps.get_model("quizzes", "Quiz")

    icon_mapping = {
        "q-math-hard": "🧮",
        "q-math-basics": "➕",
        "q-planet-facts": "🪐",
        "q-coding-first-steps": "💻",
        "q-artist-spotlight": "🎨",
        "q-coffee-break-trivia": "☕",
    }

    for quiz_id, icon in icon_mapping.items():
        Quiz.objects.filter(id=quiz_id).update(icon=icon)


def remove_icons_from_quizzes(apps, schema_editor):
    Quiz = apps.get_model("quizzes", "Quiz")
    Quiz.objects.all().update(icon="📝")


class Migration(migrations.Migration):

    dependencies = [
        ("quizzes", "0005_add_icon_to_quiz"),
    ]

    operations = [migrations.RunPython(add_icons_to_quizzes, remove_icons_from_quizzes)]

