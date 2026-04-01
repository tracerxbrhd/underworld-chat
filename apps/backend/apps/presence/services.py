from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer


def user_group_name(user_id) -> str:
    return f"user.{user_id}"


def emit_user_event(*, user_id, event: dict) -> None:
    channel_layer = get_channel_layer()
    if not channel_layer:
        return

    async_to_sync(channel_layer.group_send)(
        user_group_name(user_id),
        {
            "type": "realtime.event",
            "event": event,
        },
    )
