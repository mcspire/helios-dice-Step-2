import { DiceCanvas } from "@helios/ui/dice-canvas";
import { GmRollLog } from "@helios/ui/gm-roll-log";

export default function DiceGmPage() {
  return (
    <div className="grid flex-1 grid-cols-1 lg:grid-cols-[2fr_3fr]">
      <GmRollLog />
      <DiceCanvas role="gm" />
    </div>
  );
}
