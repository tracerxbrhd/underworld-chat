from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth.models import AnonymousUser
from django.utils import timezone

from .models import DeviceSession
from .services import hash_token


@database_sync_to_async
def authenticate_ws_token(token: str | None):
    if not token:
        return AnonymousUser(), None

    session = (
        DeviceSession.objects.select_related("user")
        .filter(
            access_token_hash=hash_token(token),
            is_revoked=False,
            access_token_expires_at__gt=timezone.now(),
        )
        .first()
    )
    if not session:
        return AnonymousUser(), None

    session.last_seen_at = timezone.now()
    session.save(update_fields=["last_seen_at", "updated_at"])
    return session.user, session


class DeviceSessionAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode("utf-8")
        token = parse_qs(query_string).get("token", [None])[0]
        user, session = await authenticate_ws_token(token)
        scope["user"] = user
        scope["device_session"] = session
        return await super().__call__(scope, receive, send)


def DeviceSessionAuthMiddlewareStack(inner):
    return DeviceSessionAuthMiddleware(inner)
