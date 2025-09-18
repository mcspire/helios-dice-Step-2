import { NextResponse } from "next/server";

interface Params {
  params: { id: string; participantId: string };
}

export async function PATCH(_: Request, { params }: Params) {
  return NextResponse.json({
    sessionId: params.id,
    participantId: params.participantId,
    status: "updated",
  });
}
