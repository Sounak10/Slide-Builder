import { RoomConfiguration } from "@livekit/protocol";
import { AccessToken } from "livekit-server-sdk";
import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

type TokenRequest = {
  room_name?: string;
  participant_identity?: string;
  participant_name?: string;
  participant_metadata?: string;
  participant_attributes?: Record<string, string>;
  room_config?: ConstructorParameters<typeof RoomConfiguration>[0];
};

function uniqueId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as TokenRequest;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const serverUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !serverUrl) {
      return NextResponse.json(
        { error: "LiveKit token route is not configured" },
        { status: 500 },
      );
    }

    const roomName = body.room_name || uniqueId("presentation-room");
    const participantIdentity = body.participant_identity || uniqueId("user");
    const participantName = body.participant_name || "Presenter";
    const roomConfig = body.room_config
      ? RoomConfiguration.fromJson(body.room_config, { ignoreUnknownFields: true })
      : undefined;

    console.info("[slide-builder:token] token requested", {
      roomName,
      participantIdentity,
      participantName,
      agents: roomConfig?.agents.map((agent) => ({
        agentName: agent.agentName,
        deployment: agent.deployment,
        hasMetadata: agent.metadata.length > 0,
      })),
    });

    const token = new AccessToken(apiKey, apiSecret, {
      identity: participantIdentity,
      name: participantName,
      metadata: body.participant_metadata || "",
      attributes: body.participant_attributes || {},
      ttl: "10m",
    });

    token.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    });

    if (roomConfig) {
      token.roomConfig = roomConfig;
    }

    return NextResponse.json(
      {
        server_url: serverUrl,
        participant_token: await token.toJwt(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to generate LiveKit token", error);
    return NextResponse.json({ error: "Failed to generate token" }, { status: 500 });
  }
}
