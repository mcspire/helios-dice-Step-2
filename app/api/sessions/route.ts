import { NextResponse } from "next/server";
import { createSessionAction, getActiveSessions } from "@helios/utils/server";

export async function GET() {
  const sessions = await getActiveSessions();
  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const body = await request.json();
  const session = await createSessionAction({ name: body.name, description: body.description });
  return NextResponse.json(session, { status: 201 });
}
