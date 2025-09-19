import { cookies } from "next/headers";
import Redis from "ioredis";
import { mapLayerUpdateSchema } from "@helios/types/map";
import type {
  Character,
  CharacterUpdateInput,
} from "@helios/types/character";
import type { DiceRollInput, RollOutcome } from "@helios/types/dice";
import type { MapLayerUpdate, MapState } from "@helios/types/map";
import type { Participant, Session } from "@helios/types/session";
import type { Role, User } from "@helios/types/user";
import type { RealtimeEvent } from "@helios/types";
import { log } from "./logger";
import { prisma } from "./prisma";
import {
  ACCESS_COOKIE,
  createAuthTokens,
  createRealtimeToken,
  setAuthCookies,
  verifyAccessToken,
} from "./auth";

export const DEFAULT_SESSION_ID =
  process.env.HELIOS_DEFAULT_SESSION_ID ?? "00000000-0000-0000-0000-000000000000";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthenticated") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

function mapSession(session: { id: string; ownerId: string; name: string; description: string | null; status: string; modulesEnabled: string[]; createdAt: Date; archivedAt: Date | null; }): Session {
  return {
    id: session.id,
    ownerId: session.ownerId,
    name: session.name,
    description: session.description ?? undefined,
    status: session.status as Session["status"],
    modulesEnabled: session.modulesEnabled as Session["modulesEnabled"],
    createdAt: session.createdAt,
    archivedAt: session.archivedAt,
  };
}

function mapUser(user: {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  theme: string;
  roles: string[];
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl ?? undefined,
    theme: user.theme,
    roles: (user.roles ?? []) as Role[],
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function mapParticipant(participant: {
  id: string;
  sessionId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  lastSeenAt: Date | null;
  user?: ReturnType<typeof mapUser>;
}): Participant {
  return {
    id: participant.id,
    sessionId: participant.sessionId,
    userId: participant.userId,
    role: participant.role as Participant["role"],
    joinedAt: participant.joinedAt,
    lastSeenAt: participant.lastSeenAt,
    user: participant.user,
  };
}

function mapCharacter(character: {
  id: string;
  sessionId: string;
  ownerId: string;
  name: string;
  role: string;
  attributesJson: unknown;
  inventoryJson: unknown;
  status: string;
  updatedAt: Date;
}): Character {
  return {
    id: character.id,
    sessionId: character.sessionId,
    ownerId: character.ownerId,
    name: character.name,
    role: character.role as Character["role"],
    attributes: (character.attributesJson ?? []) as Character["attributes"],
    inventory: (character.inventoryJson ?? []) as Character["inventory"],
    status: character.status as Character["status"],
    updatedAt: character.updatedAt,
  };
}

interface AuthenticatedUser {
  userId: string;
  email: string;
  displayName: string;
  roles: Role[];
}

async function readAccessToken() {
  const token = cookies().get(ACCESS_COOKIE)?.value;
  if (!token) {
    throw new UnauthorizedError();
  }
  return token;
}

async function ensureSessionMembership(sessionId: string, userId: string) {
  const session = await prisma.session.findUnique({ where: { id: sessionId }, select: { ownerId: true } });
  if (!session) {
    return false;
  }
  if (session.ownerId === userId) {
    return true;
  }
  const participant = await prisma.participant.findFirst({ where: { sessionId, userId } });
  if (!participant) {
    if (sessionId === DEFAULT_SESSION_ID) {
      await prisma.participant.create({
        data: {
          sessionId,
          userId,
          role: "PLAYER",
        },
      });
      return true;
    }
    throw new UnauthorizedError("Insufficient permissions for session");
  }
  return true;
}

export async function authenticateUser(): Promise<AuthenticatedUser> {
  const token = await readAccessToken();
  let payload: { sub?: string; email?: string; displayName?: string; roles?: Role[] };
  try {
    payload = await verifyAccessToken(token);
  } catch (error) {
    throw new UnauthorizedError();
  }
  if (!payload?.sub) {
    throw new UnauthorizedError();
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError();
  }
  return {
    userId: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: (user.roles ?? []) as Role[],
  };
}

export async function refreshSessionFromCookies() {
  const token = await readAccessToken();
  const payload = await verifyAccessToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new UnauthorizedError();
  }
  const tokens = await createAuthTokens({
    sub: user.id,
    email: user.email,
    displayName: user.displayName,
    roles: (user.roles ?? []) as Role[],
  });
  await setAuthCookies(tokens);
  return tokens;
}

export async function getActiveSessions(): Promise<Session[]> {
  const { userId } = await authenticateUser();
  const sessions = await prisma.session.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { participants: { some: { userId } } },
      ],
    },
    orderBy: { createdAt: "desc" },
  });
  const unique = new Map<string, Session>();
  for (const session of sessions) {
    unique.set(session.id, mapSession(session));
  }
  return Array.from(unique.values());
}

