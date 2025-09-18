import { getDicePresets } from "@helios/utils/server";

export async function GmRollLog() {
  const entries = await getDicePresets();

  return (
    <section className="flex h-full flex-col gap-4 border-r border-slate-900 bg-slate-950/80 p-6">
      <header>
        <h2 className="text-xl font-semibold text-white">Roll Log</h2>
        <p className="text-sm text-slate-400">Filtere Ereignisse, um kritische Aktionen hervorzuheben.</p>
      </header>
      <div className="flex-1 overflow-y-auto rounded-2xl border border-slate-900 bg-slate-950/60 p-4">
        <ul className="space-y-3 text-sm text-slate-300">
          {entries.length ? (
            entries.map((entry) => (
              <li key={entry.comment ?? entry.sessionId} className="rounded-xl bg-slate-900/80 p-3">
                <p className="text-xs uppercase text-slate-500">{entry.sessionId}</p>
                <p>{entry.comment ?? "Wurf"}</p>
              </li>
            ))
          ) : (
            <li className="text-slate-500">Noch keine Würfe.</li>
          )}
        </ul>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-xs text-slate-400">
        <p>Moderationsaktionen folgen: Broadcast, Panik, Clear.</p>
      </div>
    </section>
  );
}
