from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.serializers import UserProfileSerializer
from apps.chats.services import ensure_personal_notes_chat
from apps.security.models import RecoveryCredential, SecurityEvent

from .models import DeviceSession
from .serializers import AuthEnvelopeSerializer, DeviceSessionSerializer
from .services import (
    build_device_name,
    bootstrap_user,
    create_device_session,
    hash_token,
    rotate_session_tokens,
    verify_recovery_key,
)


class AnonymousRegisterView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_platform = str(request.data.get("platform") or DeviceSession.Platform.WEB)
        platform = raw_platform if raw_platform in DeviceSession.Platform.values else DeviceSession.Platform.WEB
        preferred_language = request.data.get("preferred_language") or getattr(request, "LANGUAGE_CODE", "en")
        device_name = build_device_name(request.data.get("device_name"), platform)

        user, session, token_pair, recovery_key = bootstrap_user(
            preferred_language=preferred_language,
            device_name=device_name,
            platform=platform,
        )
        payload = {
            "user": user,
            "profile": user.profile,
            "device_session": session,
            "notes_channel": ensure_personal_notes_chat(user),
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
            "recovery_key": recovery_key,
        }
        serializer = AuthEnvelopeSerializer(
            payload,
            context={"current_session": session},
        )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class RefreshView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        refresh_token = str(request.data.get("refresh_token") or "").strip()
        if not refresh_token:
            return Response({"detail": "refresh_token is required."}, status=status.HTTP_400_BAD_REQUEST)

        session = (
            DeviceSession.objects.select_related("user", "user__profile")
            .filter(
                refresh_token_hash=hash_token(refresh_token),
                is_revoked=False,
                refresh_token_expires_at__gt=timezone.now(),
            )
            .first()
        )
        if not session:
            return Response({"detail": "Invalid or expired refresh token."}, status=status.HTTP_401_UNAUTHORIZED)

        token_pair = rotate_session_tokens(session)
        payload = {
            "user": session.user,
            "profile": session.user.profile,
            "device_session": session,
            "notes_channel": ensure_personal_notes_chat(session.user),
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
        }
        serializer = AuthEnvelopeSerializer(payload, context={"current_session": session})
        return Response(serializer.data)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        session = request.auth
        if not isinstance(session, DeviceSession):
            return Response({"detail": "Authenticated device session required."}, status=status.HTTP_400_BAD_REQUEST)

        session.is_revoked = True
        session.save(update_fields=["is_revoked", "updated_at"])
        SecurityEvent.objects.create(
            actor=request.user,
            device_session=session,
            event_type=SecurityEvent.EventType.DEVICE_REVOKED,
            metadata={"reason": "logout"},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)


class RecoverView(APIView):
    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        public_id = str(request.data.get("public_id") or "").strip()
        recovery_key = str(request.data.get("recovery_key") or "").strip()
        raw_platform = str(request.data.get("platform") or DeviceSession.Platform.WEB)
        platform = raw_platform if raw_platform in DeviceSession.Platform.values else DeviceSession.Platform.WEB
        device_name = build_device_name(request.data.get("device_name"), platform)

        if not public_id or not recovery_key:
            return Response(
                {"detail": "public_id and recovery_key are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        credential = (
            RecoveryCredential.objects.select_related("user", "user__profile")
            .filter(user__public_id=public_id)
            .first()
        )
        if not credential or not verify_recovery_key(recovery_key, credential.recovery_key_hash):
            return Response({"detail": "Recovery credentials are invalid."}, status=status.HTTP_401_UNAUTHORIZED)

        credential.last_used_at = timezone.now()
        credential.save(update_fields=["last_used_at", "updated_at"])
        session, token_pair = create_device_session(
            user=credential.user,
            device_name=device_name,
            platform=platform,
        )
        payload = {
            "user": credential.user,
            "profile": credential.user.profile,
            "device_session": session,
            "notes_channel": ensure_personal_notes_chat(credential.user),
            "access_token": token_pair.access_token,
            "refresh_token": token_pair.refresh_token,
        }
        serializer = AuthEnvelopeSerializer(payload, context={"current_session": session})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PairDeviceView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {
                "status": "planned",
                "endpoint": "/api/auth/pair-device",
                "note": "QR and short pairing code flow will build on top of device-session auth.",
            }
        )


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        session = request.auth if isinstance(request.auth, DeviceSession) else None
        device_serializer = DeviceSessionSerializer(session, context={"current_session": session})
        profile_serializer = UserProfileSerializer(request.user.profile)
        return Response(
            {
                "user": {
                    "id": str(request.user.id),
                    "public_id": request.user.public_id,
                    "display_name": request.user.display_name,
                    "avatar": request.user.avatar,
                },
                "profile": profile_serializer.data,
                "device_session": device_serializer.data,
                "notes_channel_id": str(ensure_personal_notes_chat(request.user).id),
            }
        )


class DeviceListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        current_session = request.auth if isinstance(request.auth, DeviceSession) else None
        sessions = request.user.device_sessions.order_by("-last_seen_at")
        serializer = DeviceSessionSerializer(
            sessions,
            many=True,
            context={"current_session": current_session},
        )
        return Response(serializer.data)


class DeviceDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request, session_id):
        session = request.user.device_sessions.filter(id=session_id).first()
        if not session:
            return Response(status=status.HTTP_404_NOT_FOUND)

        session.is_revoked = True
        session.save(update_fields=["is_revoked", "updated_at"])
        SecurityEvent.objects.create(
            actor=request.user,
            device_session=session,
            event_type=SecurityEvent.EventType.DEVICE_REVOKED,
            metadata={"reason": "manual_revoke"},
        )
        return Response(status=status.HTTP_204_NO_CONTENT)
