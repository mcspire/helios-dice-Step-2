import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionById, authenticateUser, UnauthorizedError } from "@helios/utils/server";
import { prisma } from "@helios/utils/prisma";
import { moduleIdSchema, sessionStatusSchema } from "@helios/types/session";

interface Params {
  params: { id: string };
}

const updateSchema = z.object({
  name: z.string().min(3).optional(),
  description: z.string().max(240).nullable().optional(),
  status: sessionStatusSchema.optional(),
  modulesEnabled: z.array(moduleIdSchema).optional(),
});

export async function GET(_: Request, { params }: Params) {
  try {
    const session = await getSessionById(params.id);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const existing = await prisma.session.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const { userId } = await authenticateUser();
    if (existing.ownerId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }

    const parse = updateSchema.safeParse(body);
    if (!parse.success) {
      return NextResponse.json({ error: "Ungültige Session-Daten" }, { status: 400 });
    }

    await prisma.session.update({
      where: { id: params.id },
      data: {
        ...parse.data,
      },
    });

    const session = await getSessionById(params.id);
    if (!session) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json(session);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
