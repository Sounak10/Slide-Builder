# Slide Builder

AI voice presentation MVP. The current implementation is backend-only: a Python LiveKit Agent generates, presents, edits, and navigates structured slide decks.

## Current Scope

This repo currently contains the backend agent only. The React/Reveal.js frontend will be added later.

The backend supports:

- AI-generated 5-6 slide presentations.
- Conversational voice presentation through LiveKit Agents.
- User interruptions through LiveKit turn handling.
- Slide navigation tools.
- Slide add/update/delete/regenerate tools.
- Backend-owned presentation state.
- Reveal-compatible Markdown generated from structured slide data.
- Event logging to `backend/logs/events.jsonl` for frontend-less verification.
- LiveKit data-channel events for the future frontend.

## Architecture

```text
Python LiveKit Agent
│
├── agent.py
│   ├── AgentSession
│   ├── LiveKit Inference STT / LLM / TTS
│   └── Supervisor tool registration
│
├── tools/
│   ├── presentation.py
│   ├── navigation.py
│   └── context.py
│
├── presentation/
│   ├── models.py
│   ├── service.py
│   ├── markdown.py
│   └── context.py
│
├── services/
│   └── llm.py
│
└── core/
    ├── config.py
    ├── events.py
    ├── event_log.py
    └── publisher.py
```

The LiveKit Agent is the single orchestrator. It supervises tools and services, but business logic stays outside `agent.py`.

Dependency direction:

```text
agent.py
  ↓
tools/
  ↓
presentation/ + services/
  ↓
core/
```

## Presentation State

The backend stores slides as structured data:

```text
Presentation
├── id
├── topic
├── current_slide
├── slides[]
└── markdown

Slide
├── id
├── index
├── title
├── bullets
└── speaker_notes
```

Markdown is derived output. Do not treat Markdown as the source of truth.

## Events

All outbound presentation events are published through LiveKit data channels and mirrored to `backend/logs/events.jsonl`.

Current event shapes:

```json
{"event":"presentation_loaded","markdown":"..."}
{"event":"presentation_updated","markdown":"..."}
{"event":"goto_slide","slide":2}
```

The future frontend will listen on the LiveKit data topic configured by `LIVEKIT_PRESENTATION_TOPIC`.

## Backend Setup

Requirements:

- Python 3.11+
- LiveKit Cloud project or self-hosted LiveKit
- LiveKit API key and secret
- LiveKit Inference enabled for the configured models

Install dependencies:

```bash
cd backend
uv sync
cp .env.example .env
```

Configure `backend/.env`:

```env
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret

LIVEKIT_LLM_MODEL=openai/gpt-4.1-mini
LIVEKIT_STT_MODEL=deepgram/nova-3
LIVEKIT_TTS_MODEL=cartesia/sonic-3
LIVEKIT_TTS_VOICE=e07c00bc-4134-4eae-9ea4-1a55fb45746b

LIVEKIT_PRESENTATION_TOPIC=presentation
EVENT_LOG_PATH=logs/events.jsonl
```

No provider API keys are required by the default setup. Model access uses LiveKit Inference.

## Run Backend

```bash
cd backend
uv run agent.py [ dev | console | start ]
```

While the frontend is not built, inspect backend events in:

```text
backend/logs/events.jsonl
```

## Frontend Later

The frontend should remain a rendering layer:

- Connect to LiveKit.
- Capture microphone input.
- Play agent audio.
- Render Reveal Markdown.
- Listen for `presentation_loaded`, `presentation_updated`, and `goto_slide`.

It should not generate slides, decide presentation flow, perform retrieval, or own presentation state.