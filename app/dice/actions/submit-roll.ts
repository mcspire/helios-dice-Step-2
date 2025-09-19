"use server";

import { revalidatePath } from "next/cache";
import { rollDice } from "@helios/dice-engine/roller";
import {
  authenticateUser,
  publishRealtimeEvent,
  saveRollResult,
} from "@helios/utils/server";
import type { DiceRollInput } from "@helios/types/dice";

export async function submitRollAction(input: DiceRollInput) {
  const { userId } = await authenticateUser();
  const normalizedInput: DiceRollInput = {
    sessionId: input.sessionId,
    userId,
    pool: input.pool,
    advantage: input.advantage ?? false,
    comment: input.comment,
  };
  const result = rollDice(normalizedInput);
  await saveRollResult(result);
  await publishRealtimeEvent(result.sessionId, { type: "rollResult", payload: result });
  revalidatePath("/dice");
  return result;
}
