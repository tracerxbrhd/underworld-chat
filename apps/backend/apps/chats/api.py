from django.db.models import Q
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.models import User
from apps.chats.models import Chat, ChatMember, ConversationKey
from apps.chats.serializers import ChatCreateSerializer, ChatSearchSerializer, ChatSerializer, UserSearchSerializer
from apps.chats.services import ensure_personal_notes_chat, find_direct_chat
from apps.messages.serializers import MessageSerializer


class ChatListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        ensure_personal_notes_chat(request.user)
        chats = (
            Chat.objects.filter(Q(memberships__user=request.user) | Q(personal_for=request.user))
            .prefetch_related("memberships__user", "messages")
            .distinct()
            .order_by("-updated_at")
        )
        serializer = ChatSerializer(chats, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ChatCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        member_public_id = serializer.validated_data.get("member_public_id")
        if member_public_id:
            member = User.objects.filter(public_id=member_public_id).first()
            if not member:
                return Response({"detail": "Requested member was not found."}, status=status.HTTP_404_NOT_FOUND)
            if member.id == request.user.id:
                chat = ensure_personal_notes_chat(request.user)
            else:
                chat = find_direct_chat(request.user, member)
                if not chat:
                    chat = Chat.objects.create(
                        kind=Chat.Kind.DIRECT,
                        title=serializer.validated_data.get("title") or "",
                        created_by=request.user,
                    )
                    ChatMember.objects.bulk_create(
                        [
                            ChatMember(chat=chat, user=request.user),
                            ChatMember(chat=chat, user=member),
                        ]
                    )
                    ConversationKey.objects.create(chat=chat)
        else:
            chat = ensure_personal_notes_chat(request.user)

        return Response(ChatSerializer(chat).data, status=status.HTTP_201_CREATED)


class ChatSearchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        query = str(request.query_params.get("q") or "").strip()
        if not query:
            return Response({"chats": [], "users": []})

        chats = (
            Chat.objects.filter(Q(memberships__user=request.user) | Q(personal_for=request.user))
            .filter(
                Q(title__icontains=query)
                | Q(memberships__user__public_id__icontains=query)
                | Q(memberships__user__display_name__icontains=query)
            )
            .prefetch_related("memberships__user", "messages")
            .distinct()
            .order_by("-updated_at")[:12]
        )

        direct_partner_ids = (
            ChatMember.objects.filter(chat__kind=Chat.Kind.DIRECT, chat__is_personal_notes=False, user=request.user)
            .values_list("chat_id", flat=True)
        )
        existing_partner_ids = (
            ChatMember.objects.filter(chat_id__in=direct_partner_ids)
            .exclude(user=request.user)
            .values_list("user_id", flat=True)
        )
        users = (
            User.objects.filter(Q(public_id__icontains=query) | Q(display_name__icontains=query))
            .exclude(id=request.user.id)
            .exclude(id__in=existing_partner_ids)
            .order_by("display_name", "public_id")[:12]
        )

        serializer = ChatSearchSerializer(
            {
                "chats": chats,
                "users": users,
            }
        )
        return Response(serializer.data)


class ChatDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, chat_id):
        chat = (
            Chat.objects.filter(id=chat_id, memberships__user=request.user)
            .prefetch_related("memberships__user", "messages__sender")
            .distinct()
            .first()
        )
        if not chat:
            return Response(status=status.HTTP_404_NOT_FOUND)

        chat_payload = ChatSerializer(chat).data
        messages = MessageSerializer(chat.messages.order_by("created_at")[:50], many=True, context={"request": request})
        return Response(
            {
                "chat": chat_payload,
                "messages": messages.data,
            }
        )


class ChatLeaveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, chat_id):
        membership = ChatMember.objects.filter(chat_id=chat_id, user=request.user).first()
        if not membership:
            return Response(status=status.HTTP_404_NOT_FOUND)

        if membership.chat.is_personal_notes:
            return Response(
                {"detail": "Personal notes channel cannot be left."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        membership.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
