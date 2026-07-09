from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    livekit_llm_model: str
    livekit_stt_model: str
    livekit_tts_model: str
    livekit_tts_voice: str
    presentation_topic: str
    event_log_path: Path


def load_settings() -> Settings:
    load_dotenv()
    backend_root = Path(__file__).resolve().parents[1]
    event_log_path = Path(os.getenv("EVENT_LOG_PATH", "logs/events.jsonl"))
    if not event_log_path.is_absolute():
        event_log_path = backend_root / event_log_path

    return Settings(
        livekit_llm_model=os.getenv("LIVEKIT_LLM_MODEL", "openai/gpt-4.1-mini"),
        livekit_stt_model=os.getenv("LIVEKIT_STT_MODEL", "deepgram/nova-3"),
        livekit_tts_model=os.getenv("LIVEKIT_TTS_MODEL", "cartesia/sonic-3"),
        livekit_tts_voice=os.getenv("LIVEKIT_TTS_VOICE", "e07c00bc-4134-4eae-9ea4-1a55fb45746b"),
        presentation_topic=os.getenv("LIVEKIT_PRESENTATION_TOPIC", "presentation"),
        event_log_path=event_log_path,
    )
