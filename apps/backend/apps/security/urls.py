from django.urls import path

from .api import RotateRecoveryKeyView, SecurityEventsView

urlpatterns = [
    path("rotate-recovery-key", RotateRecoveryKeyView.as_view(), name="rotate-recovery-key"),
    path("events", SecurityEventsView.as_view(), name="security-events"),
]
