from rest_framework import serializers

from apps.accounts.serializers import CompactUserSerializer, UserProfileSerializer
from apps.authn.models import DeviceSession
from apps.chats.models import Chat


class DeviceSessionSerializer(serializers.ModelSerializer):
    is_current = serializers.SerializerMethodField()

    class Meta:
        model = DeviceSession
        fields = (
            "id",
            "device_id",
            "device_name",
            "platform",
            "last_seen_at",
            "is_revoked",
            "is_current",
        )

    def get_is_current(self, obj: DeviceSession) -> bool:
        current_session = self.context.get("current_session")
        return bool(current_session and current_session.pk == obj.pk)


class NotesChannelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Chat
        fields = ("id", "title", "is_personal_notes")


class AuthEnvelopeSerializer(serializers.Serializer):
    user = CompactUserSerializer()
    profile = UserProfileSerializer()
    device_session = DeviceSessionSerializer()
    notes_channel = NotesChannelSerializer()
    access_token = serializers.CharField()
    refresh_token = serializers.CharField()
    recovery_key = serializers.CharField(required=False)
