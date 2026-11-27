/**
 * Golden tests for v2 (final GDi Partners submission). Every expected value is read from
 * context_v2/golden_v2.json and asserted against the engine. Never edit the expected values.
 */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import data from "@/data/case-data.json";
import hybridPlan from "@/data/hybrid-plan.json";
import {
  DEFAULT_LEVERS,
  DEMAND_PRESETS,
  aboveMarketAtZeroMarkup,
  acTransfer,
  boxAsOnlineOrders,
  buildPlan,
  bulkDemandCheck,
  evaluateBlanketGated,
  evaluateHybrid,
  evaluateScenario,
  exposureBySeverity,
  inclusionVolumeTest,
  lowestParticipation,
  priceBox,
  relinkSaving,
  sellingPrice,
  shgsBelowParticipation,
  socialAnalysis,
  workingCapitalHybrid,
  type CaseData,
} from "@/lib/engine";

const G = JSON.parse(readFileSync("context_v2/golden_v2.json", "utf8"));
const D = data as CaseData;
const L = DEFAULT_LEVERS;
const shg = (id: string) => D.shgs.find((s) => s.id === id)!;
const near = (a: number, b: number, tol: number) => expect(Math.abs(a - b)).toBeLessThanOrEqual(tol);
const S0 = evaluateScenario("S0", D, L);
const S1 = evaluateScenario("S1", D, L);

describe("v2: today (S0) exposure, split by severity", () => {
  const e = exposureBySeverity(S0.rows, 0.05);
  it("counts and totals", () => {
    expect(S0.summary.competitiveCount).toBe(G.today.competitive);
    near(e.markup.total, G.today.markup_at_risk, 0.5);
    near(S0.summary.acMarkupTotal, G.today.markup_total, 0.5);
    near(e.income.total, G.today.income_at_risk, 0.5);
    expect(e.women).toBe(G.today.women_in_uncompetitive_shgs);
  });
  it("markup and income at risk split >5% vs 0–5% above market", () => {
    near(e.markup.far, G.today.markup_at_risk_gt5pct, 0.5);
    near(e.markup.near, G.today.markup_at_risk_0to5pct, 0.5);
    near(e.income.far, G.today.income_at_risk_gt5pct, 0.5);
    near(e.income.near, G.today.income_at_risk_0to5pct, 0.5);
  });
  it("all uncompetitive products are online; all bulk products compete", () => {
    expect(S0.rows.filter((r) => !r.competitive).every((r) => r.channel === "Online")).toBe(G.today.all_uncompetitive_sold_online);
    expect(S0.rows.filter((r) => r.channel === "Bulk" && r.competitive).length).toBe(G.today.bulk_products_competitive);
  });
});

describe("v2: re-link floor (S1)", () => {
  const sv = relinkSaving(D, L);
  it("re-links, saving and phasing", () => {
    expect(sv.moves.map((m) => m.shgId)).toEqual(G.relink_floor.shgs_relinked);
    near(sv.total, G.relink_floor.inbound_saving, 0.5);
    for (const [id, v] of Object.entries(G.relink_floor.saving_by_shg)) near(sv.moves.find((m) => m.shgId === id)!.saving, v as number, 0.5);
    const p = sv.moves.filter((m) => m.shgId === "SHG-16" || m.shgId === "SHG-17");
    near(p.reduce((t, m) => t + m.saving, 0), G.relink_floor.shg16_17_saving, 0.5);
    near(p.reduce((t, m) => t + m.saving, 0) / sv.total, G.relink_floor.shg16_17_share, 0.0005);
    near(p.reduce((t, m) => t + m.kg, 0), G.relink_floor.shg16_17_kg, 0.5);
  });
  it("floor = 15 competitive; what is still at risk", () => {
    expect(S1.summary.competitiveCount).toBe(G.relink_floor.competitive);
    near(S1.summary.acMarkupAtRisk, G.relink_floor.markup_at_risk, 0.5);
    near(S1.summary.shgIncomeAtRisk, G.relink_floor.income_at_risk, 0.5);
    expect(S1.summary.womenActiveAtRisk).toBe(G.relink_floor.women_at_risk);
    const names = S1.summary.uncompetitive.map((i) => shg(i).product);
    for (const n of G.relink_floor.still_uncompetitive as string[]) expect(names.some((p) => p.toLowerCase().startsWith(n.toLowerCase().split(" ")[0]!))).toBe(true);
    expect(names).toHaveLength(G.relink_floor.still_uncompetitive.length);
  });
  it("three products stay above market even at zero markup; courier share of SHG price", () => {
    const z = aboveMarketAtZeroMarkup(S1.rows);
    const byName = (n: string) => z.find((x) => x.product.toLowerCase().startsWith(n.toLowerCase().split(" ")[0]!))!;
    expect(z).toHaveLength(Object.keys(G.relink_floor.above_market_even_at_zero_markup).length);
    for (const [n, [sp, mkt]] of Object.entries(G.relink_floor.above_market_even_at_zero_markup as Record<string, [number, number]>)) {
      near(byName(n).spAtZeroMarkup, sp, 0.005);
      near(byName(n).market, mkt, 0.005);
    }
    for (const [n, v] of Object.entries(G.relink_floor.courier_share_of_shg_price as Record<string, number>)) near(byName(n).courierShareOfShgPrice, v, 0.0005);
  });
  it("SHG-19 (Jhansi) stays: same ₹30 band at both ACs", () => {
    expect(S1.plan["SHG-19"]!.ac).toBe("Bijnor");
  });
});

