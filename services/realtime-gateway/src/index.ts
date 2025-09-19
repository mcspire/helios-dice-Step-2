import express from "express";
import { createServer } from "http";
import type { IncomingMessage } from "http";
import { randomUUID } from "crypto";
import Redis from "ioredis";
import { ExpressPeerServer } from "peer";
import { WebSocketServer, type WebSocket } from "ws";
import { z } from "zod";
import { realtimeEventSchema, type RealtimeEvent } from "@helios/types";
import { jwtVerify } from "jose";

interface GatewayClient {
  id: string;
  sessionId: string;
  userId: string;
  peerId?: string;
  ws: WebSocket;
}

interface GatewayEventPayload {
  event: RealtimeEvent;
  sessionId: string;
  origin?: {
    clientId?: string;
    userId?: string;
    peerId?: string;
  };
  timestamp: number;
}

const gatewayMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("event"), event: realtimeEventSchema }),
  z.object({ type: z.literal("peer-ready"), peerId: z.string() }),
  z.object({ type: z.literal("heartbeat") }),
]);

const redisPayloadSchema = z.object({
  event: realtimeEventSchema,
  sessionId: z.string(),
  origin: z
    .object({
      clientId: z.string().optional(),
      userId: z.string().optional(),
      peerId: z.string().optional(),
    })
    .optional(),
  timestamp: z.number(),
});

const PORT = Number(process.env.PORT ?? 4001);
const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

const redisPublisher = new Redis(REDIS_URL, { maxRetriesPerRequest: 0 });
const redisSubscriber = new Redis(REDIS_URL, { maxRetriesPerRequest: 0 });

const clients = new Map<string, GatewayClient>();
const sessions = new Map<string, Set<string>>();
const subscriptionCount = new Map<string, number>();

function channelName(sessionId: string) {
  return `session:${sessionId}`;
}

function log(level: "info" | "warn" | "error", message: string, context?: Record<string, unknown>) {
  const payload = context ? `${message} ${JSON.stringify(context)}` : message;
  if (level === "info") {
    console.log(`[gateway] ${payload}`);
  } else if (level === "warn") {
    console.warn(`[gateway] ${payload}`);
  } else {
    console.error(`[gateway] ${payload}`);
  }
}

const REALTIME_SECRET = new TextEncoder().encode(
  process.env.REALTIME_TOKEN_SECRET ?? process.env.ACCESS_TOKEN_SECRET ?? "insecure-access-secret"
);

async function validateToken(token: string, sessionId: string, userId: string) {
  try {
    const { payload } = await jwtVerify(token, REALTIME_SECRET, {
      audience: "helios-realtime",
      issuer: "helios-platform",
    });
    return payload.sessionId === sessionId && payload.userId === userId;
  } catch (error) {
    log("warn", "failed to validate realtime token", { error: String(error) });
    return false;
  }
}

function safeSend(ws: WebSocket, data: unknown) {
  if (ws.readyState !== ws.OPEN) return;
  try {
    ws.send(typeof data === "string" ? data : JSON.stringify(data));
  } catch (error) {
    log("warn", "failed to send websocket payload", { error: String(error) });
  }
}

async function subscribeSession(sessionId: string) {
  const count = subscriptionCount.get(sessionId) ?? 0;
  if (count === 0) {
    await redisSubscriber.subscribe(channelName(sessionId));
  }
  subscriptionCount.set(sessionId, count + 1);
}

async function unsubscribeSession(sessionId: string) {
  const count = subscriptionCount.get(sessionId);
  if (!count) return;
  if (count <= 1) {
    subscriptionCount.delete(sessionId);
    await redisSubscriber.unsubscribe(channelName(sessionId));
  } else {
    subscriptionCount.set(sessionId, count - 1);
  }
}

function addClientToSession(client: GatewayClient) {
  const members = sessions.get(client.sessionId) ?? new Set<string>();
  members.add(client.id);
  sessions.set(client.sessionId, members);
}

async function removeClient(client: GatewayClient) {
  clients.delete(client.id);
  const members = sessions.get(client.sessionId);
  if (members) {
    members.delete(client.id);
    if (members.size === 0) {
      sessions.delete(client.sessionId);
      await unsubscribeSession(client.sessionId);
    }
  }
  if (client.peerId) {
    broadcastMessage(client.sessionId, { type: "peer-removed", peerId: client.peerId }, client.id);
  }
}

function broadcastMessage(sessionId: string, message: Record<string, unknown>, excludeClientId?: string) {
  const members = sessions.get(sessionId);
  if (!members) return;
  const payload = JSON.stringify(message);
  for (const clientId of members) {
    if (excludeClientId && clientId === excludeClientId) continue;
    const client = clients.get(clientId);
    if (!client) continue;
    safeSend(client.ws, payload);
  }
}

