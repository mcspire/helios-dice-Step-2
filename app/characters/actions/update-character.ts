"use server";

import { revalidatePath } from "next/cache";
import type { CharacterUpdateInput } from "@helios/types/character";
import { updateCharacter } from "@helios/utils/server";

export async function updateCharacterAction(update: CharacterUpdateInput) {
  await updateCharacter(update);
  revalidatePath("/characters");
}
