import uuid
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="DeviceSession",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("device_id", models.UUIDField(default=uuid.uuid4, editable=False, unique=True)),
                ("device_name", models.CharField(max_length=80)),
                (
                    "platform",
                    models.CharField(
                        choices=[("web", "Web"), ("android", "Android"), ("ios", "iOS"), ("desktop", "Desktop")],
                        default="web",
                        max_length=16,
                    ),
                ),
                ("access_token_hash", models.CharField(db_index=True, max_length=64, unique=True)),
                ("refresh_token_hash", models.CharField(max_length=255)),
                ("access_token_expires_at", models.DateTimeField(default=timezone.now)),
                ("refresh_token_expires_at", models.DateTimeField(default=timezone.now)),
                ("last_seen_at", models.DateTimeField(default=timezone.now)),
                ("is_revoked", models.BooleanField(default=False)),
                (
                    "user",
                    models.ForeignKey(on_delete=models.deletion.CASCADE, related_name="device_sessions", to=settings.AUTH_USER_MODEL),
                ),
            ],
            options={"ordering": ("-last_seen_at",)},
        )
    ]
