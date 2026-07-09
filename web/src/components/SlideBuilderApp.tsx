"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "@livekit/components-react";
import { ConnectionState } from "livekit-client";
import { Download, Moon, Sparkles, Sun } from "lucide-react";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { AgentPanel } from "@/components/AgentPanel";
import { Presentation } from "@/components/Presentation";
import { useLiveKitEvents } from "@/hooks/useLiveKitEvents";
import { usePresentation } from "@/hooks/usePresentation";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/logger";
import { agentName, presentationTopic, tokenSource } from "@/services/livekit";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }

  try {
    const savedTheme = window.localStorage.getItem("slide-builder-theme");

    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
  } catch {
    // Some embedded browsers disable local storage; fall back to system theme.
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function SlideBuilderApp() {
  const session = useSession(tokenSource, {
    agentConnectTimeoutMilliseconds: 30_000,
    agentName,
    participantName: "Presenter",
  });
  const { state, dispatch } = usePresentation();
  const [isStarting, setIsStarting] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);
  const hasConnectedRef = useRef(false);
  const startAbortControllerRef = useRef<AbortController | null>(null);
  const localParticipantIdentity = session.room.localParticipant.identity;
  const roomName = session.room.name;

  useLiveKitEvents(session.room, presentationTopic, dispatch);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");

    try {
      window.localStorage.setItem("slide-builder-theme", theme);
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  }, [theme]);

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

  useEffect(() => {
    if (session.connectionState !== ConnectionState.Disconnected) {
      return;
    }

    startAbortControllerRef.current?.abort();
    startAbortControllerRef.current = null;
  }, [session.connectionState]);

  async function startSession() {
    const abortController = new AbortController();
    startAbortControllerRef.current = abortController;

    try {
      logger.info("session", "starting voice session", {
        agentName,
        presentationTopic,
        microphoneEnabled: true,
      });
      setIsStarting(true);
      await session.start({
        signal: abortController.signal,
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
      if (abortController.signal.aborted) {
        logger.info("session", "voice session start aborted", {
          connectionState: session.connectionState,
          roomName,
        });
        return;
      }

      logger.error("session", "failed to start voice session", error);
      dispatch({
        type: "debug",
        label: "Failed to start session",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      if (startAbortControllerRef.current === abortController) {
        startAbortControllerRef.current = null;
        setIsStarting(false);
      }
    }
  }

  async function exportSlidesAsPdf() {
    const markdown = state.markdown.trim();

    if (!markdown) {
      return;
    }

    const exportWindow = window.open("about:blank", "_blank");

    try {
      setIsExportingPdf(true);

      if (!exportWindow) {
        throw new Error("Allow pop-ups to open the PDF export page.");
      }

      const response = await fetch("/api/export/slides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markdown }),
      });

      if (!response.ok) {
        throw new Error("Could not prepare this deck for PDF export.");
      }

      const body = (await response.json()) as { id?: string };

      if (!body.id) {
        throw new Error("The PDF export did not return an export id.");
      }

      exportWindow.location.href = `/export/slides/${body.id}?print-pdf`;
    } catch (error) {
      exportWindow?.close();
      dispatch({
        type: "debug",
        label: "PDF export failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsExportingPdf(false);
    }
  }

  const isStartPending =
    (isStarting || session.connectionState === ConnectionState.Connecting) &&
    session.connectionState !== ConnectionState.Disconnected;
  const canExportSlides = state.markdown.trim().length > 0;

  return (
    <AgentSessionProvider session={session} volume={1}>
      <main
        className={cn(
          "relative h-screen overflow-hidden bg-[#eef5f8] p-3 text-slate-950 md:p-6",
          "before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_10%,rgba(43,184,181,0.28),transparent_30rem),radial-gradient(circle_at_88%_18%,rgba(139,92,246,0.18),transparent_28rem),linear-gradient(135deg,#f8fbfb,#dfeaf1)] before:content-['']",
          "after:absolute after:inset-x-12 after:top-6 after:h-px after:bg-linear-to-r after:from-transparent after:via-slate-400/60 after:to-transparent after:content-['']",
          "dark:bg-[#05070d] dark:text-white dark:before:bg-[radial-gradient(circle_at_18%_10%,rgba(52,211,203,0.18),transparent_34rem),radial-gradient(circle_at_84%_12%,rgba(124,58,237,0.24),transparent_30rem),linear-gradient(135deg,#05070d,#101727_55%,#071113)] dark:after:via-cyan-200/20",
        )}
      >
        <div className="relative z-10 mx-auto flex h-[calc(100vh-1.5rem)] max-w-7xl flex-col gap-4 overflow-hidden md:h-[calc(100vh-3rem)] lg:grid lg:grid-cols-[minmax(0,1fr)_400px]">
          <section className="relative flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#08111f]/78 dark:shadow-[0_24px_90px_rgba(0,0,0,0.48)]">
            <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-400/12" />
            <div className="pointer-events-none absolute bottom-10 left-12 h-28 w-1/2 rounded-full bg-violet-400/18 blur-3xl dark:bg-violet-500/12" />

            <header className="relative mb-4 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-3xl">
                <p className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-teal-700 dark:text-cyan-200">
                  <Sparkles className="size-3.5" />
                  Voice presentation studio
                </p>
                <h1 className="mt-2 max-w-2xl text-4xl font-semibold tracking-tighter text-slate-950 dark:text-white md:text-5xl">
                  Build the deck by talking.
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Ask for a 5-6 slide story, let the agent present it, then steer
                  the deck with follow-up edits, questions, and slide navigation.
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <button
                  aria-label="Export slides as PDF"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-4 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-cyan-300/40 dark:hover:text-cyan-100 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-[#08111f]"
                  disabled={!canExportSlides || isExportingPdf}
                  onClick={exportSlidesAsPdf}
                  type="button"
                >
                  <Download className="size-4" />
                  <span className="hidden xl:inline">
                    {isExportingPdf ? "Preparing..." : "Download PDF"}
                  </span>
                </button>

                <button
                  aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                  className="inline-flex size-12 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-700 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/10 dark:bg-white/8 dark:text-slate-200 dark:hover:border-cyan-300/40 dark:hover:text-cyan-100 dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-[#08111f]"
                  onClick={() => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark"))}
                  type="button"
                >
                  {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
                </button>

                <button
                  className="group rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_rgba(15,23,42,0.22)] transition hover:-translate-y-0.5 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:translate-y-0 dark:bg-cyan-200 dark:text-slate-950 dark:shadow-[0_12px_36px_rgba(34,211,238,0.18)] dark:hover:bg-white dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-[#08111f] dark:disabled:bg-slate-700 dark:disabled:text-slate-300"
                  disabled={session.isConnected || isStartPending}
                  onClick={startSession}
                  type="button"
                >
                  {session.isConnected
                    ? "Connected"
                    : isStartPending
                      ? "Connecting..."
                      : "Start voice session"}
                </button>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1">
              <div className="pointer-events-none absolute inset-x-8 -top-1 h-6 rounded-full bg-cyan-300/30 blur-2xl dark:bg-cyan-300/16" />
              <Presentation markdown={state.markdown} currentSlide={state.currentSlide} />
            </div>
          </section>

          <AgentPanel session={session} activity={state.activity} />
        </div>
      </main>
    </AgentSessionProvider>
  );
}
