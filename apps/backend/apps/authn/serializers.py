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


class RegisterInputSerializer(serializers.Serializer):
    public_id = serializers.SlugField(max_length=32)
    password = serializers.CharField(min_length=8, max_length=128, trim_whitespace=False)
    display_name = serializers.CharField(max_length=64, required=False, allow_blank=True)
    preferred_language = serializers.ChoiceField(choices=("en", "ru"), required=False)
    device_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    platform = serializers.CharField(max_length=16, required=False, allow_blank=True)

    def validate_public_id(self, value: str) -> str:
        normalized = value.strip().lower()
        from apps.accounts.models import User

        if User.objects.filter(public_id__iexact=normalized).exists():
            raise serializers.ValidationError("This login is already taken.")
        return normalized


class LoginInputSerializer(serializers.Serializer):
    public_id = serializers.SlugField(max_length=32)
    password = serializers.CharField(min_length=1, max_length=128, trim_whitespace=False)
    device_name = serializers.CharField(max_length=80, required=False, allow_blank=True)
    platform = serializers.CharField(max_length=16, required=False, allow_blank=True)

    def validate_public_id(self, value: str) -> str:
        return value.strip().lower()
