from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.chats.models import Chat
from apps.messages.models import Message, MessageReceipt, MessageVersion
from apps.messages.serializers import MessageCreateSerializer, MessageSerializer


class MessageListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, chat_id):
        chat = Chat.objects.filter(id=chat_id, memberships__user=request.user).distinct().first()
        if not chat:
            return Response(status=status.HTTP_404_NOT_FOUND)

        messages = chat.messages.select_related("sender").order_by("created_at")
        serializer = MessageSerializer(messages, many=True, context={"request": request})
        return Response(serializer.data)

    def post(self, request, chat_id):
        chat = Chat.objects.filter(id=chat_id, memberships__user=request.user).distinct().first()
        if not chat:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        message = Message.objects.create(
            chat=chat,
            sender=request.user,
            ciphertext=serializer.validated_data["body"],
        )
        chat.save(update_fields=["updated_at"])
        MessageReceipt.objects.get_or_create(
            message=message,
            user=request.user,
            defaults={
                "delivered_at": message.created_at,
                "read_at": message.created_at,
            },
        )
        return Response(
            MessageSerializer(message, context={"request": request}).data,
            status=status.HTTP_201_CREATED,
        )


class MessageDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def patch(self, request, message_id):
        message = (
            Message.objects.select_related("chat")
            .filter(id=message_id, sender=request.user, chat__memberships__user=request.user)
            .distinct()
            .first()
        )
        if not message:
            return Response(status=status.HTTP_404_NOT_FOUND)

        serializer = MessageCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        next_version = message.versions.count() + 1
        MessageVersion.objects.create(
            message=message,
            version_number=next_version,
            ciphertext=message.ciphertext,
            edited_by=request.user,
        )
        edited_at = timezone.now()
        message.ciphertext = serializer.validated_data["body"]
        message.edited_at = edited_at
        message.save(update_fields=["ciphertext", "edited_at", "updated_at"])
        return Response(MessageSerializer(message, context={"request": request}).data)

    def delete(self, request, message_id):
        message = (
            Message.objects.select_related("chat")
            .filter(id=message_id, sender=request.user, chat__memberships__user=request.user)
            .distinct()
            .first()
        )
        if not message:
            return Response(status=status.HTTP_404_NOT_FOUND)

        deleted_at = timezone.now()
        message.deleted_at = deleted_at
        message.save(update_fields=["deleted_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)


class MessageReadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, message_id):
        message = (
            Message.objects.select_related("chat")
            .filter(id=message_id, chat__memberships__user=request.user)
            .distinct()
            .first()
        )
        if not message:
            return Response(status=status.HTTP_404_NOT_FOUND)

        read_at = timezone.now()
        receipt, _ = MessageReceipt.objects.get_or_create(message=message, user=request.user)
        receipt.delivered_at = receipt.delivered_at or message.created_at
        receipt.read_at = read_at
        receipt.save(update_fields=["delivered_at", "read_at", "updated_at"])
        return Response(status=status.HTTP_204_NO_CONTENT)