export async function createSessionAction(input: { name: string; description?: string }) {
  const { userId } = await authenticateUser();
  const session = await prisma.session.create({
    data: {
      name: input.name,
      description: input.description,
      status: "ACTIVE",
      modulesEnabled: ["dice", "map", "characters"],
      ownerId: userId,
      participants: {
        create: { userId, role: "GM" },
      },
    },
  });
  return mapSession(session);
}

export async function getSessionById(id: string) {
  const { userId } = await authenticateUser();
  const session = await prisma.session.findUnique({ where: { id } });
  if (!session) {
    return null;
  }
  await ensureSessionMembership(id, userId);
  return mapSession(session);
}

export async function getSessionParticipants(sessionId: string) {
  const { userId } = await authenticateUser();
  const accessible = await ensureSessionMembership(sessionId, userId);
  if (!accessible) {
    return [];
  }
  const participants = await prisma.participant.findMany({
    where: { sessionId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });
  return participants.map((participant) =>
    mapParticipant({
      id: participant.id,
      sessionId: participant.sessionId,
      userId: participant.userId,
      role: participant.role,
      joinedAt: participant.joinedAt,
      lastSeenAt: participant.lastSeenAt,
      user: participant.user ? mapUser(participant.user) : undefined,
    })
  );
}

export async function saveRollResult(result: RollOutcome) {
  const { userId } = await authenticateUser();
  if (result.userId !== userId) {
    await ensureSessionMembership(result.sessionId, userId);
  }
  await prisma.rollLog.create({
    data: {
      id: result.id,
      sessionId: result.sessionId,
      userId: result.userId,
      results: result.results,
      successes: result.successes,
      crit: result.crit,
      panic: result.panic,
      createdAt: result.createdAt,
    },
  });
}

export async function clearRolls(sessionId: string) {
  const { userId, roles } = await authenticateUser();
  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return;
  if (session.ownerId !== userId && !roles.includes("GM")) {
    throw new UnauthorizedError("Nur GM dürfen Würfe leeren");
  }
  await prisma.rollLog.deleteMany({ where: { sessionId } });
}

export async function getRollHistory(sessionId: string, limit = 20): Promise<RollOutcome[]> {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(sessionId, userId);
  const entries = await prisma.rollLog.findMany({
    where: { sessionId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
  return entries.map((entry) => ({
    id: entry.id,
    sessionId: entry.sessionId,
    userId: entry.userId,
    results: entry.results as RollOutcome["results"],
    successes: entry.successes,
    crit: entry.crit,
    panic: entry.panic,
    createdAt: entry.createdAt,
  }));
}

export async function getDicePresets(sessionId: string = DEFAULT_SESSION_ID): Promise<DiceRollInput[]> {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(sessionId, userId);
  const presets = await prisma.dicePreset.findMany({
    where: { sessionId, userId },
    orderBy: { updatedAt: "desc" },
  });
  return presets.map((preset) => ({
    sessionId: preset.sessionId,
    userId: preset.userId,
    pool: preset.pool as DiceRollInput["pool"],
    advantage: preset.advantage,
    comment: preset.comment ?? undefined,
  }));
}

export async function saveDicePreset(preset: DiceRollInput) {
  const { userId } = await authenticateUser();
  if (preset.userId !== userId) {
    throw new UnauthorizedError("Presets können nur für den eigenen Account gespeichert werden");
  }
  if (!preset.comment) {
    throw new Error("Ein Kommentar ist erforderlich, um das Preset zu identifizieren");
  }
  await prisma.dicePreset.upsert({
    where: {
      sessionId_userId_comment: {
        sessionId: preset.sessionId,
        userId,
        comment: preset.comment,
      },
    },
    update: {
      pool: preset.pool,
      advantage: preset.advantage,
    },
    create: {
      sessionId: preset.sessionId,
      userId,
      comment: preset.comment,
      pool: preset.pool,
      advantage: preset.advantage,
    },
  });
}

export async function getMapState(sessionId: string = DEFAULT_SESSION_ID): Promise<MapState> {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(sessionId, userId);
  const mapState = await prisma.mapState.findUnique({ where: { sessionId } });
  if (!mapState) {
    return {
      sessionId,
      backgroundUrl: null,
      layers: [],
      tokens: [],
      updatedAt: new Date(0),
    };
  }
  const payload = (mapState.stateJson ?? {}) as Omit<MapState, "sessionId" | "updatedAt">;
  return {
    sessionId,
    backgroundUrl: payload.backgroundUrl ?? null,
    layers: payload.layers ?? [],
    tokens: payload.tokens ?? [],
    fogOfWar: payload.fogOfWar,
    updatedAt: mapState.updatedAt,
  };
}

export async function updateMapLayer(update: MapLayerUpdate) {
  const parsed = mapLayerUpdateSchema.parse(update);
  const { userId } = await authenticateUser();
  await ensureSessionMembership(parsed.sessionId, userId);
  const existing = await prisma.mapState.findUnique({ where: { sessionId: parsed.sessionId } });
  const baseState = existing
    ? ((existing.stateJson ?? {}) as Partial<MapState>)
    : { backgroundUrl: null, layers: [], tokens: [] };
  const layers = (baseState.layers ?? []).map((layer) =>
    layer.id === parsed.layerId ? { ...layer, ...parsed.changes } : layer
  );
  await prisma.mapState.upsert({
    where: { sessionId: parsed.sessionId },
    update: {
      stateJson: {
        backgroundUrl: baseState.backgroundUrl ?? null,
        layers,
        tokens: baseState.tokens ?? [],
        fogOfWar: baseState.fogOfWar,
      },
    },
    create: {
      sessionId: parsed.sessionId,
      stateJson: {
        backgroundUrl: baseState.backgroundUrl ?? null,
        layers,
        tokens: baseState.tokens ?? [],
        fogOfWar: baseState.fogOfWar,
      },
    },
  });
}

export async function getCharacters(sessionId: string = DEFAULT_SESSION_ID): Promise<Character[]> {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(sessionId, userId);
  const characters = await prisma.character.findMany({
    where: { sessionId },
    orderBy: { name: "asc" },
  });
  return characters.map(mapCharacter);
}

export async function updateCharacter(update: CharacterUpdateInput) {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(update.sessionId, userId);
  await prisma.character.update({
    where: { id: update.id },
    data: {
      attributesJson: update.attributes ?? undefined,
      inventoryJson: update.inventory ?? undefined,
      status: update.status ?? undefined,
    },
  });
}

export async function issueRealtimeToken(sessionId: string) {
  const { userId } = await authenticateUser();
  await ensureSessionMembership(sessionId, userId);
  return createRealtimeToken({ sessionId, userId });
}

let redisPublisher: Redis | null = null;

function getRedisPublisher() {
  if (redisPublisher) return redisPublisher;
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  redisPublisher = new Redis(url, {
    maxRetriesPerRequest: 0,
  });
  redisPublisher.on("error", (error) => {
    log("warn", "Redis publisher encountered an error", {
      error: error instanceof Error ? error.message : String(error),
    });
  });
  return redisPublisher;
}

export async function publishRealtimeEvent(sessionId: string, event: RealtimeEvent) {
  try {
    const publisher = getRedisPublisher();
    const payload = JSON.stringify({
      event,
      sessionId,
      timestamp: Date.now(),
    });
    await publisher.publish(`session:${sessionId}`, payload);
  } catch (error) {
    log("warn", "Failed to publish realtime event", {
      sessionId,
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
