"use client";

import { ReactNode, useEffect, useMemo } from "react";
import { connectRealtime, disconnectRealtime, type PeerServerConfig, type RealtimeClientOptions } from "./client";
import { RealtimeSessionContext } from "./session-context";

interface RealtimeProviderProps {
  sessionId: string;
  userId: string;
  token: string;
  gatewayUrl: string;
  peerServer?: PeerServerConfig;
  reconnectDelayMs?: number;
  children: ReactNode;
}

function serializePeerConfig(config?: PeerServerConfig) {
  if (!config) return undefined;
  return `${config.host}:${config.port ?? ""}:${config.path ?? ""}:${config.secure ? "1" : "0"}`;
}

export function RealtimeProvider({
  sessionId,
  userId,
  token,
  gatewayUrl,
  peerServer,
  reconnectDelayMs,
  children,
}: RealtimeProviderProps) {
  useEffect(() => {
    let cancelled = false;

    const options: RealtimeClientOptions = {
      sessionId,
      userId,
      token,
      gatewayUrl,
      peerServer,
      reconnectDelayMs,
    };

    connectRealtime(options).catch((error) => {
      if (!cancelled) {
        console.error("[realtime] failed to establish connection", error);
      }
    });

    return () => {
      cancelled = true;
      disconnectRealtime();
    };
  }, [sessionId, userId, token, gatewayUrl, serializePeerConfig(peerServer), reconnectDelayMs]);

  const value = useMemo(() => ({ sessionId, userId }), [sessionId, userId]);

  return <RealtimeSessionContext.Provider value={value}>{children}</RealtimeSessionContext.Provider>;
}

