import { describe, expect, it } from "vitest";
import seeded from "@/data/case-data.json";
import { DATASET_SHA256, DATASET_PATH, readCaseData, sha256 } from "../scripts/case-reader";

describe("Seed: case dataset loaded without changes", () => {
  it("the case dataset file is unmodified", () => {
    expect(sha256(DATASET_PATH)).toBe(DATASET_SHA256);
  });
  it("seeded data equals a fresh read of the workbook (seed is idempotent)", async () => {
    const fresh = await readCaseData();
    expect(JSON.parse(JSON.stringify(fresh))).toEqual(seeded);
  });
  it("counts: 20 SHGs, 213 members, 127 earning, 2 ACs, 13 districts, 20 attribute rows", () => {
    expect(seeded.shgs).toHaveLength(20);
    expect(seeded.shgs.reduce((a, s) => a + s.members, 0)).toBe(213);
    expect(seeded.shgs.reduce((a, s) => a + s.active, 0)).toBe(127);
    expect(new Set(seeded.shgs.map((s) => s.linkedAc)).size).toBe(2);
    expect(new Set(seeded.shgs.map((s) => s.district)).size).toBe(13);
    expect(seeded.attributes).toHaveLength(20);
  });
  it("rate card v1 matches the case", () => {
    const c = seeded.rateCard;
    expect(c.bands.map((b) => b.ratePerKg)).toEqual([10, 20, 30, 40]);
    expect([c.onlineFirstKg, c.onlineExtraKg, c.bulkPerKg, c.markup]).toEqual([50, 25, 10, 0.15]);
  });
  it("no personal-identifier fields in the data store", () => {
    const keys = new Set<string>();
    const walk = (v: unknown) => {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object")
        for (const [k, x] of Object.entries(v)) {
          keys.add(k.toLowerCase());
          walk(x);
        }
    };
    walk(seeded);
    for (const k of keys) expect(k).not.toMatch(/name|phone|mobile|aadhaar|bank|email|address/);
  });
  it("analyst attributes include ODOP/GI links", () => {
    expect(seeded.attributes.find((a) => a.shgId === "SHG-01")?.odopGi).toBe("PMFME-ODOP (Bijnor: jaggery)");
    expect(seeded.attributes.filter((a) => a.odopGi && a.odopGi !== "-")).toHaveLength(9);
  });
});
