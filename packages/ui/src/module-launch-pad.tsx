import Link from "next/link";
import type { Session } from "@helios/types";

export function ModuleLaunchPad({ session }: { session: Session }) {
  return (
    <aside className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Module starten</h2>
      <p className="text-sm text-slate-400">Direktzugriff auf die freigeschalteten Tools.</p>
      <div className="mt-4 space-y-3">
        {session.modulesEnabled.map((module) => (
          <Link
            key={module}
            href={`/${module}?session=${session.id}`}
            className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-200 transition hover:border-brand-light"
          >
            <span className="capitalize">{module}</span>
            <span aria-hidden>→</span>
          </Link>
        ))}
      </div>
    </aside>
  );
}
