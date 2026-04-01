import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("chats", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Message",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("kind", models.CharField(choices=[("text", "Text"), ("file", "File"), ("system", "System")], default="text", max_length=16)),
                ("ciphertext", models.TextField()),
                ("nonce", models.CharField(blank=True, max_length=128)),
                ("key_version", models.PositiveIntegerField(default=1)),
                ("edited_at", models.DateTimeField(blank=True, null=True)),
                ("deleted_at", models.DateTimeField(blank=True, null=True)),
                (
                    "chat",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="messages", to="chats.chat"),
                ),
                (
                    "sender",
                    models.ForeignKey(
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="sent_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ("created_at",)},
        ),
        migrations.CreateModel(
            name="MessageVersion",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("version_number", models.PositiveIntegerField()),
                ("ciphertext", models.TextField()),
                (
                    "edited_by",
                    models.ForeignKey(
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="edited_messages",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
                (
                    "message",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="versions", to="chat_messages.message"),
                ),
            ],
        ),
        migrations.CreateModel(
            name="MessageReceipt",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("delivered_at", models.DateTimeField(blank=True, null=True)),
                ("read_at", models.DateTimeField(blank=True, null=True)),
                (
                    "message",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="receipts", to="chat_messages.message"),
                ),
                (
                    "user",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="message_receipts", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
        migrations.AddConstraint(
            model_name="messageversion",
            constraint=models.UniqueConstraint(fields=("message", "version_number"), name="unique_message_version"),
        ),
        migrations.AddConstraint(
            model_name="messagereceipt",
            constraint=models.UniqueConstraint(fields=("message", "user"), name="unique_message_receipt"),
        ),
    ]
