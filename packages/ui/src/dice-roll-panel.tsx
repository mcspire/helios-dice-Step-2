"use client";

import { useEffect, useMemo, useState } from "react";
import type { DiceRollInput, RollOutcome } from "@helios/types";
import {
  publish,
  subscribe,
  useRealtimeSession,
  onConnectionStateChange,
  type ConnectionState,
} from "@helios/realtime";
import { Button } from "./button";
import { FormField, Input, Label } from "./form";

interface DiceRollPanelProps {
  role: "player" | "gm";
  presets: DiceRollInput[];
  onRoll: (input: DiceRollInput) => Promise<RollOutcome>;
}

export function DiceRollPanel({ role, presets, onRoll }: DiceRollPanelProps) {
  const { sessionId, userId } = useRealtimeSession();
  const [attribute, setAttribute] = useState(3);
  const [skill, setSkill] = useState(2);
  const [stress, setStress] = useState(1);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionState["state"]>("connecting");
  const [feed, setFeed] = useState<RollOutcome[]>([]);

  useEffect(() => {
    const unsubscribeEvents = subscribe((event) => {
      if (event.type === "rollResult" && event.payload.sessionId === sessionId) {
        setFeed((previous) => {
          const existing = previous.filter((entry) => entry.id !== event.payload.id);
          return [event.payload, ...existing].slice(0, 8);
        });
        if (event.payload.userId !== userId) {
          setStatus(
            `Live-Wurf von ${event.payload.userId.slice(0, 8)} • Erfolge ${event.payload.successes} • Kritisch ${
              event.payload.crit ? "Ja" : "Nein"
            }`
          );
        }
      }

      if (event.type === "rollInitiate" && event.payload.sessionId === sessionId && event.payload.userId !== userId) {
        setStatus(`Spieler ${event.payload.userId.slice(0, 8)} startet einen Wurf…`);
      }
    });

    const unsubscribeStatus = onConnectionStateChange((state) => {
      setConnectionState(state.state);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeStatus();
    };
  }, [sessionId, userId]);

  const connectionLabel = useMemo(() => {
    switch (connectionState) {
      case "connected":
        return { label: "Realtime verbunden", tone: "text-emerald-400" };
      case "disconnected":
        return { label: "Verbindung getrennt", tone: "text-rose-400" };
      default:
        return { label: "Verbindung wird aufgebaut…", tone: "text-amber-300" };
    }
  }, [connectionState]);

  async function handleRoll() {
    setIsPending(true);
    const input: DiceRollInput = {
      sessionId,
      userId,
      pool: { attribute, skill, bonus: 0, stress, special: 0 },
      advantage: false,
      comment,
    };
    publish({ type: "rollInitiate", payload: input });
    const result = await onRoll(input);
    setStatus(`Erfolge: ${result.successes} • Kritisch: ${result.crit ? "Ja" : "Nein"}`);
    setIsPending(false);
  }

  return (
    <aside className="flex flex-col gap-4 border-l border-slate-900 bg-slate-950/80 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Würfelpanel ({role})</h2>
        <p className="text-sm text-slate-400">Baue deinen Würfelpool und löse den Wurf aus.</p>
        <p className={`mt-1 text-xs font-medium ${connectionLabel.tone}`}>{connectionLabel.label}</p>
      </header>
      <div className="grid gap-3">
        <FormField>
          <Label htmlFor="attribute">Attribute</Label>
          <Input
            id="attribute"
            type="number"
            min={0}
            max={6}
            value={attribute}
            onChange={(event) => setAttribute(Number(event.target.value))}
          />
        </FormField>
        <FormField>
          <Label htmlFor="skill">Fertigkeit</Label>
          <Input
            id="skill"
            type="number"
            min={0}
            max={6}
            value={skill}
            onChange={(event) => setSkill(Number(event.target.value))}
          />
        </FormField>
        <FormField>
          <Label htmlFor="stress">Stress</Label>
          <Input
            id="stress"
            type="number"
            min={0}
            max={10}
            value={stress}
            onChange={(event) => setStress(Number(event.target.value))}
          />
        </FormField>
        <FormField>
          <Label htmlFor="comment">Kommentar</Label>
          <Input id="comment" value={comment} onChange={(event) => setComment(event.target.value)} />
        </FormField>
      </div>
      <Button type="button" onClick={handleRoll} disabled={isPending}>
        {isPending ? "Würfle…" : "Wurf auslösen"}
      </Button>
      {status && <p className="text-sm text-emerald-400">{status}</p>}
      <div className="mt-6 space-y-2 text-xs text-slate-400">
        <h3 className="font-semibold text-slate-200">Presets</h3>
        {presets.length ? (
          presets.map((preset) => (
            <p key={preset.comment ?? preset.sessionId}>{preset.comment ?? "Ohne Kommentar"}</p>
          ))
        ) : (
          <p>Noch keine Presets gespeichert.</p>
        )}
      </div>
      <div className="mt-6 space-y-3 text-xs">
        <h3 className="font-semibold text-slate-200">Live-Feed</h3>
        <ul className="space-y-2 text-slate-300">
          {feed.length ? (
            feed.map((entry) => {
              const createdAt = new Date(entry.createdAt).toLocaleTimeString("de-DE", {
                minute: "2-digit",
                second: "2-digit",
              });
              return (
                <li key={entry.id} className="rounded-xl border border-slate-800/60 bg-slate-900/60 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-500">{createdAt}</p>
                  <p className="text-sm font-semibold text-slate-100">
                    {entry.successes} Erfolg{entry.successes === 1 ? "" : "e"} • {entry.crit ? "Kritisch" : "Normal"}
                  </p>
                  <p className="text-[11px] text-slate-400">Spieler {entry.userId.slice(0, 8)}</p>
                  {entry.panic && <p className="text-[11px] text-rose-400">Panik ausgelöst!</p>}
                </li>
              );
            })
          ) : (
            <li className="text-slate-500">Noch keine Live-Ereignisse empfangen.</li>
          )}
        </ul>
      </div>
    </aside>
  );
}
