import { describe, expect, it } from "vitest";
import data from "@/data/case-data.json";
import { runParity } from "@/lib/parity";
import type { CaseData } from "@/lib/engine";

describe("Parity with the Python reference model", () => {
  it("01 baseline, 02 scenario summary and 13 box economics match exactly", () => {
    const { checked, mismatches } = runParity(data as CaseData);
    expect(mismatches).toEqual([]);
    expect(checked).toBeGreaterThan(1400);
  });
});
