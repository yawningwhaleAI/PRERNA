/** Golden tests from BUILD_PLAN.md (M2). Expected values come from the case and the reference model. Never edit them. */
import { describe, expect, it } from "vitest";
import data from "@/data/case-data.json";
import {
  DEFAULT_LEVERS,
  allocateAll,
  buildPlan,
  bulkDemandCheck,
  evaluateScenario,
  headroomSharing,
  inclusionVolumeTest,
  outboundCost,
  passthroughGrid,
  priceBox,
  sellingPrice,
  socialAnalysis,
  stressTests,
  type CaseData,
} from "@/lib/engine";

const D = data as CaseData;
const L = DEFAULT_LEVERS;
const shg = (id: string) => D.shgs.find((s) => s.id === id)!;
const card = D.rateCard;

describe("Case pricing rules", () => {
  it("honey SHG-02 from Bijnor online = ₹285, AC earns ₹30", () => {
    const p = sellingPrice(shg("SHG-02"), "Bijnor", "Online", card);
    expect(p.sp).toBe(285);
    expect(p.markup).toBe(30);
    expect([p.shgPrice, p.inbound, p.markup, p.outbound]).toEqual([200, 5, 30, 50]);
  });
  it("atta SHG-16: Bijnor online ₹626, Lucknow bulk ₹426", () => {
    expect(sellingPrice(shg("SHG-16"), "Bijnor", "Online", card).sp).toBe(626);
    expect(sellingPrice(shg("SHG-16"), "Lucknow", "Bulk", card).sp).toBe(426);
  });
  it("online outbound 2 kg ₹75, 5 kg ₹150; bulk 0.5 kg ₹5", () => {
    expect(outboundCost(2, "Online", card)).toBe(75);
    expect(outboundCost(5, "Online", card)).toBe(150);
    expect(outboundCost(0.5, "Bulk", card)).toBe(5);
  });
});

describe("Scenarios at default levers", () => {
  const r = Object.fromEntries((["S0", "S1", "S2", "S3"] as const).map((id) => [id, evaluateScenario(id, D, L)]));
  it("competitive products S0/S1/S2/S3 = 10/15/19/20", () => {
    expect([r.S0!, r.S1!, r.S2!, r.S3!].map((x) => x.summary.competitiveCount)).toEqual([10, 15, 19, 20]);
  });
  it("S0 AC markup ₹2,19,300; at risk ₹93,600", () => {
    expect(r.S0!.summary.acMarkupTotal).toBeCloseTo(219300, 6);
    expect(r.S0!.summary.acMarkupAtRisk).toBeCloseTo(93600, 6);
  });
  it("S0 SHG income at risk ₹75,400; 69 earning women at risk", () => {
    expect(r.S0!.summary.shgIncomeAtRisk).toBeCloseTo(75400, 6);
    expect(r.S0!.summary.womenActiveAtRisk).toBe(69);
  });
  it("logistics outlay S0/S1/S2/S3 = 401,900 / 359,500 / 248,800 / 251,000", () => {
    const v = [r.S0!, r.S1!, r.S2!, r.S3!].map((x) => x.summary.logisticsOutlay);
    [401900, 359500, 248800, 251000].forEach((e, i) => expect(v[i]).toBeCloseTo(e, 6));
  });
  it("S3 secure markup Bijnor ₹83,400 / Lucknow ₹1,35,900", () => {
    expect(r.S3!.summary.byAc.Bijnor.markupSecure).toBeCloseTo(83400, 6);
    expect(r.S3!.summary.byAc.Lucknow.markupSecure).toBeCloseTo(135900, 6);
  });
  it("S0 secure markup Bijnor ₹75,900 / Lucknow ₹49,800", () => {
    expect(r.S0!.summary.byAc.Bijnor.markupSecure).toBeCloseTo(75900, 6);
    expect(r.S0!.summary.byAc.Lucknow.markupSecure).toBeCloseTo(49800, 6);
  });
  it("re-links 7 SHGs (SHG-11…17), inbound saving ₹42,400", () => {
    const a = allocateAll(D.shgs, card);
    expect(a.filter((x) => x.relink).map((x) => x.shgId)).toEqual(["SHG-11", "SHG-12", "SHG-13", "SHG-14", "SHG-15", "SHG-16", "SHG-17"]);
    expect(a.reduce((s, x) => s + x.savingPerMonth, 0)).toBeCloseTo(42400, 6);
  });
  it("S3 stress: logistics rates +10% → 17 competitive, +20% → 15", () => {
    const st = stressTests(D, r.S3!.plan, L);
    expect(st[0]!.summary.competitiveCount).toBe(17);
    expect(st[1]!.summary.competitiveCount).toBe(15);
    expect(st[2]!.summary.acMarkupTotal).toBeCloseTo(175440, 6);
  });
});

