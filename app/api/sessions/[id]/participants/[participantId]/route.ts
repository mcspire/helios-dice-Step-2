import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@helios/utils/prisma";
import { authenticateUser, UnauthorizedError } from "@helios/utils/server";
import { roleSchema } from "@helios/types/user";

interface Params {
  params: { id: string; participantId: string };
}

const updateSchema = z.object({
  role: roleSchema.optional(),
  lastSeenAt: z.string().datetime().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await prisma.session.findUnique({ where: { id: params.id } });
    if (!session) {
      return NextResponse.json({ error: "Session nicht gefunden" }, { status: 404 });
    }

    const { userId } = await authenticateUser();
    if (session.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }

    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Ungültige Teilnehmerdaten" }, { status: 400 });
    }

    const existingParticipant = await prisma.participant.findUnique({ where: { id: params.participantId } });
    if (!existingParticipant) {
      return NextResponse.json({ error: "Teilnehmer nicht gefunden" }, { status: 404 });
    }

    const participant = await prisma.participant.update({
      where: { id: params.participantId },
      data: {
        role: parsed.data.role,
        lastSeenAt: parsed.data.lastSeenAt ? new Date(parsed.data.lastSeenAt) : undefined,
      },
      include: { user: true },
    });

    return NextResponse.json({
      participant: {
        id: participant.id,
        sessionId: participant.sessionId,
        userId: participant.userId,
        role: participant.role,
        joinedAt: participant.joinedAt,
        lastSeenAt: participant.lastSeenAt,
        user: participant.user
          ? {
              id: participant.user.id,
              email: participant.user.email,
              displayName: participant.user.displayName,
              avatarUrl: participant.user.avatarUrl,
              theme: participant.user.theme,
              roles: participant.user.roles,
              createdAt: participant.user.createdAt,
              updatedAt: participant.user.updatedAt,
            }
          : undefined,
      },
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
