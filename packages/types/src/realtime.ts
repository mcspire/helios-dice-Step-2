import { z } from "zod";
import { diceRollInputSchema, rollOutcomeSchema } from "./dice";
import { mapLayerUpdateSchema, mapStateSchema } from "./map";
import { characterUpdateInputSchema, characterSchema } from "./character";

export const realtimeEventSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("sessionState"), payload: z.any() }),
  z.object({ type: z.literal("rollInitiate"), payload: diceRollInputSchema }),
  z.object({ type: z.literal("rollResult"), payload: rollOutcomeSchema }),
  z.object({ type: z.literal("rollClear"), payload: z.object({ sessionId: z.string().uuid() }) }),
  z.object({ type: z.literal("nameUpdate"), payload: z.object({ userId: z.string().uuid(), displayName: z.string() }) }),
  z.object({ type: z.literal("mapUpdate"), payload: mapLayerUpdateSchema }),
  z.object({ type: z.literal("mapSync"), payload: mapStateSchema }),
  z.object({ type: z.literal("characterUpdate"), payload: characterUpdateInputSchema }),
  z.object({ type: z.literal("characterSync"), payload: z.array(characterSchema) }),
  z.object({ type: z.literal("chatMessage"), payload: z.object({ messageId: z.string().uuid(), content: z.string() }) }),
  z.object({ type: z.literal("moduleSwitch"), payload: z.object({ module: z.string(), sessionId: z.string().uuid() }) }),
  z.object({ type: z.literal("heartbeat"), payload: z.object({ ts: z.number() }) }),
]);

export type RealtimeEvent = z.infer<typeof realtimeEventSchema>;
