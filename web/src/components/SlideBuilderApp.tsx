"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@livekit/components-react";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { AgentPanel } from "@/components/AgentPanel";
import { Presentation } from "@/components/Presentation";
import { useLiveKitEvents } from "@/hooks/useLiveKitEvents";
import { usePresentation } from "@/hooks/usePresentation";
import { logger } from "@/lib/logger";
import { agentName, presentationTopic, tokenSource } from "@/services/livekit";

export function SlideBuilderApp() {
  const session = useSession(tokenSource, {
    agentConnectTimeoutMilliseconds: 30_000,
    agentName,
    participantName: "Presenter",
  });
  const { state, dispatch } = usePresentation();
  const [isStarting, setIsStarting] = useState(false);
  const hasConnectedRef = useRef(false);
  const localParticipantIdentity = session.room.localParticipant.identity;
  const roomName = session.room.name;

  useLiveKitEvents(session.room, presentationTopic, dispatch);

  useEffect(() => {
    if (session.isConnected) {
      hasConnectedRef.current = true;
      logger.info("session", "connected to LiveKit room", {
        agentName,
        connectionState: session.connectionState,
        localParticipant: localParticipantIdentity,
        roomName,
      });
      dispatch({ type: "session-started" });
      return;
    }

    if (hasConnectedRef.current) {
      logger.info("session", "disconnected from LiveKit room", {
        connectionState: session.connectionState,
        roomName,
      });
      dispatch({ type: "session-ended" });
    }
  }, [
    dispatch,
    localParticipantIdentity,
    roomName,
    session.connectionState,
    session.isConnected,
  ]);

  async function startSession() {
    try {
      logger.info("session", "starting voice session", {
        agentName,
        presentationTopic,
        microphoneEnabled: true,
      });
      setIsStarting(true);
      await session.start({
        tracks: {
          microphone: {
            enabled: true,
          },
        },
      });
      logger.info("session", "voice session start completed", {
        connectionState: session.connectionState,
        roomName,
      });
    } catch (error) {
      logger.error("session", "failed to start voice session", error);
      dispatch({
        type: "debug",
        label: "Failed to start session",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsStarting(false);
    }
  }

  return (
    <AgentSessionProvider session={session} volume={1}>
      <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32rem),linear-gradient(135deg,#f8fafc,#e2e8f0)] p-4 text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.18),transparent_32rem),linear-gradient(135deg,#020617,#0f172a)] dark:text-white md:p-6">
        <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl flex-col gap-4 md:min-h-[calc(100vh-3rem)] lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="flex min-h-[620px] flex-col rounded-[2rem] border border-white/40 bg-white/70 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur dark:border-white/10 dark:bg-slate-950/70">
            <header className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-emerald-700 dark:text-emerald-300">
                  Voice presentation MVP
                </p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
                  Conversational slide builder
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ask the agent to generate a 5-6 slide deck, present it, answer questions,
                  navigate, and edit slides. The backend owns the presentation state.
                </p>
              </div>

              <button
                className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-700/20 transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-400"
                disabled={session.isConnected || isStarting}
                onClick={startSession}
                type="button"
              >
                {session.isConnected ? "Connected" : isStarting ? "Connecting..." : "Start voice session"}
              </button>
            </header>

            <Presentation markdown={state.markdown} currentSlide={state.currentSlide} />
          </section>

          <AgentPanel session={session} activity={state.activity} />
        </div>
      </main>
    </AgentSessionProvider>
  );
}