describe("Social impact", () => {
  const { summary } = socialAnalysis(D, L);
  it("213 members, 127 earners, median ₹1,050 per earner", () => {
    expect(summary.members).toBe(213);
    expect(summary.earners).toBe(127);
    expect(summary.medianIncomeEarner).toBe(1050);
  });
  it("Gini earners 0.4239, all members 0.6565, top-20% share 0.4885 (±0.0005)", () => {
    expect(Math.abs(summary.giniEarners - 0.4239)).toBeLessThanOrEqual(0.0005);
    expect(Math.abs(summary.giniAllMembers - 0.6565)).toBeLessThanOrEqual(0.0005);
    expect(Math.abs(summary.topQuintileShare - 0.4885)).toBeLessThanOrEqual(0.0005);
  });
  it("extra units for 80% participation = 1,679 (±1)", () => {
    const extra = inclusionVolumeTest(D, L).reduce((a, r) => a + r.extraUnits, 0);
    expect(Math.abs(extra - 1679)).toBeLessThanOrEqual(1);
  });
});

describe("Corporate boxes and headroom-for-inclusion", () => {
  const s3 = buildPlan("S3", D, L);
  const box = (ids: string[]) => priceBox(D, ids.map((shgId) => ({ shgId, qty: 1 })), s3, L);
  it("Essentials box, packaging ₹40: bulk ₹596 / courier ₹671", () => {
    const b = box(["SHG-01", "SHG-02", "SHG-04", "SHG-05"]);
    if (!b.ok) throw new Error(b.message);
    expect(b.spBulk).toBeCloseTo(596, 6);
    expect(b.spCourier).toBeCloseTo(671, 6);
    expect(b.sumMarket).toBe(730);
  });
  it("Purvanchal box headroom bulk 8.6% / courier 3.4%", () => {
    const b = box(["SHG-14", "SHG-17", "SHG-20"]);
    if (!b.ok) throw new Error(b.message);
    expect(b.headroomBulk).toBeCloseTo(0.0861, 4);
    expect(b.headroomCourier).toBeCloseTo(0.034, 4);
  });
  it("mixed-AC box is rejected", () => {
    const b = box(["SHG-01", "SHG-08"]);
    expect(b.ok).toBe(false);
    if (!b.ok) expect(b.reason).toBe("mixed-ac");
  });
  it("headroom grid at 100% to profit, 100% volume kept = +₹29,696 (±1)", () => {
    const s3rows = evaluateScenario("S3", D, L).rows;
    const grid = passthroughGrid(headroomSharing(D, s3rows, L));
    const cell = grid.find((g) => g.share === 1 && g.kept === 1)!;
    expect(Math.abs(cell.netChange - 29696)).toBeLessThanOrEqual(1);
  });
});

describe("Band-edge lever", () => {
  it("edgeInclusive off → SHG-14 at Lucknow online is uncompetitive (₹655 vs ₹650)", () => {
    const sp = sellingPrice(shg("SHG-14"), "Lucknow", "Online", card, { edgeInclusive: false }).sp;
    expect(sp).toBe(655);
    expect(sp > shg("SHG-14").market).toBe(true);
    const s1 = evaluateScenario("S1", D, { ...L, edgeInclusive: false });
    expect(s1.summary.uncompetitive).toContain("SHG-14");
  });
});

describe("Bulk demand check (Excel Channel sheet: new bulk units per month)", () => {
  it("recommended plan moves 5 products to bulk = 2,250 units a month needing bulk buyers", () => {
    const rows = bulkDemandCheck(D.shgs, buildPlan("S3", D, L), new Map());
    expect(rows.map((r) => r.shgId)).toEqual(["SHG-01", "SHG-05", "SHG-06", "SHG-09", "SHG-16"]);
    expect(rows.reduce((t, r) => t + r.unitsNeeded, 0)).toBe(2250);
    expect(rows.every((r) => r.gap === r.unitsNeeded)).toBe(true);
  });
  it("confirmed orders reduce the gap", () => {
    const rows = bulkDemandCheck(D.shgs, buildPlan("S3", D, L), new Map([["SHG-16", 100]]));
    expect(rows.find((r) => r.shgId === "SHG-16")!.gap).toBe(50);
  });
});
