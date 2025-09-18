import type { ReactNode } from "react";

interface ModuleShellProps {
  module: "map" | "characters";
  children: ReactNode;
}

export function ModuleShell({ module, children }: ModuleShellProps) {
  return (
    <div className="flex min-h-screen flex-col gap-6 bg-slate-950 px-6 py-8 text-slate-50">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-light">HELIOS</p>
          <h1 className="text-2xl font-bold text-white">{module === "map" ? "Map" : "Characters"}</h1>
        </div>
        <span className="text-xs text-slate-500">Realtime Sync aktiv</span>
      </header>
      <div className="flex-1">{children}</div>
    </div>
  );
}
