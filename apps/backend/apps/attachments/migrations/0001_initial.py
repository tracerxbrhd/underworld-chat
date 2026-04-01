import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chats", "0001_initial"),
        ("chat_messages", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Attachment",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("original_name", models.CharField(max_length=255)),
                ("mime_type", models.CharField(max_length=120)),
                ("size_bytes", models.BigIntegerField()),
                ("sha256", models.CharField(max_length=64)),
                ("storage_key", models.CharField(max_length=255, unique=True)),
                ("encryption_key_ref", models.CharField(blank=True, max_length=255)),
                (
                    "status",
                    models.CharField(
                        choices=[("initiated", "Initiated"), ("uploaded", "Uploaded"), ("ready", "Ready"), ("failed", "Failed")],
                        default="initiated",
                        max_length=16,
                    ),
                ),
                (
                    "chat",
                    models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="attachments", to="chats.chat"),
                ),
                (
                    "message",
                    models.ForeignKey(blank=True, null=True, on_delete=models.deletion.CASCADE, related_name="attachments", to="chat_messages.message"),
                ),
                (
                    "uploaded_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="attachments",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
        ),
        migrations.CreateModel(
            name="AttachmentVariant",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("variant_kind", models.CharField(max_length=32)),
                ("storage_key", models.CharField(max_length=255, unique=True)),
                ("width", models.PositiveIntegerField(blank=True, null=True)),
                ("height", models.PositiveIntegerField(blank=True, null=True)),
                (
                    "attachment",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="variants", to="attachments.attachment"),
                ),
            ],
        ),
    ]
