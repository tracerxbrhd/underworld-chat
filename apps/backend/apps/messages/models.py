from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class Message(UUIDPrimaryKeyModel, TimestampedModel):
    class Kind(models.TextChoices):
        TEXT = "text", "Text"
        FILE = "file", "File"
        SYSTEM = "system", "System"

    chat = models.ForeignKey("chats.Chat", on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="sent_messages",
    )
    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.TEXT)
    ciphertext = models.TextField()
    nonce = models.CharField(max_length=128, blank=True)
    key_version = models.PositiveIntegerField(default=1)
    edited_at = models.DateTimeField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("created_at",)

    def __str__(self) -> str:
        return f"{self.chat_id}:{self.kind}:{self.id}"


class MessageVersion(UUIDPrimaryKeyModel, TimestampedModel):
    message = models.ForeignKey("chat_messages.Message", on_delete=models.CASCADE, related_name="versions")
    version_number = models.PositiveIntegerField()
    ciphertext = models.TextField()
    edited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="edited_messages",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("message", "version_number"), name="unique_message_version"),
        ]


class MessageReceipt(UUIDPrimaryKeyModel, TimestampedModel):
    message = models.ForeignKey("chat_messages.Message", on_delete=models.CASCADE, related_name="receipts")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="message_receipts",
    )
    delivered_at = models.DateTimeField(null=True, blank=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("message", "user"), name="unique_message_receipt"),
        ]
