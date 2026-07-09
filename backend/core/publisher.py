from __future__ import annotations

from core.event_log import EventLog
from core.events import PresentationEvent


class PresentationPublisher:
    def __init__(self, room: object | None, topic: str, event_log: EventLog) -> None:
        self.room = room
        self.topic = topic
        self.event_log = event_log

    async def publish(self, event: PresentationEvent) -> None:
        self.event_log.append(event)

        if self.room is None:
            return

        local_participant = getattr(self.room, "local_participant", None)
        if local_participant is None:
            return

        await local_participant.publish_data(
            event.to_json(),
            reliable=True,
            topic=self.topic,
        )
