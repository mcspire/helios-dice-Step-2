import mitt from "mitt";
import Peer, { type DataConnection } from "peerjs";
import { realtimeEventSchema, type RealtimeEvent } from "@helios/types";

export interface PeerServerConfig {
  host: string;
  port?: number;
  path?: string;
  secure?: boolean;
}

export interface RealtimeClientOptions {
  sessionId: string;
  userId: string;
  token: string;
  gatewayUrl: string;
  peerServer?: PeerServerConfig;
  reconnectDelayMs?: number;
}

type InternalEvents = {
  event: RealtimeEvent;
  status: ConnectionState;
};

type ConnectionState =
  | { state: "connecting" }
  | { state: "connected" }
  | { state: "disconnected"; reason?: string };

type GatewayOutboundMessage =
  | { type: "event"; event: RealtimeEvent }
  | { type: "peer-ready"; peerId: string }
  | { type: "heartbeat" };

type GatewayInboundMessage =
  | { type: "event"; event: unknown }
  | { type: "peer-available"; peerId: string; userId?: string }
  | { type: "peer-removed"; peerId: string }
  | { type: "heartbeat"; timestamp: number }
  | { type: "ack"; eventId?: string }
  | { type: "connected"; clientId: string };

const DEFAULT_RECONNECT_DELAY = 2_000;

const emitter = mitt<InternalEvents>();

function parseRealtimeEvent(payload: unknown): RealtimeEvent | null {
  const parsed = realtimeEventSchema.safeParse(payload);
  return parsed.success ? parsed.data : null;
}