describe("v2: AC impact after re-linking", () => {
  const t = acTransfer(S0.summary, S1.summary);
  const A = G.ac_impact_after_relink;
  const ac = (n: "Bijnor" | "Lucknow") => t.byAc.find((x) => x.ac === n)!;
  it("markup, units and kg before → after; ₹74,100 moves", () => {
    near(t.markupMoved, A.markup_moved, 0.5);
    expect([ac("Bijnor").markupBefore, ac("Bijnor").markupAfter]).toEqual(A.bijnor_markup);
    expect([ac("Lucknow").markupBefore, ac("Lucknow").markupAfter]).toEqual(A.lucknow_markup);
    expect([ac("Bijnor").unitsBefore, ac("Bijnor").unitsAfter]).toEqual(A.bijnor_units);
    expect([ac("Lucknow").unitsBefore, ac("Lucknow").unitsAfter]).toEqual(A.lucknow_units);
    expect([ac("Bijnor").kgBefore, ac("Bijnor").kgAfter]).toEqual(A.bijnor_kg);
    expect([ac("Lucknow").kgBefore, ac("Lucknow").kgAfter]).toEqual(A.lucknow_kg);
  });
  it("markup per unit and the units-per-₹1-lakh yardstick (rounded)", () => {
    near(ac("Bijnor").markupPerUnitAfter, A.markup_per_unit_after.Bijnor, 0.005);
    near(ac("Lucknow").markupPerUnitAfter, A.markup_per_unit_after.Lucknow, 0.005);
    expect(Math.round(ac("Bijnor").unitsPerLakhFixedCost)).toBe(A.units_per_1_lakh_fixed_cost.Bijnor);
    expect(Math.round(ac("Lucknow").unitsPerLakhFixedCost)).toBe(A.units_per_1_lakh_fixed_cost.Lucknow);
  });
  it("percentage changes", () => {
    near(ac("Lucknow").unitsAfter / ac("Lucknow").unitsBefore - 1, A.lucknow_units_change, 0.0005);
    near(ac("Lucknow").kgAfter / ac("Lucknow").kgBefore - 1, A.lucknow_kg_change, 0.0005);
    near(ac("Bijnor").markupAfter / ac("Bijnor").markupBefore - 1, A.bijnor_markup_change, 0.0005);
  });
});

