import { NextResponse } from "next/server";
import { z } from "zod";
import { dicePoolSchema } from "@helios/types/dice";
import { authenticateUser, saveDicePreset, UnauthorizedError } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

const presetSchema = z.object({
  pool: dicePoolSchema,
  advantage: z.boolean().optional(),
  comment: z.string().min(1, "Kommentar erforderlich"),
});

export async function POST(request: Request, { params }: Params) {
  try {
    const { userId } = await authenticateUser();

    let payload: unknown;
    try {
      payload = await request.json();
    } catch (error) {
      return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
    }

    const parsed = presetSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: "Preset-Daten ungültig" }, { status: 400 });
    }

    await saveDicePreset({
      sessionId: params.id,
      userId,
      pool: parsed.data.pool,
      advantage: parsed.data.advantage ?? false,
      comment: parsed.data.comment,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
