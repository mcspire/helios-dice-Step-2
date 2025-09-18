"use client";

import { useState } from "react";
import { Button } from "./button";
import { FormField, Input, Label } from "./form";

interface SessionCreateCardProps {
  onCreate: (input: { name: string; description?: string }) => Promise<unknown>;
}

export function SessionCreateCard({ onCreate }: SessionCreateCardProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim()) return;
    setIsPending(true);
    await onCreate({ name, description });
    setName("");
    setDescription("");
    setIsPending(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg"
    >
      <h2 className="text-lg font-semibold text-white">Neue Session</h2>
      <p className="text-sm text-slate-400">
        Lege sofort los und lade deine Crew zur nächsten Mission ein.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <FormField>
          <Label htmlFor="session-name">Name</Label>
          <Input
            id="session-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="z. B. Nostromo Reboot"
            required
          />
        </FormField>
        <FormField>
          <Label htmlFor="session-description">Beschreibung</Label>
          <Input
            id="session-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Optional"
          />
        </FormField>
      </div>
      <div className="mt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Erstelle…" : "Session erstellen"}
        </Button>
      </div>
    </form>
  );
}
