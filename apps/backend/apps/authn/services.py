import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.chats.services import ensure_personal_notes_chat
from apps.messages.models import Message
from apps.security.models import RecoveryCredential, SecurityEvent

from .models import DeviceSession

ACCESS_TOKEN_TTL = timedelta(hours=12)
REFRESH_TOKEN_TTL = timedelta(days=30)

@dataclass
class IssuedTokenPair:
    access_token: str
    refresh_token: str
    access_token_hash: str
    refresh_token_hash: str
    access_token_expires_at: timezone.datetime
    refresh_token_expires_at: timezone.datetime


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def issue_token_pair() -> IssuedTokenPair:
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(48)
    now = timezone.now()
    return IssuedTokenPair(
        access_token=access_token,
        refresh_token=refresh_token,
        access_token_hash=hash_token(access_token),
        refresh_token_hash=hash_token(refresh_token),
        access_token_expires_at=now + ACCESS_TOKEN_TTL,
        refresh_token_expires_at=now + REFRESH_TOKEN_TTL,
    )

def issue_recovery_key() -> tuple[str, str]:
    recovery_key = secrets.token_urlsafe(36)
    return recovery_key, make_password(recovery_key)


def verify_recovery_key(raw_value: str, hashed_value: str) -> bool:
    return check_password(raw_value, hashed_value)


def build_device_name(raw_name: str | None, platform: str) -> str:
    cleaned = (raw_name or "").strip()
    if cleaned:
        return cleaned[:80]
    return f"{platform.title()} device"


def create_device_session(*, user: User, device_name: str, platform: str) -> tuple[DeviceSession, IssuedTokenPair]:
    token_pair = issue_token_pair()
    session = DeviceSession.objects.create(
        user=user,
        device_name=device_name,
        platform=platform,
        access_token_hash=token_pair.access_token_hash,
        refresh_token_hash=token_pair.refresh_token_hash,
        access_token_expires_at=token_pair.access_token_expires_at,
        refresh_token_expires_at=token_pair.refresh_token_expires_at,
    )
    SecurityEvent.objects.create(
        actor=user,
        device_session=session,
        event_type=SecurityEvent.EventType.DEVICE_LOGIN,
        metadata={
            "device_name": session.device_name,
            "platform": session.platform,
        },
    )
    return session, token_pair


def build_recovery_message(*, public_id: str, recovery_key: str, preferred_language: str) -> str:
    if preferred_language == "ru":
        return (
            "Ключ восстановления для этого аккаунта.\n\n"
            f"Логин: @{public_id}\n"
            f"Ключ: {recovery_key}\n\n"
            "Сохрани это сообщение в надежном месте. "
            "Этот ключ пригодится для восстановления доступа на новом устройстве."
        )
    return (
        "Recovery key for this account.\n\n"
        f"Login: @{public_id}\n"
        f"Key: {recovery_key}\n\n"
        "Store this message somewhere safe. "
        "You can use this key to recover access on a new device."
    )


def append_recovery_message(*, user: User, recovery_key: str, preferred_language: str) -> None:
    notes_chat = ensure_personal_notes_chat(user)
    Message.objects.create(
        chat=notes_chat,
        sender=user,
        kind=Message.Kind.SYSTEM,
        ciphertext=build_recovery_message(
            public_id=user.public_id,
            recovery_key=recovery_key,
            preferred_language=preferred_language,
        ),
    )
    notes_chat.save(update_fields=["updated_at"])


def register_user(*, public_id: str, password: str, display_name: str, preferred_language: str, device_name: str, platform: str):
    user = User.objects.create_user(
        public_id=public_id,
        password=password,
        display_name=public_id,
        avatar="",
    )
    if display_name:
        user.display_name = display_name
        user.save(update_fields=["display_name", "updated_at"])
    UserProfile.objects.create(
        user=user,
        preferred_language=preferred_language if preferred_language in {"en", "ru"} else "en",
    )
    recovery_key, recovery_key_hash = issue_recovery_key()
    RecoveryCredential.objects.create(
        user=user,
        recovery_key_hash=recovery_key_hash,
        hint=recovery_key[-6:],
    )
    append_recovery_message(
        user=user,
        recovery_key=recovery_key,
        preferred_language=preferred_language if preferred_language in {"en", "ru"} else "en",
    )
    session, token_pair = create_device_session(
        user=user,
        device_name=device_name,
        platform=platform,
    )
    return user, session, token_pair, recovery_key


def authenticate_user(*, public_id: str, password: str) -> User | None:
    user = User.objects.select_related("profile").filter(public_id=public_id, is_active=True).first()
    if not user or not user.check_password(password):
        return None
    return user


def rotate_session_tokens(session: DeviceSession) -> IssuedTokenPair:
    token_pair = issue_token_pair()
    session.access_token_hash = token_pair.access_token_hash
    session.refresh_token_hash = token_pair.refresh_token_hash
    session.access_token_expires_at = token_pair.access_token_expires_at
    session.refresh_token_expires_at = token_pair.refresh_token_expires_at
    session.last_seen_at = timezone.now()
    session.save(
        update_fields=[
            "access_token_hash",
            "refresh_token_hash",
            "access_token_expires_at",
            "refresh_token_expires_at",
            "last_seen_at",
            "updated_at",
        ]
    )
    return token_pair
