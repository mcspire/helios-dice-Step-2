import { ReactNode } from "react";
import { RealtimeProvider } from "@helios/realtime";
import { DiceSidebar } from "@helios/ui/dice-sidebar";
import { authenticateUser, issueRealtimeToken } from "@helios/utils/server";

const STATIC_SESSION_ID = "00000000-0000-0000-0000-000000000000";

function resolveGatewayUrl() {
  return (
    process.env.NEXT_PUBLIC_REALTIME_GATEWAY_URL ??
    process.env.REALTIME_GATEWAY_URL ??
    "ws://localhost:4001/ws"
  );
}

function resolvePeerConfig() {
  const host = process.env.NEXT_PUBLIC_PEER_HOST ?? process.env.PEER_HOST ?? "localhost";
  const port = Number(process.env.NEXT_PUBLIC_PEER_PORT ?? process.env.PEER_PORT ?? "4001");
  const path = process.env.NEXT_PUBLIC_PEER_PATH ?? process.env.PEER_PATH ?? "/peerjs";
  const secure = (process.env.NEXT_PUBLIC_PEER_SECURE ?? process.env.PEER_SECURE ?? "false") === "true";
  return { host, port, path, secure };
}

export default async function DiceLayout({ children }: { children: ReactNode }) {
  const { userId } = await authenticateUser();
  const credential = await issueRealtimeToken(STATIC_SESSION_ID);
  const gatewayUrl = resolveGatewayUrl();
  const peerConfig = resolvePeerConfig();

  return (
    <RealtimeProvider
      sessionId={STATIC_SESSION_ID}
      userId={userId}
      token={credential.token}
      gatewayUrl={gatewayUrl}
      peerServer={peerConfig}
    >
      <div className="grid min-h-screen grid-cols-[320px_1fr] bg-slate-950 text-slate-50">
        <DiceSidebar />
        <div className="flex flex-col overflow-hidden">{children}</div>
      </div>
    </RealtimeProvider>
  );
}
