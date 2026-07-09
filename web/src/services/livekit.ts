import { TokenSource } from "livekit-client";

export const presentationTopic =
  process.env.NEXT_PUBLIC_LIVEKIT_PRESENTATION_TOPIC || "presentation";

export const agentName =
  process.env.NEXT_PUBLIC_LIVEKIT_AGENT_NAME || "presentation-agent";

export const tokenSource = TokenSource.endpoint("/api/token");
