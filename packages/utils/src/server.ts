import { cache } from "react";
import { randomUUID } from "crypto";
import type {
  Character,
  CharacterUpdateInput,
  DiceRollInput,
  MapLayerUpdate,
  MapState,
  Participant,
  RollOutcome,
  Session,
} from "@helios/types";
import { mapLayerUpdateSchema } from "@helios/types";

interface StoredState {
  sessions: Session[];
  participants: Participant[];
  rollLog: RollOutcome[];
  characters: Character[];
  mapState: MapState;
  dicePresets: DiceRollInput[];
}

const now = () => new Date();

const defaultState: StoredState = {
  sessions: [
    {
      id: randomUUID(),
      ownerId: randomUUID(),
      name: "Weyland Testlauf",
      description: "Erste HELIOS Mission",
      status: "ACTIVE",
      modulesEnabled: ["dice", "map", "characters"],
      createdAt: now(),
      archivedAt: null,
    },
  ],
  participants: [],
  rollLog: [],
  characters: [],
  mapState: {
    sessionId: "00000000-0000-0000-0000-000000000000",
    backgroundUrl: null,
    layers: [
      { id: "base", name: "Basis", visible: true, opacity: 1 },
      { id: "fog", name: "Nebel", visible: true, opacity: 0.8 },
    ],
    tokens: [],
    updatedAt: now(),
  },
  dicePresets: [],
};

const state: StoredState = defaultState;

export const getActiveSessions = cache(async () => state.sessions);

export async function createSessionAction(input: { name: string; description?: string }) {
  const session: Session = {
    id: randomUUID(),
    ownerId: randomUUID(),
    name: input.name,
    description: input.description,
    status: "ACTIVE",
    modulesEnabled: ["dice", "map", "characters"],
    createdAt: now(),
    archivedAt: null,
  };
  state.sessions.push(session);
  return session;
}

export async function getSessionById(id: string) {
  return state.sessions.find((session) => session.id === id) ?? null;
}

export async function getSessionParticipants(sessionId: string) {
  return state.participants.filter((participant) => participant.sessionId === sessionId);
}

export async function saveRollResult(result: RollOutcome) {
  state.rollLog.push(result);
}

export async function clearRolls(sessionId: string) {
  state.rollLog = state.rollLog.filter((roll) => roll.sessionId !== sessionId);
}

export async function getDicePresets(): Promise<DiceRollInput[]> {
  return state.dicePresets;
}

export async function getMapState(): Promise<MapState> {
  return state.mapState;
}

export async function updateMapLayer(update: MapLayerUpdate) {
  const parsed = mapLayerUpdateSchema.parse(update);
  state.mapState.layers = state.mapState.layers.map((layer) =>
    layer.id === parsed.layerId ? { ...layer, ...parsed.changes } : layer
  );
  state.mapState.updatedAt = now();
}

export async function getCharacters(): Promise<Character[]> {
  return state.characters;
}

export async function updateCharacter(update: CharacterUpdateInput) {
  const index = state.characters.findIndex((character) => character.id === update.id);
  if (index === -1) {
    return;
  }
  state.characters[index] = {
    ...state.characters[index],
    ...update,
    updatedAt: now(),
  };
}

export async function authenticateUser(): Promise<{ userId: string }> {
  return { userId: "00000000-0000-0000-0000-000000000001" };
}

export async function issueRealtimeToken(sessionId: string) {
  return {
    token: Buffer.from(`${sessionId}:${Date.now()}`).toString("base64"),
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
  };
}
