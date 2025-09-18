import { z } from "zod";

export const dieSchema = z.object({
  sides: z.literal(6),
  label: z.string(),
  type: z.enum(["attribute", "skill", "bonus", "stress", "special"]),
});

export const dicePoolSchema = z.object({
  attribute: z.number().min(0).max(6),
  skill: z.number().min(0).max(6),
  bonus: z.number().min(0).max(6),
  stress: z.number().min(0).max(10),
  special: z.number().min(0).max(3),
});

export const diceRollInputSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  pool: dicePoolSchema,
  advantage: z.boolean().default(false),
  comment: z.string().max(120).optional(),
});

export const rollOutcomeSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  results: z.array(
    z.object({
      die: dieSchema,
      value: z.number().min(1).max(6),
    })
  ),
  successes: z.number().min(0),
  crit: z.boolean(),
  panic: z.boolean(),
  createdAt: z.date(),
});

export type DicePool = z.infer<typeof dicePoolSchema>;
export type DiceRollInput = z.infer<typeof diceRollInputSchema>;
export type RollOutcome = z.infer<typeof rollOutcomeSchema>;
