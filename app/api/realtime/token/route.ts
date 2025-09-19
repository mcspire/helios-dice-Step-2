import { NextResponse } from "next/server";
import { issueRealtimeToken, UnauthorizedError } from "@helios/utils/server";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  }

  const sessionId = typeof (body as { sessionId?: unknown }).sessionId === "string"
    ? (body as { sessionId: string }).sessionId
    : null;
  if (!sessionId) {
    return NextResponse.json({ error: "sessionId erforderlich" }, { status: 400 });
  }

  try {
    const credential = await issueRealtimeToken(sessionId);
    const gatewayUrl =
      process.env.NEXT_PUBLIC_REALTIME_GATEWAY_URL ??
      process.env.REALTIME_GATEWAY_URL ??
      "ws://localhost:4001/ws";
    const peerConfig = {
      host: process.env.NEXT_PUBLIC_PEER_HOST ?? process.env.PEER_HOST ?? "localhost",
      port: Number(process.env.NEXT_PUBLIC_PEER_PORT ?? process.env.PEER_PORT ?? "4001"),
      path: process.env.NEXT_PUBLIC_PEER_PATH ?? process.env.PEER_PATH ?? "/peerjs",
      secure: (process.env.NEXT_PUBLIC_PEER_SECURE ?? process.env.PEER_SECURE ?? "false") === "true",
    };
    return NextResponse.json({
      token: credential.token,
      expiresAt: credential.expiresAt,
      gatewayUrl,
      peerConfig,
    });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    throw error;
  }
}
