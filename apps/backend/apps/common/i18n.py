from rest_framework.request import Request


def localized(request: Request, *, en: str, ru: str) -> str:
    language = getattr(request, "LANGUAGE_CODE", "en")
    return ru if language.startswith("ru") else en

