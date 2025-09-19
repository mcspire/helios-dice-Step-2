import { NextResponse } from "next/server";
import { createSessionAction, getActiveSessions, UnauthorizedError } from "@helios/utils/server";

export async function GET() {
  try {
    const sessions = await getActiveSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null || typeof (body as { name?: unknown }).name !== "string") {
    return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
  }

  try {
    const session = await createSessionAction({
      name: (body as { name: string }).name,
      description: (body as { description?: string }).description,
    });
    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
