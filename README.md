# Slide Builder

AI voice presentation MVP. A Python LiveKit Agent generates, presents, edits, and navigates structured slide decks while a Next.js frontend renders the deck with Reveal.js.

## Current Scope

This repo contains:

- `agent/`: Python LiveKit Agent backend.
- `web/`: Next.js frontend with LiveKit browser session controls and embedded Reveal.js slides.

The app supports:

- AI-generated 5-6 slide presentations.
- Conversational voice presentation through LiveKit Agents.
- User interruptions through LiveKit turn handling.
- Slide navigation tools.
- Slide add/update/delete/regenerate tools.
- Backend-owned presentation state.
- Reveal-compatible Markdown generated from structured slide data.
- Colorful slide themes, gradient backgrounds, and PDF export styling.
- Event logging to `agent/logs/events.jsonl`.
- LiveKit data-channel events consumed by the frontend.

Generated decks do not depend on external image APIs. Slides are text-first with visual styling driven by structured metadata such as `layout`, `accent`, and `kicker`.

## Architecture

```text
slide-builder/
├── agent/
│   ├── agent.py
│   ├── core/
│   ├── presentation/
│   ├── services/
│   └── tools/
└── web/
    ├── src/app/
    ├── src/components/
    ├── src/hooks/
    └── src/services/
```

The LiveKit Agent is the single presentation orchestrator. It owns state, generation, navigation, and edits. The frontend connects to the same room, captures microphone input, plays agent audio, and renders presentation events.

Agent dependency direction:

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
├── speaker_notes
├── kicker
├── layout
├── accent
├── image_url
└── image_alt
```

Markdown is derived output. Do not treat Markdown as the source of truth. Image fields are currently preserved for schema compatibility but ignored by generation and rendering.

## Frontend Rendering

The frontend renders backend Markdown with `@revealjs/react`. Generated slides include Reveal-compatible HTML and `.slide` attributes for:

- Gradient backgrounds.
- Large display typography.
- Accent color themes.
- Plain, high-contrast bullet lists.
- PDF export using the same slide HTML/CSS.

The startup slide is a local placeholder in `web/src/components/Presentation.tsx`.

## Events

All outbound presentation events are published through LiveKit data channels and mirrored to `agent/logs/events.jsonl`.

Current event shapes:

```json
{"event":"presentation_loaded","markdown":"..."}
{"event":"presentation_updated","markdown":"..."}
{"event":"goto_slide","slide":2}
```

The future frontend will listen on the LiveKit data topic configured by `LIVEKIT_PRESENTATION_TOPIC`.

## Agent Setup

Requirements:

- Python 3.11+
- LiveKit Cloud project or self-hosted LiveKit
- LiveKit API key and secret
- LiveKit Inference enabled for the configured models

Install dependencies:

```bash
cd agent
uv sync
cp .env.example .env
```

Configure `agent/.env`:

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

## Run Agent

```bash
cd agent
uv run agent.py [ dev | console | start ]
```

Inspect emitted presentation events in:

```text
agent/logs/events.jsonl
```

## Web Setup

```bash
cd web
cp .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

