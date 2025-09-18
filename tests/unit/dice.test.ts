import { describe, expect, it } from "vitest";
import { rollDice } from "@helios/dice-engine";

describe("rollDice", () => {
  it("returns consistent structure", () => {
    const result = rollDice({
      sessionId: "00000000-0000-0000-0000-000000000000",
      userId: "00000000-0000-0000-0000-000000000001",
      pool: { attribute: 1, skill: 1, bonus: 0, stress: 0, special: 0 },
      advantage: false,
    });

    expect(result.results).toHaveLength(2);
    expect(result.results[0].value).toBeGreaterThanOrEqual(1);
    expect(result.results[0].value).toBeLessThanOrEqual(6);
  });
});
