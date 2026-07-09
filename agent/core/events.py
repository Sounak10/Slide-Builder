from __future__ import annotations

import json
from typing import Any, Literal

from pydantic import BaseModel, Field


EventName = Literal["presentation_loaded", "presentation_updated", "goto_slide"]


class PresentationEvent(BaseModel):
    event: EventName
    payload: dict[str, Any] = Field(default_factory=dict)

    @classmethod
    def loaded(cls, markdown: str) -> PresentationEvent:
        return cls(event="presentation_loaded", payload={"markdown": markdown})

    @classmethod
    def updated(cls, markdown: str) -> PresentationEvent:
        return cls(event="presentation_updated", payload={"markdown": markdown})

    @classmethod
    def goto_slide(cls, slide: int) -> PresentationEvent:
        return cls(event="goto_slide", payload={"slide": slide})

    def wire_payload(self) -> dict[str, Any]:
        return {"event": self.event, **self.payload}

    def to_json(self) -> str:
        return json.dumps(self.wire_payload(), ensure_ascii=False)
