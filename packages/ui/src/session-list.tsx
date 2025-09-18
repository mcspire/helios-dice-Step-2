import Link from "next/link";
import type { Session } from "@helios/types";
import { Button } from "./button";

interface SessionListProps {
  sessions: Session[];
  detailed?: boolean;
}

export function SessionList({ sessions, detailed = false }: SessionListProps) {
  if (!sessions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-800 p-6 text-center text-sm text-slate-400">
        Noch keine Sessions vorhanden.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sessions.map((session) => (
        <li
          key={session.id}
          className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between"
        >
          <div>
            <h3 className="text-base font-semibold text-white">{session.name}</h3>
            {session.description && <p className="text-sm text-slate-400">{session.description}</p>}
            {detailed && (
              <p className="text-xs text-slate-500">
                Aktiv seit {session.createdAt.toLocaleDateString()} • Module: {session.modulesEnabled.join(", ")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link href={`/(dashboard)/sessions/${session.id}`}>
              <Button variant="secondary" size="sm">
                Details
              </Button>
            </Link>
            <Link href={`/dice?session=${session.id}`}>
              <Button size="sm">Starten</Button>
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
