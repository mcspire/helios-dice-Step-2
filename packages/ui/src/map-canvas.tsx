"use client";

import type { MapState } from "@helios/types";

interface MapCanvasProps {
  role: "player" | "gm";
  state: MapState;
}

export function MapCanvas({ role, state }: MapCanvasProps) {
  return (
    <div className="relative flex flex-1 flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
      <div className="flex items-center justify-between border-b border-slate-900 px-4 py-2 text-xs text-slate-400">
        <span>Layer: {state.layers.length}</span>
        <span>Tokens: {state.tokens.length}</span>
        <span>Rolle: {role}</span>
      </div>
      <div className="flex flex-1 items-center justify-center text-slate-500">
        Kartenplatzhalter – WebGL Renderer folgt
      </div>
    </div>
  );
}
