/**
 * Demand-backed hybrid (final GDi Partners submission) and the commitment gate.
 *
 * A bulk move counts only for volume with a committed buyer (LoI or later); unsecured volume stays online
 * at its online price (and is at risk if that is above market). Multi-pack decliners are lost volume.
 * A product counts as competitive only if ALL its sold volume is at or below market.
 */
import { buildPlan, runOptions, runScenario, summarise, DEFAULT_HYBRID, type ScenarioResult, type ScenarioRow, type ScenarioSummary } from "./scenarios";
import { allocateAll } from "./allocation";
import { sellingPrice } from "./pricing";
import type { AcName, CaseData, HybridConfig, Levers, Plan } from "./types";

const clamp01 = (x: number) => Math.min(1, Math.max(0, Number.isFinite(x) ? x : 0));

export interface DemandInputs {
  /** Share of multi-pack volume buyers accept. */
  packAcceptance: number;
  /** Share of gated bulk volume with a committed buyer. */
  bulkSecured: number;
}

export interface GatedResult extends ScenarioResult {
  /** Volume segments behind the summary (a product may have a secured and an unsecured segment). */
  segments: ScenarioRow[];
  demand: DemandInputs;
  /** Products whose move to bulk waits for a buyer. */
  gatedIds: string[];
  packIds: string[];
  /** SHG income lost because some buyers decline the multi-pack. */
  incomeLostPacks: number;
  /** Gross AC markup lost on declined pack volume. */
  markupLostPacks: number;
}

/**
 * Evaluate a plan with a commitment gate on `gatedIds` (plan channel Bulk, current channel Online) and
 * pack acceptance on products sold as multi-packs.
 */
export function evaluateGated(
  data: CaseData,
  plan: Plan,
  levers: Levers,
  gatedIds: string[],
  demandIn: DemandInputs,
  id: ScenarioResult["id"],
): GatedResult {
  const r = clamp01(demandIn.packAcceptance);
  const c = clamp01(demandIn.bulkSecured);
  const o = runOptions(levers);
  const full = runScenario(data, plan, o);
  const packIds = data.shgs.filter((s) => (plan[s.id]?.unitsPerParcel ?? 1) > 1 && plan[s.id]?.channel === "Online").map((s) => s.id);
  const gated = new Set(gatedIds);
  const segments: ScenarioRow[] = [];
  const scale = (row: ScenarioRow, k: number): ScenarioRow => ({
    ...row,
    units: row.units * k,
    kg: row.kg * k,
    markupRev: row.markupRev * k,
    inboundSpend: row.inboundSpend * k,
    outboundSpend: row.outboundSpend * k,
    shgIncome: row.shgIncome * k,
    shgPayments: row.shgPayments * k,
  });
  let incomeLostPacks = 0;
  let markupLostPacks = 0;
  for (const row of full) {
    const s = data.shgs.find((x) => x.id === row.shgId)!;
    if (packIds.includes(row.shgId)) {
      segments.push(scale(row, r));
      incomeLostPacks += row.shgIncome * (1 - r);
      markupLostPacks += row.markupRev * (1 - r);
    } else if (gated.has(row.shgId)) {
      if (c > 0) segments.push(scale(row, c));
      if (c < 1) {
        // Unsecured volume keeps selling online, single unit, at the plan's AC.
        const p = sellingPrice(s, row.ac, "Online", data.rateCard, { inMult: o.inMult, outMult: o.outMult, edgeInclusive: o.edgeInclusive });
        const online: ScenarioRow = {
          ...row,
          channel: "Online",
          inbound: p.inbound,
          markup: p.markup,
          outbound: p.outbound,
          sp: p.sp,
          competitive: p.sp <= s.market,
          headroomPct: (s.market - p.sp) / s.market,
          markupRev: p.markup * row.units,
          inboundSpend: p.inbound * row.units,
          outboundSpend: p.outbound * row.units,
        };
        segments.push(scale(online, 1 - c));
      }
    } else segments.push(row);
  }

  const base = summarise(segments, levers.thinHeadroom);
  // Product-level competitiveness: sold volume > 0 and every segment at or below market.
  const ids = data.shgs.map((s) => s.id);
  const compIds = ids.filter((i) => {
    const seg = segments.filter((x) => x.shgId === i && x.units > 0);
    return seg.length > 0 && seg.every((x) => x.competitive);
  });
  const uniq = (xs: string[]) => [...new Set(xs)];
  const summary: ScenarioSummary = {
    ...base,
    competitiveCount: compIds.length,
    uncompetitive: ids.filter((i) => !compIds.includes(i)),
    thinHeadroom: uniq(base.thinHeadroom),
  };

  // One display row per product: totals of its segments; prices of the channel buyers actually see
  // (the plan's channel, or online while a gated product still has volume without a buyer).
  const rows: ScenarioRow[] = full.map((target) => {
    const seg = segments.filter((x) => x.shgId === target.shgId);
    const sum = (k: keyof ScenarioRow) => seg.reduce((t, x) => t + (x[k] as number), 0);
    const live = gated.has(target.shgId) && c < 1 ? seg.find((x) => x.channel === "Online") ?? target : target;
    return {
      ...live,
      competitive: compIds.includes(target.shgId),
      units: sum("units"),
      kg: sum("kg"),
      markupRev: sum("markupRev"),
      inboundSpend: sum("inboundSpend"),
      outboundSpend: sum("outboundSpend"),
      shgIncome: sum("shgIncome"),
      shgPayments: sum("shgPayments"),
    };
  });

  return { id, plan, rows, summary, segments, demand: { packAcceptance: r, bulkSecured: c }, gatedIds, packIds, incomeLostPacks, markupLostPacks };
}

