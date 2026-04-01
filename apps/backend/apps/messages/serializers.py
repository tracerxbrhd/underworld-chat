from rest_framework import serializers

from .models import Message


class MessageSerializer(serializers.ModelSerializer):
    sender_public_id = serializers.CharField(source="sender.public_id", read_only=True)
    body = serializers.CharField(source="ciphertext", read_only=True)
    is_self = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = (
            "id",
            "chat_id",
            "sender_public_id",
            "body",
            "kind",
            "created_at",
            "edited_at",
            "deleted_at",
            "is_self",
        )

    def get_is_self(self, obj: Message) -> bool:
        request = self.context.get("request")
        return bool(request and request.user.is_authenticated and obj.sender_id == request.user.id)


class MessageCreateSerializer(serializers.Serializer):
    body = serializers.CharField(max_length=4000)
