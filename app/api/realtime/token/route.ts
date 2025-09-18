import { NextResponse } from "next/server";
import { issueRealtimeToken } from "@helios/utils/server";

export async function POST(request: Request) {
  const { sessionId } = await request.json();
  const token = await issueRealtimeToken(sessionId);
  return NextResponse.json(token);
}