class RealtimeClient {
  private peer?: Peer;
  private peerId?: string;
  private gateway?: WebSocket;
  private connections = new Map<string, DataConnection>();
  private ready = false;
  private destroyed = false;
  private queue: RealtimeEvent[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly readyPromise: Promise<void>;
  private resolveReady?: () => void;

  constructor(private readonly options: RealtimeClientOptions) {
    this.readyPromise = new Promise((resolve) => {
      this.resolveReady = resolve;
    });
    emitter.emit("status", { state: "connecting" });
    if (typeof window === "undefined") {
      throw new Error("RealtimeClient must be instantiated in a browser environment");
    }
    this.bootstrapPeer();
  }

  matches(other: RealtimeClientOptions) {
    return (
      this.options.sessionId === other.sessionId &&
      this.options.userId === other.userId &&
      this.options.token === other.token &&
      this.options.gatewayUrl === other.gatewayUrl
    );
  }

  async ready() {
    await this.readyPromise;
  }

  publish(event: RealtimeEvent) {
    if (this.destroyed) return;
    if (this.ready) {
      this.dispatchEvent(event);
    } else {
      this.queue.push(event);
      this.scheduleReconnect();
    }
    emitter.emit("event", event);
  }

  subscribe(handler: (event: RealtimeEvent) => void) {
    emitter.on("event", handler);
    return () => emitter.off("event", handler);
  }

  destroy() {
    this.destroyed = true;
    this.ready = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.connections.forEach((connection) => {
      if (connection.open) {
        connection.close();
      }
    });
    this.connections.clear();
    this.gateway?.close();
    this.peer?.disconnect();
    this.peer?.destroy();
    emitter.emit("status", { state: "disconnected" });
  }

  private bootstrapPeer() {
    const { peerServer } = this.options;
    const host = peerServer?.host ?? window.location.hostname;
    const port = peerServer?.port ?? undefined;
    const path = peerServer?.path ?? "/peerjs";
    const secure =
      peerServer?.secure ?? (typeof window !== "undefined" ? window.location.protocol === "https:" : false);

    this.peer = new Peer(undefined, {
      host,
      port,
      path,
      secure,
      debug: 1,
    });

    this.peer.on("open", (id) => {
      this.peerId = id;
      this.openGatewayConnection(id);
    });

    this.peer.on("connection", (connection) => {
      this.registerPeerConnection(connection);
    });

    this.peer.on("error", (error) => {
      console.error("[realtime] PeerJS error", error);
      this.scheduleReconnect();
    });
  }

  private registerPeerConnection(connection: DataConnection) {
    this.connections.set(connection.peer, connection);

    connection.on("data", (payload) => {
      if (!payload) return;
      if (typeof payload === "object" && "event" in (payload as Record<string, unknown>)) {
        const event = parseRealtimeEvent((payload as { event: unknown }).event);
        if (event) {
          emitter.emit("event", event);
        }
      }
    });

    connection.on("close", () => {
      this.connections.delete(connection.peer);
    });

    connection.on("error", (error) => {
      console.warn("[realtime] Peer connection error", error);
      this.connections.delete(connection.peer);
    });
  }

  private openGatewayConnection(peerId: string) {
    try {
      const gatewayUrl = this.composeGatewayUrl(peerId);
      this.gateway = new WebSocket(gatewayUrl);
    } catch (error) {
      console.error("[realtime] Invalid gateway URL", error);
      this.scheduleReconnect();
      return;
    }

    this.gateway.addEventListener("open", () => {
      if (this.destroyed) return;
      this.ready = true;
      this.resolveReady?.();
      this.resolveReady = undefined;
      emitter.emit("status", { state: "connected" });
      this.flushQueue();
      this.sendToGateway({ type: "peer-ready", peerId });
    });

    this.gateway.addEventListener("message", (event) => {
      this.handleGatewayMessage(event.data);
    });

    this.gateway.addEventListener("close", (event) => {
      this.ready = false;
      emitter.emit("status", { state: "disconnected", reason: event.reason });
      if (!this.destroyed) {
        this.scheduleReconnect();
      }
    });

    this.gateway.addEventListener("error", (error) => {
      console.warn("[realtime] Gateway error", error);
      this.ready = false;
      if (!this.destroyed) {
        this.scheduleReconnect();
      }
    });
  }

  private composeGatewayUrl(peerId: string) {
    const base = this.options.gatewayUrl;
    const url = base.includes("ws://") || base.includes("wss://") ? new URL(base) : new URL(base, window.location.href);
    url.searchParams.set("sessionId", this.options.sessionId);
    url.searchParams.set("userId", this.options.userId);
    url.searchParams.set("token", this.options.token);
    url.searchParams.set("peerId", peerId);
    return url.toString();
  }

  private handleGatewayMessage(raw: unknown) {
    if (typeof raw !== "string") return;

    let message: GatewayInboundMessage | undefined;
    try {
      message = JSON.parse(raw) as GatewayInboundMessage;
    } catch (error) {
      console.warn("[realtime] Failed to parse gateway message", error);
      return;
    }

    if (!message) return;

    switch (message.type) {
      case "event": {
        const event = parseRealtimeEvent(message.event);
        if (event) {
          emitter.emit("event", event);
        }
        break;
      }
      case "peer-available": {
        if (!message.peerId || message.peerId === this.peerId) break;
        if (this.connections.has(message.peerId)) break;
        if (!this.peer) break;
        const connection = this.peer.connect(message.peerId, { reliable: true });
        this.registerPeerConnection(connection);
        break;
      }
      case "peer-removed": {
        if (message.peerId) {
          const connection = this.connections.get(message.peerId);
          if (connection?.open) {
            connection.close();
          }
          this.connections.delete(message.peerId);
        }
        break;
      }
      case "heartbeat": {
        this.sendToGateway({ type: "heartbeat" });
        break;
      }
      case "connected": {
        // No-op: acknowledgement of gateway registration.
        break;
      }
      case "ack":
        break;
      default:
        break;
    }
  }

  private sendToGateway(message: GatewayOutboundMessage) {
    if (!this.gateway || this.gateway.readyState !== WebSocket.OPEN) {
      return;
    }
    try {
      this.gateway.send(JSON.stringify(message));
    } catch (error) {
      console.warn("[realtime] Failed to send gateway message", error);
    }
  }

  private dispatchEvent(event: RealtimeEvent) {
    this.sendToGateway({ type: "event", event });
    this.connections.forEach((connection) => {
      if (connection.open) {
        connection.send({ type: "event", event });
      }
    });
  }

  private flushQueue() {
    if (!this.queue.length) return;
    const pending = [...this.queue];
    this.queue.length = 0;
    pending.forEach((event) => this.dispatchEvent(event));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer || this.destroyed) return;
    const delay = this.options.reconnectDelayMs ?? DEFAULT_RECONNECT_DELAY;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.destroyed) return;
      if (!this.peerId) {
        this.peer?.reconnect();
        return;
      }
      if (this.gateway && this.gateway.readyState === WebSocket.OPEN) {
        return;
      }
      this.openGatewayConnection(this.peerId);
    }, delay);
  }
}

let activeClient: RealtimeClient | null = null;
let connectPromise: Promise<RealtimeClient> | null = null;

export async function connectRealtime(options: RealtimeClientOptions) {
  if (typeof window === "undefined") {
    throw new Error("connectRealtime can only be used in the browser");
  }

  if (activeClient && activeClient.matches(options)) {
    await activeClient.ready();
    return activeClient;
  }

  if (connectPromise) {
    return connectPromise;
  }

  if (activeClient) {
    activeClient.destroy();
    activeClient = null;
  }

  const client = new RealtimeClient(options);
  activeClient = client;
  connectPromise = client
    .ready()
    .then(() => client)
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

export function disconnectRealtime() {
  activeClient?.destroy();
  activeClient = null;
}

export function publish(event: RealtimeEvent) {
  if (activeClient) {
    activeClient.publish(event);
  } else {
    emitter.emit("event", event);
  }
}

export function subscribe(handler: (event: RealtimeEvent) => void) {
  emitter.on("event", handler);
  return () => emitter.off("event", handler);
}

export function onConnectionStateChange(handler: (state: ConnectionState) => void) {
  emitter.on("status", handler);
  return () => emitter.off("status", handler);
}

export function getRealtimeClient() {
  return activeClient;
}

export type { ConnectionState };