async function publishEvent(client: GatewayClient, event: RealtimeEvent) {
  const payload: GatewayEventPayload = {
    event,
    sessionId: client.sessionId,
    origin: { clientId: client.id, userId: client.userId, peerId: client.peerId },
    timestamp: Date.now(),
  };
  await redisPublisher.publish(channelName(client.sessionId), JSON.stringify(payload));
}

function handleGatewayPayload(client: GatewayClient, raw: string) {
  const parsed = (() => {
    try {
      return JSON.parse(raw);
    } catch (error) {
      log("warn", "failed to parse gateway payload", { error: String(error) });
      return null;
    }
  })();
  if (!parsed) return;

  const result = gatewayMessageSchema.safeParse(parsed);
  if (!result.success) {
    log("warn", "received malformed message", { issues: result.error.issues });
    return;
  }

  const message = result.data;
  switch (message.type) {
    case "event":
      publishEvent(client, message.event).catch((error) =>
        log("error", "failed to publish realtime event", { error: String(error) })
      );
      break;
    case "peer-ready":
      client.peerId = message.peerId;
      notifyPeerAvailability(client);
      break;
    case "heartbeat":
      safeSend(client.ws, { type: "heartbeat", timestamp: Date.now() });
      break;
    default:
      break;
  }
}

function notifyPeerAvailability(client: GatewayClient) {
  if (!client.peerId) return;
  const members = sessions.get(client.sessionId);
  if (!members) return;

  for (const memberId of members) {
    const member = clients.get(memberId);
    if (!member || member.id === client.id) continue;
    if (client.peerId) {
      safeSend(member.ws, {
        type: "peer-available",
        peerId: client.peerId,
        userId: client.userId,
      });
    }
    if (member.peerId) {
      safeSend(client.ws, {
        type: "peer-available",
        peerId: member.peerId,
        userId: member.userId,
      });
    }
  }
}

async function handleConnection(ws: WebSocket, request: IncomingMessage) {
  const url = new URL(request.url ?? "", "http://localhost");
  const sessionId = url.searchParams.get("sessionId");
  const userId = url.searchParams.get("userId");
  const token = url.searchParams.get("token");
  const peerId = url.searchParams.get("peerId") ?? undefined;

  if (!sessionId || !userId || !token || !(await validateToken(token, sessionId, userId))) {
    safeSend(ws, { type: "error", message: "unauthorized" });
    ws.close(1008, "Unauthorized");
    return;
  }

  const clientId = randomUUID();
  const client: GatewayClient = { id: clientId, sessionId, userId, peerId, ws };
  clients.set(clientId, client);
  addClientToSession(client);
  subscribeSession(sessionId).catch((error) => {
    log("error", "failed to subscribe session", { error: String(error) });
  });

  safeSend(ws, { type: "connected", clientId });

  if (peerId) {
    notifyPeerAvailability(client);
  }

  ws.on("message", (data) => {
    handleGatewayPayload(client, data.toString());
  });

  ws.on("close", () => {
    removeClient(client).catch((error) => log("error", "failed to remove client", { error: String(error) }));
  });

  ws.on("error", (error) => {
    log("warn", "websocket error", { error: String(error) });
    removeClient(client).catch((err) => log("error", "failed to clean client on error", { error: String(err) }));
  });
}

function broadcastRedisPayload(channel: string, message: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(message);
  } catch (error) {
    log("warn", "failed to parse redis payload", { error: String(error) });
    return;
  }

  const result = redisPayloadSchema.safeParse(parsed);
  if (!result.success) {
    log("warn", "invalid payload from redis", { issues: result.error.issues });
    return;
  }
  const data = result.data;
  broadcastMessage(data.sessionId, { type: "event", event: data.event, origin: data.origin, timestamp: data.timestamp });
}

redisSubscriber.on("message", (channel, message) => {
  broadcastRedisPayload(channel, message);
});

const app = express();
app.get("/healthz", (_req, res) => {
  res.json({ status: "ok" });
});

const server = createServer(app);

const peerServer = ExpressPeerServer(server, {
  path: "/peerjs",
  allow_discovery: true,
  proxied: true,
});

app.use("/peerjs", peerServer);

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (request, socket, head) => {
  if (!request.url?.startsWith("/ws")) {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws, request) => {
  handleConnection(ws, request).catch((error) => {
    log("error", "failed to handle websocket connection", { error: String(error) });
    ws.close(1011, "Internal error");
  });
});

server.listen(PORT, () => {
  log("info", `realtime gateway listening on :${PORT}`);
});

process.on("SIGTERM", async () => {
  log("info", "shutting down realtime gateway");
  await redisPublisher.quit();
  await redisSubscriber.quit();
  server.close(() => process.exit(0));
});
