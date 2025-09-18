import { z } from "zod";

export const mapLayerSchema = z.object({
  id: z.string(),
  name: z.string(),
  visible: z.boolean(),
  opacity: z.number().min(0).max(1).default(1),
});

export const tokenSchema = z.object({
  id: z.string(),
  label: z.string(),
  x: z.number(),
  y: z.number(),
  layerId: z.string(),
});

export const mapStateSchema = z.object({
  sessionId: z.string().uuid(),
  backgroundUrl: z.string().url().nullable(),
  layers: z.array(mapLayerSchema),
  tokens: z.array(tokenSchema),
  fogOfWar: z.array(z.tuple([z.number(), z.number(), z.number()])).optional(),
  updatedAt: z.date(),
});

export const mapLayerUpdateSchema = z.object({
  sessionId: z.string().uuid(),
  layerId: z.string(),
  changes: mapLayerSchema.partial(),
});

export type MapState = z.infer<typeof mapStateSchema>;
export type MapLayerUpdate = z.infer<typeof mapLayerUpdateSchema>;
