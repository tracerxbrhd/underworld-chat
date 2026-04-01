from rest_framework.views import APIView

from apps.common.api import planned_response


class RotateRecoveryKeyView(APIView):
    def post(self, request):
        return planned_response(
            request,
            "/api/security/rotate-recovery-key",
            note_en="Rotate the recovery key, store only its hash, and log a security event.",
            note_ru="Сменить recovery key, хранить только его хэш и записать событие безопасности.",
        )


class SecurityEventsView(APIView):
    def get(self, request):
        return planned_response(
            request,
            "/api/security/events",
            note_en="Return a compact audit feed for device, sharing, and recovery actions.",
            note_ru="Вернуть компактную ленту аудита по устройствам, действиям обмена и восстановления.",
        )
