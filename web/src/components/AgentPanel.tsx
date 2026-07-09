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
    <aside className="flex min-h-0 flex-col rounded-3xl border border-white/10 bg-white/80 p-4 shadow-2xl shadow-slate-950/10 backdrop-blur dark:bg-slate-950/80">
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-emerald-600">
              Agent
            </p>
            <h2 className="text-lg font-semibold text-slate-950 dark:text-white">
              {agent.state}
            </h2>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
            {session.connectionState}
          </span>
        </div>

        <AgentAudioVisualizerBar
          audioTrack={agent.microphoneTrack}
          barCount={7}
          size="sm"
          state={agent.state}
          className="mx-auto text-emerald-500"
        />
      </div>

      <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950">
        <AgentChatTranscript
          agentState={agent.state}
          messages={messages}
          className="h-full"
        />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-900">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
          Backend events
        </p>
        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {activity.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-xl bg-white p-2 dark:bg-slate-950">
              <p className="font-medium text-slate-900 dark:text-white">{item.label}</p>
              {item.detail ? <p className="text-xs text-slate-500">{item.detail}</p> : null}
            </div>
          ))}
          {activity.length === 0 ? (
            <p className="text-xs text-slate-500">Presentation events will appear here.</p>
          ) : null}
        </div>
      </div>

      <AgentControlBar
        className="mt-4"
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
