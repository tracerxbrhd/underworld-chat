from django.urls import include, path

from apps.accounts.api import ProfileView
from apps.authn.api import DeviceDetailView, DeviceListView
from apps.chats.api import ChatListCreateView

urlpatterns = [
    path("auth/", include("apps.authn.urls")),
    path("chats", ChatListCreateView.as_view(), name="chat-list-root"),
    path("devices", DeviceListView.as_view(), name="device-list"),
    path("devices/<uuid:session_id>", DeviceDetailView.as_view(), name="device-detail"),
    path("profile", ProfileView.as_view(), name="profile"),
    path("chats/", include("apps.chats.urls")),
    path("messages/", include("apps.messages.urls")),
    path("attachments/", include("apps.attachments.urls")),
    path("security/", include("apps.security.urls")),
]
