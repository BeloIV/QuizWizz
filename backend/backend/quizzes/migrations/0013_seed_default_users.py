# Migration to create 3 default users

from django.db import migrations
from django.contrib.auth.hashers import make_password


def create_default_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    
    # Create 3 users with simple passwords
    users_data = [
        {'username': 'user1', 'password': 'user1'},
        {'username': 'user2', 'password': 'user2'},
        {'username': 'user3', 'password': 'user3'},
    ]
    
    for user_data in users_data:
        if not User.objects.filter(username=user_data['username']).exists():
            User.objects.create(
                username=user_data['username'],
                password=make_password(user_data['password']),
                is_staff=False,
                is_superuser=False,
            )


def remove_default_users(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username__in=['user1', 'user2', 'user3']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('quizzes', '0012_message_quizshare'),
    ]

    operations = [
        migrations.RunPython(create_default_users, remove_default_users),
    ]
