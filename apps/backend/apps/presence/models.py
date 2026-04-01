from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class PresenceState(UUIDPrimaryKeyModel, TimestampedModel):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="presence_state",
    )
    device_session = models.ForeignKey(
        "authn.DeviceSession",
        on_delete=models.SET_NULL,
        related_name="presence_states",
        null=True,
        blank=True,
    )
    is_online = models.BooleanField(default=False)
    is_typing = models.BooleanField(default=False)
    last_seen_at = models.DateTimeField(default=timezone.now)

