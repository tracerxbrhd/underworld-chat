from django.urls import path

from .api import ProfileView

urlpatterns = [
    path("", ProfileView.as_view(), name="profile"),
]
