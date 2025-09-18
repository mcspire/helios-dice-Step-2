"use client";

import { useState } from "react";
import type { DiceRollInput, RollOutcome } from "@helios/types";
import { Button } from "./button";
import { FormField, Input, Label } from "./form";

interface DiceRollPanelProps {
  role: "player" | "gm";
  presets: DiceRollInput[];
  onRoll: (input: DiceRollInput) => Promise<RollOutcome>;
}

export function DiceRollPanel({ role, presets, onRoll }: DiceRollPanelProps) {
  const [attribute, setAttribute] = useState(3);
  const [skill, setSkill] = useState(2);
  const [stress, setStress] = useState(1);
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function handleRoll() {
    setIsPending(true);
    const input: DiceRollInput = {
      sessionId: "00000000-0000-0000-0000-000000000000",
      userId: "00000000-0000-0000-0000-000000000001",
      pool: { attribute, skill, bonus: 0, stress, special: 0 },
      advantage: false,
      comment,
    };
    const result = await onRoll(input);
    setStatus(`Erfolge: ${result.successes} • Kritisch: ${result.crit ? "Ja" : "Nein"}`);
    setIsPending(false);
  }

  return (
    <aside className="flex flex-col gap-4 border-l border-slate-900 bg-slate-950/80 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Würfelpanel ({role})</h2>
        <p className="text-sm text-slate-400">Baue deinen Würfelpool und löse den Wurf aus.</p>
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
    </aside>
  );
}
