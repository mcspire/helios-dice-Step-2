"use server";

import { revalidatePath } from "next/cache";
import { rollDice } from "@helios/dice-engine/roller";
import { saveRollResult } from "@helios/utils/server";
import type { DiceRollInput } from "@helios/types/dice";

export async function submitRollAction(input: DiceRollInput) {
  const result = rollDice(input);
  await saveRollResult(result);
  revalidatePath("/dice");
  return result;
}
