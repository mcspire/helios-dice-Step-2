import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getSessionById, getSessionParticipants } from "@helios/utils/server";
import { SessionOverview } from "@helios/ui/session-overview";
import { ParticipantList } from "@helios/ui/participant-list";
import { ModuleLaunchPad } from "@helios/ui/module-launch-pad";

interface SessionPageProps {
  params: { sessionId: string };
}

export default async function SessionPage({ params }: SessionPageProps) {
  const session = await getSessionById(params.sessionId);

  if (!session) {
    notFound();
  }

  const participants = await getSessionParticipants(session.id);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-10">
      <SessionOverview session={session} />
      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Suspense fallback={<p className="text-sm text-slate-400">Teilnehmer werden geladen…</p>}>
          <ParticipantList participants={participants} />
        </Suspense>
        <ModuleLaunchPad session={session} />
      </section>
    </main>
  );
}
