import Link from "next/link";
import { Suspense } from "react";
import { HubHeader } from "@helios/ui/hub-header";
import { ModuleTile } from "@helios/ui/module-tile";
import { SessionList } from "@helios/ui/session-list";
import { getModuleSummaries } from "@helios/utils/module-registry";
import { getActiveSessions } from "@helios/utils/server";

export default async function HomePage() {
  const [modules, sessions] = await Promise.all([
    getModuleSummaries(),
    getActiveSessions(),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
      <HubHeader
        title="HELIOS Plattform"
        description="Zentrale Übersicht für alle verbundenen Module und Sessions"
      />

      <section>
        <h2 className="text-lg font-semibold text-slate-100">Module</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <ModuleTile key={module.id} module={module} />
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-100">Deine Sessions</h2>
          <Link
            href="/(dashboard)/sessions"
            className="text-sm font-medium text-brand-light hover:underline"
          >
            Alle anzeigen
          </Link>
        </div>
        <Suspense fallback={<p className="text-sm text-slate-400">Lade Sessions…</p>}>
          <SessionList sessions={sessions} />
        </Suspense>
      </section>
    </main>
  );
}
