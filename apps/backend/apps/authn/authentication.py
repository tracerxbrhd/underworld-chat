from django.utils import timezone
from rest_framework import authentication, exceptions

from .models import DeviceSession
from .services import hash_token


class DeviceSessionAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        keyword, _, token = header.partition(" ")
        if keyword != self.keyword or not token:
            return None

        token_hash = hash_token(token)
        try:
            session = (
                DeviceSession.objects.select_related("user")
                .get(
                    access_token_hash=token_hash,
                    is_revoked=False,
                    access_token_expires_at__gt=timezone.now(),
                )
            )
        except DeviceSession.DoesNotExist as exc:
            raise exceptions.AuthenticationFailed("Invalid or expired access token.") from exc

        session.last_seen_at = timezone.now()
        session.save(update_fields=["last_seen_at", "updated_at"])

        return (session.user, session)

