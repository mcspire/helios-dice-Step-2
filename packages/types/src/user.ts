import { z } from "zod";

export const roleSchema = z.enum(["PLAYER", "GM", "ADMIN"]);

export const userSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  displayName: z.string().min(2),
  avatarUrl: z.string().url().optional(),
  theme: z.string().default("dark"),
  roles: z.array(roleSchema).default(["PLAYER"]),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof roleSchema>;
export type User = z.infer<typeof userSchema>;
