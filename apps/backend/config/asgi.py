import os

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django_asgi_app = get_asgi_application()

from apps.authn.ws_auth import DeviceSessionAuthMiddlewareStack  # noqa: E402
from apps.presence.routing import websocket_urlpatterns  # noqa: E402

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": DeviceSessionAuthMiddlewareStack(URLRouter(websocket_urlpatterns)),
    }
)
