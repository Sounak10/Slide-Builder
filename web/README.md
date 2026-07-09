# AI Voice Presentation Frontend

Next.js frontend for the LiveKit-powered presentation MVP.

## Responsibilities

- Connect to LiveKit using the browser Session API.
- Request a short-lived room token from `src/app/api/token/route.ts`.
- Render backend-owned Reveal markdown with `@revealjs/react`.
- Listen for presentation events on the `presentation` data topic.
- Show LiveKit Agents UI transcript, visualizer, and controls.
- Export the current deck to PDF using the same generated slide HTML/CSS.

The frontend does not generate slides or decide presentation flow.

## Slide Rendering

The backend sends Reveal-compatible Markdown. Generated slides may include `.slide` attributes and HTML with classes such as:

- `slide-shell`
- `slide-kicker`
- `slide-lede`
- `slide-bullets`
- `slide-accent-*`
- `slide-layout-*`

Shared slide styling lives in `src/app/globals.css`. The startup placeholder slide lives in `src/components/Presentation.tsx`.

Slides are currently text-first. External image rendering is disabled so the app does not require image provider API keys.

## Setup

Copy `.env.example` to `.env.local` and set:

- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`
- `NEXT_PUBLIC_LIVEKIT_AGENT_NAME`
- `NEXT_PUBLIC_LIVEKIT_PRESENTATION_TOPIC`

Then run:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## PDF Export

The Download PDF button stores the current markdown through `src/app/api/export/slides/route.ts`, then opens `/export/slides/[id]?print-pdf`.

`src/components/SlidePrintExport.tsx` splits Reveal markdown into slides, removes speaker notes, and renders generated styled slide HTML directly so the exported PDF keeps the live deck's gradients, typography, and layout. Plain markdown slides fall back to Streamdown rendering.

## Token Flow

The client uses `TokenSource.endpoint("/api/token")`. LiveKit sends token request options, including agent dispatch `room_config`, to the Next.js route. The route signs a scoped, short-lived participant token server-side and returns:

```json
{
  "server_url": "wss://...",
  "participant_token": "..."
}
```

API keys and secrets must stay server-only.
