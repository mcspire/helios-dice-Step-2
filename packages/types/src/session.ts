import { z } from "zod";
import { roleSchema, userSchema } from "./user";

export const moduleIdSchema = z.enum(["dice", "map", "characters"]);

export const sessionStatusSchema = z.enum([
  "ACTIVE",
  "SCHEDULED",
  "ARCHIVED",
]);

export const sessionSchema = z.object({
  id: z.string().uuid(),
  ownerId: z.string().uuid(),
  name: z.string().min(3),
  description: z.string().optional(),
  status: sessionStatusSchema,
  modulesEnabled: z.array(moduleIdSchema),
  createdAt: z.date(),
  archivedAt: z.date().nullable(),
});

export const participantSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  user: userSchema.optional(),
  role: roleSchema,
  joinedAt: z.date(),
  lastSeenAt: z.date().nullable(),
});

export type Session = z.infer<typeof sessionSchema>;
export type Participant = z.infer<typeof participantSchema>;
export type ModuleId = z.infer<typeof moduleIdSchema>;
export type SessionStatus = z.infer<typeof sessionStatusSchema>;
