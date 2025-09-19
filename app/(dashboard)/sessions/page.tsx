import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createSessionAction, getActiveSessions, UnauthorizedError } from "@helios/utils/server";
import { SessionList } from "@helios/ui/session-list";
import { SessionCreateCard } from "@helios/ui/session-create-card";

export default async function SessionsPage() {
  try {
    const sessions = await getActiveSessions();

    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-slate-100">Sessions</h1>
          <p className="text-sm text-slate-400">
            Verwalte deine Spielrunden, lade Spieler ein und starte Module direkt aus dem Hub.
          </p>
        </header>

        <SessionCreateCard onCreate={createSessionAction} />

        <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Suspense fallback={<p className="text-sm text-slate-400">Lade Sessions…</p>}>
            <SessionList sessions={sessions} detailed />
          </Suspense>
          <aside className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
              Schnellzugriff
            </h2>
            <div className="flex flex-col gap-2 text-sm">
              <Link href="/dice" className="text-brand-light hover:underline">
                Dice Modul öffnen
              </Link>
              <Link href="/map" className="text-brand-light hover:underline">
                Map Modul öffnen
              </Link>
              <Link href="/characters" className="text-brand-light hover:underline">
                Charakter Modul öffnen
              </Link>
            </div>
          </aside>
        </section>
      </main>
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}
