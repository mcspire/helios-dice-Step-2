"use server";

import { revalidatePath } from "next/cache";
import { clearRolls } from "@helios/utils/server";

export async function clearRollsAction(sessionId: string) {
  await clearRolls(sessionId);
  revalidatePath(`/sessions/${sessionId}`);
}
