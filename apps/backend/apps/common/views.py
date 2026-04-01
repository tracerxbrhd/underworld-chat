from django.conf import settings
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .i18n import localized


class HealthcheckView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    def get(self, request):
        return Response(
            {
                "status": "ok",
                "service": localized(request, en="backend", ru="backend"),
                "auth_mode": localized(
                    request,
                    en="login-password-and-device-sessions",
                    ru="login-password-and-device-sessions",
                ),
                "realtime": localized(request, en="channels", ru="channels"),
                "storage_bucket": settings.S3_BUCKET,
            }
        )
