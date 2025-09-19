import { NextResponse } from "next/server";
import { getSessionParticipants, UnauthorizedError } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  try {
    const participants = await getSessionParticipants(params.id);
    return NextResponse.json({ participants });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
