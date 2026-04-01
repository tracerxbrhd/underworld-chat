from apps.chats.models import Chat, ChatMember, ConversationKey


def ensure_personal_notes_chat(user):
    chat = (
        Chat.objects.filter(personal_for=user, is_personal_notes=True)
        .prefetch_related("memberships")
        .first()
    )
    if chat:
        return chat

    title = "Заметки" if getattr(getattr(user, "profile", None), "preferred_language", "en") == "ru" else "Notes"
    chat = Chat.objects.create(
        kind=Chat.Kind.DIRECT,
        title=title,
        created_by=user,
        personal_for=user,
        is_personal_notes=True,
    )
    ChatMember.objects.create(chat=chat, user=user)
    ConversationKey.objects.create(chat=chat)
    return chat


def find_direct_chat(user, other_user):
    return (
        Chat.objects.filter(
            kind=Chat.Kind.DIRECT,
            is_personal_notes=False,
            memberships__user=user,
        )
        .filter(memberships__user=other_user)
        .distinct()
        .first()
    )
