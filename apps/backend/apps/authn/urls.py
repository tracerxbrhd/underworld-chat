from django.urls import path

from .api import (
    DeviceListView,
    LoginView,
    LogoutView,
    MeView,
    PairDeviceView,
    RegisterView,
    RecoverView,
    RefreshView,
)

urlpatterns = [
    path("register", RegisterView.as_view(), name="register"),
    path("login", LoginView.as_view(), name="login"),
    path("refresh", RefreshView.as_view(), name="refresh"),
    path("logout", LogoutView.as_view(), name="logout"),
    path("recover", RecoverView.as_view(), name="recover"),
    path("pair-device", PairDeviceView.as_view(), name="pair-device"),
    path("me", MeView.as_view(), name="me"),
    path("devices", DeviceListView.as_view(), name="devices"),
]
