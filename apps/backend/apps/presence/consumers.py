from channels.generic.websocket import AsyncJsonWebsocketConsumer


class PresenceConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        await self.accept()
        await self.send_json(
            {
                "type": "session.ready",
                "detail": "WebSocket scaffold is online.",
            }
        )

    async def receive_json(self, content, **kwargs):
        event_type = content.get("type", "echo")

        if event_type == "ping":
            await self.send_json({"type": "pong"})
            return

        if event_type in {"typing.start", "typing.stop"}:
            await self.send_json({"type": event_type, "accepted": True})
            return

        await self.send_json({"type": "echo", "payload": content})

