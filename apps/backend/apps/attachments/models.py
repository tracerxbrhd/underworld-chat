from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class Attachment(UUIDPrimaryKeyModel, TimestampedModel):
    class Status(models.TextChoices):
        INITIATED = "initiated", "Initiated"
        UPLOADED = "uploaded", "Uploaded"
        READY = "ready", "Ready"
        FAILED = "failed", "Failed"

    chat = models.ForeignKey(
        "chats.Chat",
        on_delete=models.CASCADE,
        related_name="attachments",
        null=True,
        blank=True,
    )
    message = models.ForeignKey(
        "chat_messages.Message",
        on_delete=models.CASCADE,
        related_name="attachments",
        null=True,
        blank=True,
    )
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="attachments",
    )
    original_name = models.CharField(max_length=255)
    mime_type = models.CharField(max_length=120)
    size_bytes = models.BigIntegerField()
    sha256 = models.CharField(max_length=64)
    storage_key = models.CharField(max_length=255, unique=True)
    encryption_key_ref = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.INITIATED)

    def __str__(self) -> str:
        return self.original_name


class AttachmentVariant(UUIDPrimaryKeyModel, TimestampedModel):
    attachment = models.ForeignKey(
        "attachments.Attachment",
        on_delete=models.CASCADE,
        related_name="variants",
    )
    variant_kind = models.CharField(max_length=32)
    storage_key = models.CharField(max_length=255, unique=True)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
