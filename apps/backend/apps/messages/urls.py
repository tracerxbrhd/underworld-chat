from django.urls import path

from .api import MessageDetailView, MessageReadView

urlpatterns = [
    path("<uuid:message_id>", MessageDetailView.as_view(), name="message-detail"),
    path("<uuid:message_id>/read", MessageReadView.as_view(), name="message-read"),
]
