import { NextResponse } from "next/server";
import { getSessionParticipants } from "@helios/utils/server";

interface Params {
  params: { id: string };
}

export async function GET(_: Request, { params }: Params) {
  const participants = await getSessionParticipants(params.id);
  return NextResponse.json({ participants });
}
