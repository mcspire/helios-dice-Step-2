"use server";

import { revalidatePath } from "next/cache";
import { rollDice } from "@helios/dice-engine/roller";
import { publishRealtimeEvent, saveRollResult } from "@helios/utils/server";
import type { DiceRollInput } from "@helios/types/dice";

export async function submitRollAction(input: DiceRollInput) {
  const result = rollDice(input);
  await saveRollResult(result);
  await publishRealtimeEvent(result.sessionId, { type: "rollResult", payload: result });
  revalidatePath("/dice");
  return result;
}
