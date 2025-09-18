"use client";

import { useState } from "react";
import type { Character } from "@helios/types";
import { Input } from "./form";

interface CharacterListProps {
  characters: Character[];
  showRoles?: boolean;
}

export function CharacterList({ characters, showRoles = false }: CharacterListProps) {
  const [query, setQuery] = useState("");
  const filtered = characters.filter((character) => character.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="flex h-full flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-950/70 p-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Charaktere</h2>
        <Input
          placeholder="Suche"
          className="w-40"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      <ul className="flex-1 space-y-2 overflow-y-auto text-sm text-slate-300">
        {filtered.length ? (
          filtered.map((character) => (
            <li key={character.id} className="rounded-2xl bg-slate-900/60 px-4 py-3">
              <p className="font-medium text-slate-100">{character.name}</p>
              <p className="text-xs text-slate-500">Status: {character.status}</p>
              {showRoles && <p className="text-xs text-slate-500">Rolle: {character.role}</p>}
            </li>
          ))
        ) : (
          <li className="text-slate-500">Keine Treffer.</li>
        )}
      </ul>
    </section>
  );
}
