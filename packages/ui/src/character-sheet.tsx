"use client";

import { useState } from "react";
import type { CharacterUpdateInput } from "@helios/types";
import { Button } from "./button";
import { FormField, HelperText, Input, Label } from "./form";

interface CharacterSheetProps {
  mode: "player" | "gm";
  onUpdate: (input: CharacterUpdateInput) => Promise<void>;
}

export function CharacterSheet({ mode, onUpdate }: CharacterSheetProps) {
  const [characterId, setCharacterId] = useState("00000000-0000-0000-0000-000000000010");
  const [status, setStatus] = useState("healthy");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPending(true);
    const update: CharacterUpdateInput = {
      id: characterId,
      sessionId: "00000000-0000-0000-0000-000000000000",
      status: status as CharacterUpdateInput["status"],
    };
    await onUpdate(update);
    setIsPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Charakterbogen ({mode})</h2>
        <HelperText>Inhalte werden synchronisiert</HelperText>
      </header>
      <FormField>
        <Label htmlFor="character-id">Charakter-ID</Label>
        <Input
          id="character-id"
          value={characterId}
          onChange={(event) => setCharacterId(event.target.value)}
        />
      </FormField>
      <FormField>
        <Label htmlFor="character-status">Status</Label>
        <Input
          id="character-status"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        />
      </FormField>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Speichere…" : "Änderungen speichern"}
      </Button>
    </form>
  );
}
