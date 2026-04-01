import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="Chat",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("kind", models.CharField(choices=[("direct", "Direct"), ("group", "Group")], default="direct", max_length=16)),
                ("title", models.CharField(blank=True, max_length=120)),
                ("is_personal_notes", models.BooleanField(default=False)),
                ("is_archived", models.BooleanField(default=False)),
                (
                    "created_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="created_chats",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "personal_for",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.CASCADE,
                        related_name="personal_note_chats",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={},
        ),
        migrations.CreateModel(
            name="ConversationKey",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("algorithm", models.CharField(default="xchacha20poly1305", max_length=32)),
                ("wrapped_key", models.TextField(blank=True)),
                ("key_version", models.PositiveIntegerField(default=1)),
                (
                    "chat",
                    models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="conversation_key", to="chats.chat"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="ChatMember",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("joined_at", models.DateTimeField(auto_now_add=True)),
                ("is_muted", models.BooleanField(default=False)),
                (
                    "chat",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="memberships", to="chats.chat"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="chat_memberships", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="chat",
            constraint=models.UniqueConstraint(
                condition=models.Q(("is_personal_notes", True)),
                fields=("personal_for",),
                name="unique_personal_notes_chat",
            ),
        ),
        migrations.AddConstraint(
            model_name="chatmember",
            constraint=models.UniqueConstraint(fields=("chat", "user"), name="unique_chat_membership"),
        ),
    ]
