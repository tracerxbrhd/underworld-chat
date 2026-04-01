import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class DeviceSession(UUIDPrimaryKeyModel, TimestampedModel):
    class Platform(models.TextChoices):
        WEB = "web", "Web"
        ANDROID = "android", "Android"
        IOS = "ios", "iOS"
        DESKTOP = "desktop", "Desktop"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="device_sessions",
    )
    device_id = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    device_name = models.CharField(max_length=80)
    platform = models.CharField(max_length=16, choices=Platform.choices, default=Platform.WEB)
    access_token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    refresh_token_hash = models.CharField(max_length=255)
    access_token_expires_at = models.DateTimeField(default=timezone.now)
    refresh_token_expires_at = models.DateTimeField(default=timezone.now)
    last_seen_at = models.DateTimeField(default=timezone.now)
    is_revoked = models.BooleanField(default=False)

    class Meta:
        ordering = ("-last_seen_at",)

    def __str__(self) -> str:
        return f"{self.user.public_id}:{self.device_name}"
