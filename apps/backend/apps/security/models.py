from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class RecoveryCredential(UUIDPrimaryKeyModel, TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="recovery_credential",
    )
    recovery_key_hash = models.CharField(max_length=255)
    hint = models.CharField(max_length=32, blank=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    def __str__(self) -> str:
        return f"recovery:{self.user.public_id}"


class SecurityEvent(UUIDPrimaryKeyModel, TimestampedModel):
    class EventType(models.TextChoices):
        DEVICE_LOGIN = "device.login", "Device Login"
        DEVICE_REVOKED = "device.revoked", "Device Revoked"
        RECOVERY_ROTATED = "recovery.rotated", "Recovery Rotated"

    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="security_events",
    )
    device_session = models.ForeignKey(
        "authn.DeviceSession",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="security_events",
    )
    event_type = models.CharField(max_length=64, choices=EventType.choices)
    metadata = models.JSONField(default=dict, blank=True)
