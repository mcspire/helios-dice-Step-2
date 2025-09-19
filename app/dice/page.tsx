import { redirect } from "next/navigation";
import { DiceCanvas } from "@helios/ui/dice-canvas";
import { DiceRollPanel } from "@helios/ui/dice-roll-panel";
import { getDicePresets, UnauthorizedError } from "@helios/utils/server";
import { submitRollAction } from "./actions/submit-roll";

export default async function DicePlayerPage() {
  try {
    const presets = await getDicePresets();

    return (
      <div className="grid flex-1 grid-cols-1 lg:grid-cols-[3fr_2fr]">
        <DiceCanvas role="player" />
        <DiceRollPanel role="player" presets={presets} onRoll={submitRollAction} />
      </div>
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      redirect("/login");
    }
    throw error;
  }
}