describe("v2: channels, multi-packs and bulk volume", () => {
  const C = G.channels;
  const sh = buildPlan("SH", D, L);
  const s3 = buildPlan("S3", D, L);
  it("hybrid config matches golden_v2 hybrid_channels", () => {
    expect(hybridPlan.packs).toEqual({ "SHG-01": 3, "SHG-05": 4 });
    expect(C.hybrid_channels["SHG-01"]).toContain("x3");
    expect(C.hybrid_channels["SHG-05"]).toContain("x4");
    for (const id of hybridPlan.needsBuyer) expect(C.hybrid_channels[id]).toBe("bulk after buyer commits");
    for (const id of ["SHG-04", "SHG-10", "SHG-18"]) expect(sh[id]!.channel).toBe("Bulk");
  });
  it("online and bulk units today", () => {
    expect(D.shgs.filter((s) => s.channel === "Online").reduce((t, s) => t + s.units, 0)).toBe(C.online_units_today);
    expect(D.shgs.filter((s) => s.channel === "Bulk").reduce((t, s) => t + s.units, 0)).toBe(C.bulk_units_today);
  });
  it("blanket bulk 2,250 vs hybrid 1,050 units, shares and per store", () => {
    const blanket = bulkDemandCheck(D.shgs, s3, new Map()).reduce((t, b) => t + b.unitsNeeded, 0);
    const hybrid = bulkDemandCheck(D.shgs, sh, new Map()).reduce((t, b) => t + b.unitsNeeded, 0);
    expect(blanket).toBe(C.blanket_bulk_new_units);
    expect(hybrid).toBe(C.hybrid_new_bulk_units);
    near(blanket / C.online_units_today, C.blanket_bulk_share_of_online, 0.0005);
    near(hybrid / C.online_units_today, C.hybrid_share_of_online, 0.0005);
    expect(L.prernaStores).toBe(C.prerna_saras_stores);
    near(blanket / L.prernaStores, C.blanket_bulk_per_store, 0.05);
    near(hybrid / L.prernaStores, C.hybrid_per_store, 0.05);
  });
  it("multi-pack prices per unit (and at +10% freight)", () => {
    const at = (id: string, n: number, m: number) =>
      sellingPrice(shg(id), sh[id]!.ac, "Online", D.rateCard, { unitsPerParcel: n, inMult: m, outMult: m }).sp;
    near(at("SHG-01", 3, 1), C.jaggery_3pack_sp, 0.005);
    near(at("SHG-01", 3, 1.1), C.jaggery_3pack_sp_freight_plus10, 0.005);
    near(at("SHG-05", 4, 1), C.garam_masala_4pack_sp, 0.005);
    near(at("SHG-05", 4, 1.1), C.garam_masala_4pack_sp_freight_plus10, 0.006);
    expect(shg("SHG-01").market).toBe(C.jaggery_market);
    expect(shg("SHG-05").market).toBe(C.garam_masala_market);
  });
  it("reseller margin at market for institutional bulk", () => {
    const room = (id: string) => {
      const p = sellingPrice(shg(id), sh[id]!.ac, "Bulk", D.rateCard).sp;
      return (shg(id).market - p) / shg(id).market;
    };
    near(room("SHG-16"), C.reseller_margin_at_market["Multigrain atta"], 0.0005);
    near(room("SHG-06"), C.reseller_margin_at_market["Detergent"], 0.0005);
    near(room("SHG-09"), C.reseller_margin_at_market["Mustard oil"], 0.0005);
  });
});

describe("v2: hybrid demand scenarios (commitment gate)", () => {
  for (const preset of DEMAND_PRESETS) {
    const exp = G.demand_scenarios_hybrid[preset.id];
    it(`${preset.label}`, () => {
      expect(preset.packAcceptance).toBe(exp.pack_acceptance);
      expect(preset.bulkSecured).toBe(exp.bulk_secured);
      const r = evaluateHybrid(D, { ...L, packAcceptance: preset.packAcceptance, bulkSecured: preset.bulkSecured });
      expect(r.summary.competitiveCount).toBe(exp.competitive);
      near(r.summary.acMarkupSecure, exp.markup_secured, 0.5);
      near(r.summary.shgIncomeAtRisk, exp.income_at_risk, 0.5);
      near(r.incomeLostPacks, exp.income_lost_packs_declined, 0.5);
      expect(r.summary.womenActiveAtRisk).toBe(exp.women_exposed);
    });
  }
  it("defaults are the 'No bulk buyer yet' preset", () => {
    const r = evaluateHybrid(D, L);
    expect(r.summary.competitiveCount).toBe(G.demand_scenarios_hybrid.no_bulk_buyer_yet.competitive);
  });
  it("confirmed orders (LoI or later) raise bulk secured automatically", () => {
    const r = evaluateHybrid(D, L, {}, new Map([["SHG-06", 400], ["SHG-09", 500], ["SHG-16", 150]]));
    expect(r.demand.bulkSecured).toBe(1);
  });
  it("blanket bulk with the same gate at 0/25/50/75/100% secured", () => {
    const B = G.demand_scenarios_blanket_bulk;
    (B.bulk_secured as number[]).forEach((c, i) => {
      const r = evaluateBlanketGated(D, L, c);
      expect(r.summary.competitiveCount).toBe(B.competitive[i]);
      near(r.summary.acMarkupSecure, B.markup_secured[i], 0.5);
      near(r.summary.shgIncomeAtRisk, B.income_at_risk[i], 0.5);
    });
  });
  it("S3 (all staples to bulk) values are unchanged", () => {
    expect(evaluateScenario("S3", D, L).summary.competitiveCount).toBe(20);
  });
});

