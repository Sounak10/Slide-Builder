# Slide Builder Backend

Python LiveKit Agent backend for the AI voice presentation MVP.

## Setup

```bash
cd agent
uv sync
cp .env.example .env
```

Fill in `.env` with LiveKit credentials. Model access uses LiveKit Inference, so no provider API key is required for the default configuration.

## Run Agent

```bash
uv run agent.py [ dev | console | start ]
```

The agent is the only backend process for the MVP. It joins LiveKit rooms, listens to the user, and supervises tools/services for structured slide generation, conversational presentation, interruptions, navigation, and deck edits.

## Slide Generation

Generated decks contain exactly 5 or 6 slides. The LLM returns structured slide data, and `presentation/markdown.py` renders Reveal-compatible Markdown from that structure.

Each slide stores:

- `title`
- `bullets`
- `speaker_notes`
- `kicker`
- `layout`
- `accent`

The visual fields are intentionally small and deterministic. `layout` is currently `standard` or `hero`; `accent` selects one of the built-in color palettes. External image generation is disabled, so no image API key is required and no web image URLs are emitted by default.

Markdown is derived output. Keep presentation state changes in `presentation/service.py` and `presentation/models.py` rather than editing Markdown directly.

## Event Log

All outbound presentation events are mirrored to:

```text
agent/logs/events.jsonl
```

Each line is a JSON event using the frontend protocol:

```json
{"event":"presentation_loaded","markdown":"..."}
{"event":"goto_slide","slide":2}
{"event":"presentation_updated","markdown":"..."}
```

The frontend listens for these same event shapes over the configured LiveKit data topic.

