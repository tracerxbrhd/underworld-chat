from rest_framework import serializers

from apps.accounts.models import User
from apps.chats.models import Chat, ChatMember
from apps.messages.models import Message


class ChatMemberSerializer(serializers.ModelSerializer):
    public_id = serializers.CharField(source="user.public_id", read_only=True)
    display_name = serializers.CharField(source="user.display_name", read_only=True)
    avatar = serializers.URLField(source="user.avatar", read_only=True)

    class Meta:
        model = ChatMember
        fields = ("id", "public_id", "display_name", "avatar", "joined_at", "is_muted")


class ChatSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    members = ChatMemberSerializer(source="memberships", many=True, read_only=True)
    last_message_preview = serializers.SerializerMethodField()
    last_message_at = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = (
            "id",
            "kind",
            "title",
            "is_personal_notes",
            "members",
            "last_message_preview",
            "last_message_at",
            "updated_at",
        )

    def get_title(self, obj: Chat) -> str:
        if obj.is_personal_notes:
            return obj.title or "Notes"
        if obj.title:
            return obj.title

        request = self.context.get("request")
        current_user = getattr(request, "user", None)
        for membership in obj.memberships.all():
            if current_user and membership.user_id == current_user.id:
                continue
            return membership.user.display_name or membership.user.public_id

        return "Direct chat"

    def get_last_message_preview(self, obj: Chat) -> str:
        message = obj.messages.filter(deleted_at__isnull=True).order_by("-created_at").first()
        if not message:
            return ""
        if message.kind == Message.Kind.SYSTEM:
            return "System message"
        return message.ciphertext[:120]

    def get_last_message_at(self, obj: Chat):
        message = obj.messages.filter(deleted_at__isnull=True).order_by("-created_at").first()
        return message.created_at if message else None


class ChatCreateSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=120, required=False, allow_blank=True)
    member_public_id = serializers.CharField(max_length=32, required=False)
    kind = serializers.ChoiceField(choices=Chat.Kind.choices, default=Chat.Kind.DIRECT)


class UserSearchSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("id", "public_id", "display_name", "avatar")


class ChatSearchSerializer(serializers.Serializer):
    chats = ChatSerializer(many=True)
    users = UserSearchSerializer(many=True)
