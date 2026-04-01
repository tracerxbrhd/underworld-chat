import uuid
from django.conf import settings
from django.db import migrations, models
from django.utils import timezone


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ("authn", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="PresenceState",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("is_online", models.BooleanField(default=False)),
                ("is_typing", models.BooleanField(default=False)),
                ("last_seen_at", models.DateTimeField(default=timezone.now)),
                (
                    "device_session",
                    models.ForeignKey(
                        blank=True,
                        null=True,
                        on_delete=models.deletion.SET_NULL,
                        related_name="presence_states",
                        to="authn.devicesession",
                    ),
                ),
                (
                    "user",
                    models.OneToOneField(on_delete=models.deletion.CASCADE, related_name="presence_state", to=settings.AUTH_USER_MODEL),
                ),
            ],
        ),
    ]
