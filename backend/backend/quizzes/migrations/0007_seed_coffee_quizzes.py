# Generated migration to add coffee-themed quizzes

from django.db import migrations


def seed_coffee_quizzes(apps, schema_editor):
    Tag = apps.get_model("quizzes", "Tag")
    Quiz = apps.get_model("quizzes", "Quiz")
    Question = apps.get_model("quizzes", "Question")
    Choice = apps.get_model("quizzes", "Choice")

    dataset = [
        {
            "id": "q-coffee-basics",
            "name": "Coffee Basics 101",
            "author": "Barista Bob",
            "description": "Learn the fundamentals of coffee",
            "icon": "☕",
            "tags": ["coffee", "beverages", "basics"],
            "questions": [
                {
                    "id": "bean-types",
                    "text": "What are the two main species of coffee beans?",
                    "options": [
                        "Arabica and Robusta",
                        "Espresso and Cappuccino",
                        "Light and Dark",
                        "Ground and Whole"
                    ],
                    "correctIndex": 0,
                },
                {
                    "id": "espresso-def",
                    "text": "What is an espresso?",
                    "options": [
                        "A type of coffee bean",
                        "A brewing method using pressure",
                        "A type of coffee cup",
                        "A coffee roast level"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "caffeine-content",
                    "text": "Which coffee drink typically has the most caffeine?",
                    "options": [
                        "Espresso shot",
                        "Cappuccino",
                        "Drip coffee",
                        "Latte"
                    ],
                    "correctIndex": 2,
                },
                {
                    "id": "latte-composition",
                    "text": "What is the main ingredient in a latte besides espresso?",
                    "options": [
                        "Water",
                        "Cream",
                        "Steamed milk",
                        "Foam"
                    ],
                    "correctIndex": 2,
                },
                {
                    "id": "origin",
                    "text": "Where did coffee originate?",
                    "options": [
                        "Brazil",
                        "Ethiopia",
                        "Colombia",
                        "Italy"
                    ],
                    "correctIndex": 1,
                },
            ],
        },
        {
            "id": "q-coffee-brewing",
            "name": "Coffee Brewing Methods",
            "author": "Brew Master",
            "description": "Test your knowledge of different brewing techniques",
            "icon": "🫖",
            "tags": ["coffee", "brewing", "techniques"],
            "questions": [
                {
                    "id": "french-press",
                    "text": "How long should coffee steep in a French press?",
                    "options": [
                        "1-2 minutes",
                        "4-5 minutes",
                        "10-15 minutes",
                        "30 minutes"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "pour-over",
                    "text": "What is the key to pour-over coffee?",
                    "options": [
                        "Using cold water",
                        "Pouring in a circular motion",
                        "Using instant coffee",
                        "Adding sugar first"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "cold-brew",
                    "text": "How is cold brew coffee typically made?",
                    "options": [
                        "Brewing with ice cubes",
                        "Steeping grounds in cold water for 12-24 hours",
                        "Refrigerating hot coffee",
                        "Using frozen coffee beans"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "grind-size",
                    "text": "Which brewing method requires the finest grind?",
                    "options": [
                        "French press",
                        "Cold brew",
                        "Espresso",
                        "Drip coffee"
                    ],
                    "correctIndex": 2,
                },
                {
                    "id": "water-temp",
                    "text": "What is the ideal water temperature for brewing coffee?",
                    "options": [
                        "Boiling (100°C/212°F)",
                        "90-96°C (195-205°F)",
                        "70°C (158°F)",
                        "Room temperature"
                    ],
                    "correctIndex": 1,
                },
            ],
        },
        {
            "id": "q-coffee-culture",
            "name": "Coffee Culture Around the World",
            "author": "Coffee Traveler",
            "description": "Explore coffee traditions from different countries",
            "icon": "🌍",
            "tags": ["coffee", "culture", "international"],
            "questions": [
                {
                    "id": "turkish-coffee",
                    "text": "What makes Turkish coffee unique?",
                    "options": [
                        "It's served cold",
                        "The grounds are left in the cup",
                        "It's always decaf",
                        "It's mixed with tea"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "italian-espresso",
                    "text": "In Italy, when is cappuccino traditionally consumed?",
                    "options": [
                        "After dinner",
                        "Only in the morning",
                        "Throughout the day",
                        "Never"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "vietnamese-coffee",
                    "text": "What distinguishes Vietnamese coffee?",
                    "options": [
                        "It's always iced",
                        "Sweetened condensed milk is added",
                        "It's made with tea leaves",
                        "It's served in a coconut"
                    ],
                    "correctIndex": 1,
                },
                {
                    "id": "largest-producer",
                    "text": "Which country is the world's largest coffee producer?",
                    "options": [
                        "Colombia",
                        "Ethiopia",
                        "Brazil",
                        "Vietnam"
                    ],
                    "correctIndex": 2,
                },
                {
                    "id": "cafe-cubano",
                    "text": "What is added to Cuban coffee (Café Cubano)?",
                    "options": [
                        "Rum",
                        "Demerara sugar whipped into espresso",
                        "Cinnamon",
                        "Coconut milk"
                    ],
                    "correctIndex": 1,
                },
            ],
        },
    ]

    for record in dataset:
        quiz_id = record["id"]
        tags = record.get("tags", [])
        questions = record.get("questions", [])
        quiz_defaults = {
            "name": record["name"],
            "author": record["author"],
            "description": record.get("description", ""),
            "icon": record.get("icon", "📝"),
        }
        quiz, _ = Quiz.objects.update_or_create(id=quiz_id, defaults=quiz_defaults)
        tag_objects = [Tag.objects.get_or_create(name=tag)[0] for tag in tags]
        quiz.tags.set(tag_objects)

        seen_question_ids = []
        for order, question in enumerate(questions):
            base_qid = question["id"]
            question_id = f"{quiz_id}-{base_qid}"
            seen_question_ids.append(question_id)
            q_obj, _ = Question.objects.update_or_create(
                id=question_id,
                defaults={
                    "quiz": quiz,
                    "text": question["text"],
                    "order": order,
                },
            )
            Choice.objects.filter(question=q_obj).delete()
            for idx, option in enumerate(question.get("options", [])):
                Choice.objects.create(
                    question=q_obj,
                    index=idx,
                    text=option,
                    is_correct=idx == question.get("correctIndex", -1),
                )

        Question.objects.filter(quiz=quiz).exclude(id__in=seen_question_ids).delete()


def unseed_coffee_quizzes(apps, schema_editor):
    Quiz = apps.get_model("quizzes", "Quiz")

    quiz_ids = [
        "q-coffee-basics",
        "q-coffee-brewing",
        "q-coffee-culture",
    ]

    Quiz.objects.filter(id__in=quiz_ids).delete()


class Migration(migrations.Migration):

    dependencies = [
        ("quizzes", "0006_update_quiz_icons"),
    ]

    operations = [migrations.RunPython(seed_coffee_quizzes, unseed_coffee_quizzes)]