/** Share of gated bulk volume covered by validated commitments (LoI or later), capped per product. */
export function securedShareFromOrders(data: CaseData, gatedIds: string[], committed: Map<string, number>, volMult = 1): number {
  const need = gatedIds.reduce((t, i) => t + (data.shgs.find((s) => s.id === i)?.units ?? 0) * volMult, 0);
  if (need <= 0) return 0;
  const got = gatedIds.reduce((t, i) => {
    const u = (data.shgs.find((s) => s.id === i)?.units ?? 0) * volMult;
    return t + Math.min(u, committed.get(i) ?? 0);
  }, 0);
  return Math.min(1, got / need);
}

/** Products a plan moves from online to bulk (these need buyers). */
export function bulkMoves(data: CaseData, plan: Plan): string[] {
  return data.shgs.filter((s) => s.channel === "Online" && plan[s.id]?.channel === "Bulk").map((s) => s.id);
}

/** The recommended hybrid plan, gated by pack acceptance and secured bulk. */
export function evaluateHybrid(
  data: CaseData,
  levers: Levers,
  acOverrides: Record<string, AcName> = {},
  committed: Map<string, number> = new Map(),
  hybrid: HybridConfig = DEFAULT_HYBRID,
): GatedResult {
  const plan = buildPlan("SH", data, levers, acOverrides, hybrid);
  const gatedIds = data.shgs.filter((s) => plan[s.id]?.needsBuyer).map((s) => s.id);
  const auto = securedShareFromOrders(data, gatedIds, committed, 1 + levers.volumeChange);
  return evaluateGated(data, plan, levers, gatedIds, { packAcceptance: levers.packAcceptance, bulkSecured: Math.max(levers.bulkSecured, auto) }, "SH");
}

/** Blanket bulk (S3) with the same commitment gate on every staple it moves to bulk. */
export function evaluateBlanketGated(data: CaseData, levers: Levers, bulkSecured: number, acOverrides: Record<string, AcName> = {}): GatedResult {
  const plan = buildPlan("S3", data, levers, acOverrides);
  return evaluateGated(data, plan, levers, bulkMoves(data, plan), { packAcceptance: 1, bulkSecured }, "S3");
}

export const DEMAND_PRESETS: { id: string; label: string; packAcceptance: number; bulkSecured: number; note: string }[] = [
  { id: "no_bulk_buyer_yet", label: "No bulk buyer yet", packAcceptance: 0.75, bulkSecured: 0, note: "Where the plan starts: packs live, no institutional orders signed." },
  { id: "base_case_illustrative", label: "Base case (illustrative)", packAcceptance: 0.75, bulkSecured: 0.5, note: "Illustrative only: 75% accept packs, half the bulk volume secured." },
  { id: "all_buyers_commit", label: "All buyers commit", packAcceptance: 1, bulkSecured: 1, note: "Ceiling: every pack accepted and every bulk unit has a buyer." },
];

