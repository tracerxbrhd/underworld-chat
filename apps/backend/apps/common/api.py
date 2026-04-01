from rest_framework.request import Request
from rest_framework.response import Response

from .i18n import localized


def planned_response(request: Request, endpoint: str, *, note_en: str, note_ru: str) -> Response:
    return Response(
        {
            "status": "planned",
            "endpoint": endpoint,
            "note": localized(request, en=note_en, ru=note_ru),
        }
    )
