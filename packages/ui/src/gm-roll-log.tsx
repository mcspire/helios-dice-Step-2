"use client";

import { useEffect, useState } from "react";
import type { RollOutcome } from "@helios/types";
import { subscribe, useRealtimeSession } from "@helios/realtime";

export function GmRollLog() {
  const { sessionId } = useRealtimeSession();
  const [entries, setEntries] = useState<RollOutcome[]>([]);

  useEffect(() => {
    return subscribe((event) => {
      if (event.type === "rollResult" && event.payload.sessionId === sessionId) {
        setEntries((previous) => {
          const existing = previous.filter((entry) => entry.id !== event.payload.id);
          return [event.payload, ...existing].slice(0, 15);
        });
      }
    });
  }, [sessionId]);

  return (
    <section className="flex h-full flex-col gap-4 border-r border-slate-900 bg-slate-950/80 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Roll Log</h2>
        <p className="text-sm text-slate-400">Live-Stream aller Würfe in der Session.</p>
      </header>
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
        <ul className="space-y-3 text-sm text-slate-300">
          {entries.length ? (
            entries.map((entry) => {
              const createdAt = new Date(entry.createdAt).toLocaleTimeString("de-DE", {
                minute: "2-digit",
                second: "2-digit",
              });
              return (
                <li key={entry.id} className="rounded-xl bg-slate-900/80 p-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{createdAt}</span>
                    <span className="font-mono text-slate-400">{entry.userId.slice(0, 8)}</span>
                  </div>
                  <p className="text-sm text-slate-100">
                    {entry.successes} Erfolg{entry.successes === 1 ? "" : "e"} {entry.crit ? "• Kritisch" : null}
                  </p>
                  {entry.panic && <p className="text-xs text-rose-400">Panik ausgelöst</p>}
                </li>
              );
            })
          ) : (
            <li className="text-slate-500">Noch keine Würfe eingegangen.</li>
          )}
        </ul>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
        <p>Moderationsaktionen folgen: Broadcast, Panik, Clear.</p>
      </div>
    </section>
  );
}
