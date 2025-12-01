from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0002_auto_20231201_0851'),
    ]

    operations = [
        migrations.AddField(
            model_name='question',
            name='question_type',
            field=models.CharField(choices=[('MULTIPLE_CHOICE', 'Multiple Choice'), ('FILL_IN_THE_GAP', 'Fill in the Gap')], default='MULTIPLE_CHOICE', max_length=20),
        ),
    ]
