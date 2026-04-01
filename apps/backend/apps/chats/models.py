from django.conf import settings
from django.db import models

from apps.common.models import TimestampedModel, UUIDPrimaryKeyModel


class Chat(UUIDPrimaryKeyModel, TimestampedModel):
    class Kind(models.TextChoices):
        DIRECT = "direct", "Direct"
        GROUP = "group", "Group"

    kind = models.CharField(max_length=16, choices=Kind.choices, default=Kind.DIRECT)
    title = models.CharField(max_length=120, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_chats",
    )
    personal_for = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="personal_note_chats",
    )
    is_personal_notes = models.BooleanField(default=False)
    is_archived = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=("personal_for",),
                condition=models.Q(is_personal_notes=True),
                name="unique_personal_notes_chat",
            ),
        ]

    def __str__(self) -> str:
        return self.title or f"{self.kind}:{self.id}"


class ChatMember(UUIDPrimaryKeyModel, TimestampedModel):
    chat = models.ForeignKey("chats.Chat", on_delete=models.CASCADE, related_name="memberships")
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="chat_memberships",
    )
    joined_at = models.DateTimeField(auto_now_add=True)
    is_muted = models.BooleanField(default=False)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=("chat", "user"), name="unique_chat_membership"),
        ]

    def __str__(self) -> str:
        return f"{self.user.public_id}@{self.chat_id}"


class ConversationKey(UUIDPrimaryKeyModel, TimestampedModel):
    chat = models.OneToOneField("chats.Chat", on_delete=models.CASCADE, related_name="conversation_key")
    algorithm = models.CharField(max_length=32, default="xchacha20poly1305")
    wrapped_key = models.TextField(blank=True)
    key_version = models.PositiveIntegerField(default=1)

    def __str__(self) -> str:
        return f"{self.chat_id}:v{self.key_version}"
