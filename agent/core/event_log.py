from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from core.events import PresentationEvent


class EventLog:
    def __init__(self, path: Path) -> None:
        self.path = path

    def append(self, event: PresentationEvent) -> None:
        self.path.parent.mkdir(parents=True, exist_ok=True)
        record: dict[str, Any] = {
            "timestamp": datetime.now(UTC).isoformat(),
            **event.wire_payload(),
        }
        with self.path.open("a", encoding="utf-8") as file:
            file.write(json.dumps(record, ensure_ascii=False) + "\n")
