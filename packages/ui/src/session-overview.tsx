import type { Session } from "@helios/types";

export function SessionOverview({ session }: { session: Session }) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-light">
          Session
        </p>
        <h1 className="text-3xl font-semibold text-white">{session.name}</h1>
        {session.description && <p className="text-sm text-slate-300">{session.description}</p>}
        <dl className="mt-4 grid gap-4 text-sm text-slate-400 sm:grid-cols-3">
          <div>
            <dt className="font-medium text-slate-200">Status</dt>
            <dd>{session.status}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Module</dt>
            <dd>{session.modulesEnabled.join(", ")}</dd>
          </div>
          <div>
            <dt className="font-medium text-slate-200">Gestartet</dt>
            <dd>{session.createdAt.toLocaleString()}</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
