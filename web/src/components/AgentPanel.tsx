"use client";

import { useAgent, useSessionMessages } from "@livekit/components-react";
import { AgentAudioVisualizerBar } from "@/components/agents-ui/agent-audio-visualizer-bar";
import { AgentChatTranscript } from "@/components/agents-ui/agent-chat-transcript";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import type { ActivityItem } from "@/types/presentation";

type AgentPanelProps = {
  session: NonNullable<Parameters<typeof useSessionMessages>[0]>;
  activity: ActivityItem[];
};

export function AgentPanel({ session, activity }: AgentPanelProps) {
  const agent = useAgent(session);
  const { messages } = useSessionMessages(session);

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[2rem] border border-white/70 bg-white/72 p-4 shadow-[0_24px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-[#08111f]/78 dark:shadow-[0_24px_90px_rgba(0,0,0,0.42)]">
      <div className="relative overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-gradient-to-br from-white to-teal-50/70 p-4 dark:border-white/10 dark:from-white/10 dark:to-cyan-300/8">
        <div className="pointer-events-none absolute -right-14 -top-16 h-36 w-36 rounded-full bg-teal-300/30 blur-2xl dark:bg-cyan-300/14" />
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.3em] text-teal-700 dark:text-cyan-200">
              Agent
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-white">
              {agent.state}
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-200/70 bg-white/70 px-3 py-1 text-xs font-semibold text-teal-800 shadow-sm dark:border-cyan-200/15 dark:bg-white/8 dark:text-cyan-100">
            <span className="size-1.5 rounded-full bg-teal-500 shadow-[0_0_12px_rgba(20,184,166,0.9)] dark:bg-cyan-300" />
            {session.connectionState}
          </span>
        </div>

        <AgentAudioVisualizerBar
          audioTrack={agent.microphoneTrack}
          barCount={13}
          size="sm"
          state={agent.state}
          className="mx-auto text-teal-600 dark:text-cyan-200"
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-white/85 shadow-inner dark:border-white/10 dark:bg-[#050a13]/92">
        <div className="border-b border-slate-200/80 px-4 py-3 dark:border-white/10">
          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
            Transcript
          </p>
        </div>
        <AgentChatTranscript
          agentState={agent.state}
          messages={messages}
          className="h-full max-h-full overflow-y-auto"
        />
      </div>

      <div className="mt-4 rounded-[1.5rem] border border-slate-200/80 bg-slate-50/80 p-3 dark:border-white/10 dark:bg-white/6">
        <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
          Backend events
        </p>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {activity.slice(0, 4).map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-white/80 bg-white/85 p-2.5 shadow-sm dark:border-white/8 dark:bg-[#050a13]/80"
            >
              <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
              {item.detail ? (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {item.detail}
                </p>
              ) : null}
            </div>
          ))}
          {activity.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-white/12 dark:text-slate-400">
              Presentation events will appear here.
            </p>
          ) : null}
        </div>
      </div>

      <AgentControlBar
        className="mt-4 border-slate-200/80 bg-white/85 shadow-[0_16px_48px_rgba(15,23,42,0.12)] backdrop-blur dark:border-white/10 dark:bg-white/8 dark:shadow-[0_16px_48px_rgba(0,0,0,0.24)]"
        controls={{
          camera: false,
          chat: true,
          leave: true,
          microphone: true,
          screenShare: false,
        }}
        isConnected={session.isConnected}
        onDisconnect={() => {
          session.end();
        }}
        saveUserChoices={false}
        variant="livekit"
      />
    </aside>
  );
}
