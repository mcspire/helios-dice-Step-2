"use server";

import { revalidatePath } from "next/cache";
import type { MapLayerUpdate } from "@helios/types/map";
import { updateMapLayer } from "@helios/utils/server";

export async function updateLayerAction(update: MapLayerUpdate) {
  await updateMapLayer(update);
  revalidatePath("/map");
}
