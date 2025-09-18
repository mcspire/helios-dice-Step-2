"use client";

import { useState } from "react";
import { Button } from "./button";

interface MapToolbarProps {
  role: "player" | "gm";
}

export function MapToolbar({ role }: MapToolbarProps) {
  const [mode, setMode] = useState("select");

  return (
    <div className="flex items-center gap-2 rounded-3xl border border-slate-800 bg-slate-950/80 p-3 text-xs text-slate-300">
      <span className="font-semibold text-slate-200">Werkzeuge ({role})</span>
      <Button
        type="button"
        variant={mode === "select" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setMode("select")}
      >
        Auswahl
      </Button>
      <Button
        type="button"
        variant={mode === "measure" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setMode("measure")}
      >
        Messen
      </Button>
      <Button
        type="button"
        variant={mode === "ping" ? "primary" : "ghost"}
        size="sm"
        onClick={() => setMode("ping")}
      >
        Ping
      </Button>
    </div>
  );
}
