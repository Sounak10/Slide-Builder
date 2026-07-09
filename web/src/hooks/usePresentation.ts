"use client";

import { useReducer } from "react";
import type { ActivityItem, PresentationEvent, PresentationStatus } from "@/types/presentation";

type PresentationState = {
  markdown: string;
  currentSlide: number;
  status: PresentationStatus;
  lastEvent?: PresentationEvent["event"];
  activity: ActivityItem[];
};

type PresentationAction =
  | {
      type: "backend-event";
      event: PresentationEvent;
    }
  | {
      type: "session-started";
    }
  | {
      type: "session-ended";
    }
  | {
      type: "debug";
      label: string;
      detail?: string;
    };

const initialState: PresentationState = {
  markdown: "",
  currentSlide: 0,
  status: "idle",
  activity: [],
};

function addActivity(
  activity: ActivityItem[],
  label: string,
  detail?: string,
): ActivityItem[] {
  return [
    {
      id: crypto.randomUUID(),
      label,
      detail,
      timestamp: Date.now(),
    },
    ...activity,
  ].slice(0, 30);
}

function presentationReducer(
  state: PresentationState,
  action: PresentationAction,
): PresentationState {
  if (action.type === "session-started") {
    return {
      ...state,
      activity: addActivity(state.activity, "Connected to LiveKit room"),
    };
  }

  if (action.type === "session-ended") {
    return {
      ...state,
      status: "idle",
      activity: addActivity(state.activity, "Session ended"),
    };
  }

  if (action.type === "debug") {
    return {
      ...state,
      activity: addActivity(state.activity, action.label, action.detail),
    };
  }

  const event = action.event;

  if (event.event === "presentation_loaded") {
    return {
      ...state,
      markdown: event.markdown,
      currentSlide: 0,
      status: "ready",
      lastEvent: event.event,
      activity: addActivity(state.activity, "Presentation loaded", "Slides received from agent"),
    };
  }

  if (event.event === "presentation_updated") {
    return {
      ...state,
      markdown: event.markdown,
      status: "ready",
      lastEvent: event.event,
      activity: addActivity(state.activity, "Presentation updated", "Deck markdown refreshed"),
    };
  }

  return {
    ...state,
    currentSlide: event.slide,
    lastEvent: event.event,
    activity: addActivity(state.activity, `Navigated to slide ${event.slide + 1}`),
  };
}

export function usePresentation() {
  const [state, dispatch] = useReducer(presentationReducer, initialState);
  return { state, dispatch };
}
