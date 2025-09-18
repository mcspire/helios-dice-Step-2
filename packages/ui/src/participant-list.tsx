import type { Participant } from "@helios/types";

export function ParticipantList({ participants }: { participants: Participant[] }) {
  return (
    <aside className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
      <h2 className="text-lg font-semibold text-white">Crew</h2>
      <ul className="mt-4 space-y-3 text-sm text-slate-300">
        {participants.length ? (
          participants.map((participant) => (
            <li key={participant.id} className="flex items-center justify-between">
              <span>{participant.user?.displayName ?? participant.userId}</span>
              <span className="rounded-full bg-slate-800 px-2 py-1 text-xs uppercase text-slate-400">
                {participant.role}
              </span>
            </li>
          ))
        ) : (
          <li className="text-slate-500">Noch keine Teilnehmer.</li>
        )}
      </ul>
    </aside>
  );
}
