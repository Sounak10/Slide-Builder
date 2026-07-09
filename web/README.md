# AI Voice Presentation Frontend

Next.js frontend for the LiveKit-powered presentation MVP.

## Responsibilities

- Connect to LiveKit using the browser Session API.
- Request a short-lived room token from `src/app/api/token/route.ts`.
- Render backend-owned Reveal markdown.
- Listen for presentation events on the `presentation` data topic.
- Show LiveKit Agents UI transcript, visualizer, and controls.

The frontend does not generate slides or decide presentation flow.

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

## Token Flow

The client uses `TokenSource.endpoint("/api/token")`. LiveKit sends token request options, including agent dispatch `room_config`, to the Next.js route. The route signs a scoped, short-lived participant token server-side and returns:

```json
{
  "server_url": "wss://...",
  "participant_token": "..."
}
```

API keys and secrets must stay server-only.
