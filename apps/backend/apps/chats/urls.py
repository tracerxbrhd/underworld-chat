from django.urls import path

from apps.messages.api import MessageListCreateView

from .api import ChatDetailView, ChatLeaveView, ChatListCreateView, ChatSearchView

urlpatterns = [
    path("", ChatListCreateView.as_view(), name="chat-list"),
    path("search", ChatSearchView.as_view(), name="chat-search"),
    path("<uuid:chat_id>", ChatDetailView.as_view(), name="chat-detail"),
    path("<uuid:chat_id>/messages", MessageListCreateView.as_view(), name="chat-messages"),
    path("<uuid:chat_id>/leave", ChatLeaveView.as_view(), name="chat-leave"),
]
