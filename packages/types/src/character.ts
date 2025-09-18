import { z } from "zod";

export const attributeSchema = z.object({
  name: z.string(),
  value: z.number().min(0).max(10),
});

export const inventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  quantity: z.number().min(0).max(99),
});

export const characterSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(2),
  role: z.enum(["PLAYER", "NPC", "ALLY", "ENEMY"]),
  attributes: z.array(attributeSchema),
  inventory: z.array(inventoryItemSchema),
  status: z.enum(["healthy", "injured", "critical", "dead"]),
  updatedAt: z.date(),
});

export const characterUpdateInputSchema = characterSchema.pick({
  id: true,
  sessionId: true,
}).extend({
  attributes: z.array(attributeSchema).optional(),
  inventory: z.array(inventoryItemSchema).optional(),
  status: z.enum(["healthy", "injured", "critical", "dead"]).optional(),
});

export type Character = z.infer<typeof characterSchema>;
export type CharacterUpdateInput = z.infer<typeof characterUpdateInputSchema>;
