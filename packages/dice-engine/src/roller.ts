import { randomInt } from "crypto";
import { randomUUID } from "crypto";
import type { DiceRollInput, RollOutcome } from "@helios/types";

function rollDie(): number {
  return randomInt(1, 7);
}

export function rollDice(input: DiceRollInput): RollOutcome {
  const results = [
    ...Array.from({ length: input.pool.attribute }, () => ({ type: "attribute" as const })),
    ...Array.from({ length: input.pool.skill }, () => ({ type: "skill" as const })),
    ...Array.from({ length: input.pool.bonus }, () => ({ type: "bonus" as const })),
    ...Array.from({ length: input.pool.stress }, () => ({ type: "stress" as const })),
    ...Array.from({ length: input.pool.special }, () => ({ type: "special" as const })),
  ].map((die, index) => ({
    die: {
      sides: 6,
      label: `${die.type}-${index + 1}`,
      type: die.type,
    },
    value: rollDie(),
  }));

  const successes = results.filter((result) => result.value === 6).length;
  const panic = results.some((result) => result.die.type === "stress" && result.value === 1);
  const crit = successes >= 2;

  return {
    id: randomUUID(),
    sessionId: input.sessionId,
    userId: input.userId,
    results,
    successes,
    crit,
    panic,
    createdAt: new Date(),
  };
}
