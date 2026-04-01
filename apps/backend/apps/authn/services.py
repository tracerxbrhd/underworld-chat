import hashlib
import secrets
from dataclasses import dataclass
from datetime import timedelta

from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone

from apps.accounts.models import User, UserProfile
from apps.security.models import RecoveryCredential, SecurityEvent

from .models import DeviceSession

ACCESS_TOKEN_TTL = timedelta(hours=12)
REFRESH_TOKEN_TTL = timedelta(days=30)

PUBLIC_ID_PREFIXES = (
    "cipher",
    "ghost",
    "night",
    "shadow",
    "signal",
    "veil",
)

PUBLIC_ID_SUFFIXES = (
    "arc",
    "drift",
    "echo",
    "forge",
    "owl",
    "pulse",
    "trace",
)


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


def generate_public_id() -> str:
    while True:
        candidate = (
            f"{secrets.choice(PUBLIC_ID_PREFIXES)}-"
            f"{secrets.choice(PUBLIC_ID_SUFFIXES)}-"
            f"{secrets.token_hex(2)}"
        )
        if not User.objects.filter(public_id=candidate).exists():
            return candidate


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


def bootstrap_user(*, preferred_language: str, device_name: str, platform: str):
    from apps.chats.services import ensure_personal_notes_chat

    public_id = generate_public_id()
    user = User.objects.create_user(
        public_id=public_id,
        display_name=public_id,
        avatar="",
    )
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
    ensure_personal_notes_chat(user)
    session, token_pair = create_device_session(
        user=user,
        device_name=device_name,
        platform=platform,
    )
    return user, session, token_pair, recovery_key


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
