"use client";

import { createContext, useContext } from "react";

export interface RealtimeSessionContextValue {
  sessionId: string;
  userId: string;
}

export const RealtimeSessionContext = createContext<RealtimeSessionContextValue | null>(null);

export function useRealtimeSession() {
  const context = useContext(RealtimeSessionContext);
  if (!context) {
    throw new Error("useRealtimeSession must be used within a RealtimeProvider");
  }
  return context;
}

