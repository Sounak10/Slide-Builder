# Slide Builder Backend

Python LiveKit Agent backend for the AI voice presentation MVP.

## Setup

```bash
cd backend
uv sync
cp .env.example .env
```

Fill in `.env` with LiveKit credentials. Model access uses LiveKit Inference, so no provider API key is required for the default configuration.

## Run Agent

```bash
uv run agent.py [ dev | console | start ]
```

The agent is the only backend process for the MVP. It joins LiveKit rooms, listens to the user, and supervises tools/services for structured slide generation, conversational presentation, interruptions, navigation, and deck edits.

## Event Log

Until the frontend exists, all outbound presentation events are mirrored to:

```text
backend/logs/events.jsonl
```

Each line is a JSON event using the frontend protocol:

```json
{"event":"presentation_loaded","markdown":"..."}
{"event":"goto_slide","slide":2}
{"event":"presentation_updated","markdown":"..."}
```

