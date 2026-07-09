"use client";

import { useEffect, type Dispatch } from "react";
import { RoomEvent, type Room } from "livekit-client";
import { logger } from "@/lib/logger";
import type { PresentationEvent } from "@/types/presentation";

type PresentationDispatch = Dispatch<
  | {
      type: "backend-event";
      event: PresentationEvent;
    }
  | {
      type: "debug";
      label: string;
      detail?: string;
    }
>;

const decoder = new TextDecoder();

function parsePresentationEvent(payload: Uint8Array): PresentationEvent | null {
  try {
    const value = JSON.parse(decoder.decode(payload)) as Partial<PresentationEvent>;

    if (
      (value.event === "presentation_loaded" || value.event === "presentation_updated") &&
      typeof value.markdown === "string"
    ) {
      return value as PresentationEvent;
    }

    if (value.event === "goto_slide" && typeof value.slide === "number") {
      return value as PresentationEvent;
    }
  } catch {
    return null;
  }

  return null;
}

export function useLiveKitEvents(room: Room, topic: string, dispatch: PresentationDispatch) {
  useEffect(() => {
    const handleData = (payload: Uint8Array, _participant: unknown, _kind: unknown, packetTopic?: string) => {
      if (packetTopic !== topic) {
        logger.debug("data-channel", "ignored packet for different topic", {
          expectedTopic: topic,
          packetTopic,
          bytes: payload.byteLength,
        });
        return;
      }

      const event = parsePresentationEvent(payload);
      if (!event) {
        logger.warn("data-channel", "ignored malformed presentation event", {
          topic,
          bytes: payload.byteLength,
        });
        dispatch({
          type: "debug",
          label: "Ignored malformed presentation event",
        });
        return;
      }

      logger.info("data-channel", "received presentation event", {
        event: event.event,
        topic,
        bytes: payload.byteLength,
      });
      dispatch({ type: "backend-event", event });
    };

    logger.debug("data-channel", "subscribing to presentation events", {
      topic,
      roomName: room.name,
    });
    room.on(RoomEvent.DataReceived, handleData);
    return () => {
      logger.debug("data-channel", "unsubscribing from presentation events", {
        topic,
        roomName: room.name,
      });
      room.off(RoomEvent.DataReceived, handleData);
    };
  }, [room, topic, dispatch]);
}