describe("v2: working capital (hybrid, full commitment)", () => {
  const W = G.working_capital_hybrid;
  const w = workingCapitalHybrid(D, L);
  it("payouts, logistics, bulk share and 30/60/90-day need", () => {
    near(w.payouts, W.shg_payouts, 0.5);
    near(w.logistics, W.logistics, 0.5);
    near(w.bulkShare, W.bulk_share_of_value_shg_price_basis, 0.0005);
    [30, 60, 90].forEach((d, i) => {
      near(w.wc(d, W.online_payment_days), W.wc_30_60_90_days[i], 0.5);
      near(w.wc(d, W.online_payment_days) / 1e5, W.display_lakh[i], 0.05);
    });
  });
  it("pilot institutional payout (SHG price × units of the needs-buyer products)", () => {
    const pay = hybridPlan.needsBuyer.reduce((t, id) => t + shg(id).shgPrice * shg(id).units, 0);
    near(pay, W.pilot_institutional_payout, 0.5);
  });
});

describe("v2: gift box 2 (Bijnor)", () => {
  const B = G.gift_box_2_bijnor;
  const sh = buildPlan("SH", D, L);
  const items = ["SHG-02", "SHG-03", "SHG-07"].map((shgId) => ({ shgId, qty: 1 }));
  const b = priceBox(D, items, sh, { ...L, boxesPerOrder: B.order_size_default });
  it("truck price, build, online alternative, market, margins", () => {
    if (!b.ok) throw new Error(b.message);
    near(b.kg, B.kg, 1e-9);
    near(b.spBulk, B.sp_truck, 0.5);
    near(b.lines.reduce((t, l) => t + l.shgPrice, 0), B.build.shg_price, 0.5);
    near(b.lines.reduce((t, l) => t + l.inbound, 0), B.build.inbound, 0.5);
    near(b.acMarkupPerBox, B.build.markup, 0.5);
    expect(b.packaging).toBe(B.build.packaging);
    near(b.deliveryBulk, B.build.truck, 0.5);
    near(boxAsOnlineOrders(D, items, sh, L), B.as_three_online_orders, 0.5);
    expect(b.sumMarket).toBe(B.market);
    near(b.headroomBulk, B.below_market, 0.005);
    near(b.shgIncomePerBox, B.shg_profit_per_box, 0.5);
    near(b.acMarkupPerBox, B.ac_markup_per_box, 0.5);
    near(b.monthsOfOutput, 1, 1e-9); // 100 boxes = 1 month of brass diya and zari output
  });
});

describe("v2: social", () => {
  const S = G.social;
  const { summary: s } = socialAnalysis(D, L);
  it("members, earning, distribution", () => {
    expect(s.members).toBe(S.members);
    expect(s.earners).toBe(S.earning);
    expect(s.notEarning).toBe(S.not_earning);
    near(s.participation, S.earning_share, 0.0005);
    expect(s.medianIncomeEarner).toBe(S.median_income_per_earner);
    near(s.topQuintileShare, S.top20_share, 0.0005);
    near(s.giniEarners, S.gini_earners, 0.0005);
    near(s.giniAllMembers, S.gini_all_members, 0.0005);
    near(s.correlationParticipationIncome, S.corr_participation_vs_income, 0.005);
    near(s.byGroup.find((g) => g.group === "Craft & textile")!.participation, S.craft_share_earning, 0.0005);
    near(s.byGroup.find((g) => g.group === "Food & other")!.participation, S.other_share_earning, 0.0005);
  });
  it("80% aspiration: SHGs below, extra earners and units", () => {
    expect(shgsBelowParticipation(D, L.participationTarget)).toBe(S.shgs_below_80pct);
    const v = inclusionVolumeTest(D, L);
    expect(v.reduce((t, r) => t + r.newWomen, 0)).toBe(S.additional_earners_for_80pct);
    near(v.reduce((t, r) => t + r.extraUnits, 0), S.additional_units_for_80pct, 0.5);
    near(v.reduce((t, r) => t + r.extraUnits, 0) / v.reduce((t, r) => t + r.unitsNow, 0), S.additional_units_pct, 0.0005);
  });
  it("ten lowest-participation SHGs", () => {
    const low = lowestParticipation(D, 10);
    expect(low.map((x) => x.shgId)).toEqual((S.lowest_participation as unknown[][]).map((x) => x[1]));
    (S.lowest_participation as [string, string, number, number, number][]).forEach(([, id, act, mem, inc], i) => {
      expect(low[i]!.shgId).toBe(id);
      expect([low[i]!.active, low[i]!.members]).toEqual([act, mem]);
      near(low[i]!.incomePerEarner, inc, 0.5);
    });
  });
  it("pilot scope: 11 SHGs, 118 members, 71 earning", () => {
    const P = G.pilot;
    expect(hybridPlan.pilotShgs).toEqual(P.shgs);
    expect(P.shgs.reduce((t: number, id: string) => t + shg(id).members, 0)).toBe(P.members);
    expect(P.shgs.reduce((t: number, id: string) => t + shg(id).active, 0)).toBe(P.earning);
  });
});