/** Upper-bound exposure split by how far above market a product is. */
export function exposureBySeverity(rows: ScenarioRow[], cut = 0.05) {
  const unc = rows.filter((r) => !r.competitive);
  const far = unc.filter((r) => (r.sp - r.market) / r.market > cut);
  const near = unc.filter((r) => (r.sp - r.market) / r.market <= cut);
  const sum = (xs: ScenarioRow[], k: "markupRev" | "shgIncome") => xs.reduce((t, x) => t + x[k], 0);
  return {
    markup: { total: sum(unc, "markupRev"), far: sum(far, "markupRev"), near: sum(near, "markupRev") },
    income: { total: sum(unc, "shgIncome"), far: sum(far, "shgIncome"), near: sum(near, "shgIncome") },
    women: unc.reduce((t, x) => t + x.active, 0),
    farIds: far.map((r) => r.shgId),
    nearIds: near.map((r) => r.shgId),
  };
}

/** Products that stay above market even with zero AC markup (the markup is not the cause). */
export function aboveMarketAtZeroMarkup(rows: ScenarioRow[]) {
  return rows
    .filter((r) => r.sp - r.markup > r.market)
    .map((r) => ({ shgId: r.shgId, product: r.product, spAtZeroMarkup: r.sp - r.markup, market: r.market, courierShareOfShgPrice: r.outbound / r.shgPrice }));
}

/** Gross markup, units and kg that move between ACs when SHGs are re-linked; units per ₹1 lakh of fixed cost. */
export function acTransfer(before: ScenarioSummary, after: ScenarioSummary) {
  const per = (ac: AcName) => after.byAc[ac].markup / after.byAc[ac].units;
  return {
    markupMoved: before.byAc.Bijnor.markup - after.byAc.Bijnor.markup,
    byAc: (["Bijnor", "Lucknow"] as const).map((ac) => ({
      ac,
      markupBefore: before.byAc[ac].markup,
      markupAfter: after.byAc[ac].markup,
      unitsBefore: before.byAc[ac].units,
      unitsAfter: after.byAc[ac].units,
      kgBefore: before.byAc[ac].kg,
      kgAfter: after.byAc[ac].kg,
      markupPerUnitAfter: per(ac),
      /** Yardstick, not a cost estimate: units a month whose markup equals ₹1 lakh. */
      unitsPerLakhFixedCost: 100000 / per(ac),
    })),
  };
}

/** Freight saved by re-linking (passed to buyers as lower prices, not AC income). */
export function relinkSaving(data: CaseData, levers: Levers) {
  const rows = allocateAll(data.shgs, data.rateCard, { edgeInclusive: levers.edgeInclusive, inMult: 1 + levers.inboundRateChange, volMult: 1 + levers.volumeChange });
  const moves = rows.filter((r) => r.relink).map((r) => ({ shgId: r.shgId, saving: r.savingPerMonth, kg: data.shgs.find((s) => s.id === r.shgId)!.weight * r.units }));
  return { total: moves.reduce((t, m) => t + m.saving, 0), moves };
}

/**
 * Working capital for the hybrid at full commitment. Online buyers pay after `onlineDays`, institutions after `days`.
 * wc = (payouts + logistics) × ((1 − b) × onlineDays + b × days) ÷ 30, b = bulk share of SHG payouts.
 */
export function workingCapitalHybrid(data: CaseData, levers: Levers, acOverrides: Record<string, AcName> = {}, hybrid: HybridConfig = DEFAULT_HYBRID) {
  const plan = buildPlan("SH", data, levers, acOverrides, hybrid);
  const rows = runScenario(data, plan, runOptions(levers));
  const payouts = rows.reduce((t, r) => t + r.shgPayments, 0);
  const logistics = rows.reduce((t, r) => t + r.inboundSpend + r.outboundSpend, 0);
  const bulkShare = rows.filter((r) => r.channel === "Bulk").reduce((t, r) => t + r.shgPayments, 0) / payouts;
  const wc = (days: number, onlineDays = 15) => ((payouts + logistics) * ((1 - bulkShare) * onlineDays + bulkShare * days)) / 30;
  return { payouts, logistics, bulkShare, wc };
}
