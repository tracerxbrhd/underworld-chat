from django.urls import path

from .api import (
    AnonymousRegisterView,
    DeviceListView,
    LogoutView,
    MeView,
    PairDeviceView,
    RecoverView,
    RefreshView,
)

urlpatterns = [
    path("anonymous-register", AnonymousRegisterView.as_view(), name="anonymous-register"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("recover", RecoverView.as_view(), name="recover"),
    path("pair-device", PairDeviceView.as_view(), name="pair-device"),
    path("me", MeView.as_view(), name="me"),
    path("devices", DeviceListView.as_view(), name="devices"),
]

