from channels.generic.websocket import AsyncJsonWebsocketConsumer

from .services import user_group_name


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get("user")
        if not user or getattr(user, "is_anonymous", True):
            await self.close(code=4401)
            return

        self.user_group_name = user_group_name(user.id)
        await self.channel_layer.group_add(self.user_group_name, self.channel_name)
        await self.accept()
        await self.send_json(
            {
                "type": "session.ready",
                "detail": "WebSocket scaffold is online.",
            }
        )

    async def disconnect(self, code):
        if hasattr(self, "user_group_name"):
            await self.channel_layer.group_discard(self.user_group_name, self.channel_name)

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type", "echo")

        if event_type == "ping":
            await self.send_json({"type": "pong"})
            return

        if event_type in {"typing.start", "typing.stop"}:
            await self.send_json({"type": event_type, "accepted": True})
            return

        await self.send_json({"type": "echo", "payload": content})

    async def realtime_event(self, event):
        await self.send_json(event["event"])
