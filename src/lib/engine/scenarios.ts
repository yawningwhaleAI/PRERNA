import { allocate } from "./allocation";
import { channelRule, channelSwitchOnly } from "./channel";
import { sellingPrice, type PriceOptions } from "./pricing";
import type { AcName, CaseData, HybridConfig, Levers, Plan, ScenarioId, ShgRecord } from "./types";
import hybridPlan from "../../data/hybrid-plan.json";

export const DEFAULT_HYBRID: HybridConfig = { packs: hybridPlan.packs as Record<string, number>, needsBuyer: hybridPlan.needsBuyer, pilotShgs: hybridPlan.pilotShgs };

export interface ScenarioInfo {
  id: ScenarioId;
  /** Plain-language name used across the app. */
  name: string;
  /** Short label for buttons and table headers. */
  short: string;
  /** One sentence: what changes in this plan. */
  what: string;
  /** Kept for reference to the analysis and the Excel workbook. */
  label: string;
  recommended?: boolean;
}

export const SCENARIOS: ScenarioInfo[] = [
  { id: "S0", name: "Today's setup", short: "Today", label: "S0 baseline", what: "Nothing changes: same warehouses, same sales channels. Transport is now added to the price (from Oct 2027)." },
  { id: "S1", name: "Fix links (floor)", short: "Fix links", label: "S1 re-link", what: "7 SHGs that send goods to a far-away warehouse switch to Lucknow, where transport is cheaper. No new buyers needed. Products are sold as today." },
  { id: "S2", name: "Fix sales channels", short: "Fix channels", label: "S2 channel", what: "Products too expensive online are sold in bulk instead. Warehouses stay as today." },
  { id: "S3", name: "Fix links + all staples to bulk", short: "All staples to bulk", label: "S3 re-link + blanket bulk", what: "Re-link 7 SHGs and move all five failing staples to bulk (2,250 units a month need bulk buyers)." },
  { id: "SH", name: "Fix links + buyer-backed hybrid (recommended)", short: "Hybrid", label: "SH demand-backed hybrid", recommended: true, what: "Re-link 7 SHGs; jaggery and garam masala online as multi-packs; atta, detergent and mustard oil to bulk only when a buyer commits." },
];

export const RECOMMENDED_PLAN: ScenarioId = "SH";

export interface RunOptions {
  inMult: number;
  outMult: number;
  volMult: number;
  edgeInclusive: boolean;
}

export function runOptions(levers: Levers): RunOptions {
  return {
    inMult: 1 + levers.inboundRateChange,
    outMult: 1 + levers.outboundRateChange,
    volMult: 1 + levers.volumeChange,
    edgeInclusive: levers.edgeInclusive,
  };
}

const priceOpts = (o: RunOptions): PriceOptions => ({ inMult: o.inMult, outMult: o.outMult, edgeInclusive: o.edgeInclusive });

/**
 * Decide each SHG's AC and channel for a scenario under the current levers.
 * `acOverrides` (Allocation what-if) replace the hub-rule AC in S1 and S3.
 */
export function buildPlan(
  id: ScenarioId,
  data: CaseData,
  levers: Levers,
  acOverrides: Record<string, AcName> = {},
  hybrid: HybridConfig = DEFAULT_HYBRID,
): Plan {
  const o = runOptions(levers);
  const plan: Plan = {};
  for (const s of data.shgs) {
    const hubAc = (): AcName =>
      acOverrides[s.id] ?? allocate(s, data.rateCard, { edgeInclusive: o.edgeInclusive, inMult: o.inMult }).proposedAc;
    switch (id) {
      case "S0":
        plan[s.id] = { ac: s.linkedAc, channel: s.channel };
        break;
      case "S1":
        plan[s.id] = { ac: hubAc(), channel: s.channel };
        break;
      case "S2":
        plan[s.id] = { ac: s.linkedAc, channel: channelSwitchOnly(s, data.rateCard, priceOpts(o)) };
        break;
      case "S3": {
        const ac = hubAc();
        plan[s.id] = { ac, channel: channelRule(s, ac, data.rateCard, priceOpts(o)).channel };
        break;
      }
      case "SH": {
        const ac = hubAc();
        const pack = hybrid.packs[s.id];
        if (pack) plan[s.id] = { ac, channel: "Online", unitsPerParcel: pack };
        else if (hybrid.needsBuyer.includes(s.id)) plan[s.id] = { ac, channel: "Bulk", needsBuyer: true };
        else plan[s.id] = { ac, channel: s.channel };
        break;
      }
    }
  }
  return plan;
}

export interface ScenarioRow {
  shgId: string;
  product: string;
  ac: AcName;
  channel: "Online" | "Bulk";
  shgPrice: number;
  inbound: number;
  markup: number;
  outbound: number;
  sp: number;
  market: number;
  competitive: boolean;
  headroomPct: number;
  units: number;
  kg: number;
  markupRev: number;
  inboundSpend: number;
  outboundSpend: number;
  shgIncome: number;
  shgPayments: number;
  active: number;
  members: number;
}

export function runScenario(data: CaseData, plan: Plan, o: RunOptions): ScenarioRow[] {
  return data.shgs.map((s: ShgRecord) => {
    const a = plan[s.id] ?? { ac: s.linkedAc, channel: s.channel };
    const upp = a.channel === "Online" ? (a.unitsPerParcel ?? 1) : 1;
    const p = sellingPrice(s, a.ac, a.channel, data.rateCard, { ...priceOpts(o), unitsPerParcel: upp });
    const units = s.units * o.volMult;
    return {
      shgId: s.id,
      product: s.product,
      ac: a.ac,
      channel: a.channel,
      shgPrice: s.shgPrice,
      inbound: p.inbound,
      markup: p.markup,
      outbound: p.outbound,
      sp: p.sp,
      market: s.market,
      competitive: p.sp <= s.market,
      headroomPct: (s.market - p.sp) / s.market,
      units,
      kg: s.weight * units,
      markupRev: p.markup * units,
      inboundSpend: p.inbound * units,
      outboundSpend: p.outbound * units,
      shgIncome: s.shgProfit * units,
      shgPayments: s.shgPrice * units,
      active: s.active,
      members: s.members,
    };
  });
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export interface AcSummary {
  ac: AcName;
  shgs: number;
  units: number;
  kg: number;
  gmv: number;
  shgPayments: number;
  markup: number;
  markupSecure: number;
  logistics: number;
}

export interface ScenarioSummary {
  competitiveCount: number;
  uncompetitive: string[];
  thinHeadroom: string[];
  acMarkupTotal: number;
  acMarkupAtRisk: number;
  acMarkupSecure: number;
  logisticsOutlay: number;
  inboundOutlay: number;
  outboundOutlay: number;
  shgIncomeTotal: number;
  shgIncomeAtRisk: number;
  womenActiveAtRisk: number;
  membersInAtRiskShgs: number;
  byAc: Record<AcName, AcSummary>;
}

export function summarise(rows: ScenarioRow[], thinHeadroom = 0.05): ScenarioSummary {
  const comp = rows.filter((r) => r.competitive);
  const unc = rows.filter((r) => !r.competitive);
  const acSum = (ac: AcName): AcSummary => {
    const mine = rows.filter((r) => r.ac === ac);
    return {
      ac,
      shgs: mine.length,
      units: sum(mine.map((r) => r.units)),
      kg: sum(mine.map((r) => r.kg)),
      gmv: sum(mine.map((r) => r.sp * r.units)),
      shgPayments: sum(mine.map((r) => r.shgPayments)),
      markup: sum(mine.map((r) => r.markupRev)),
      markupSecure: sum(mine.filter((r) => r.competitive).map((r) => r.markupRev)),
      logistics: sum(mine.map((r) => r.inboundSpend)) + sum(mine.map((r) => r.outboundSpend)),
    };
  };
  return {
    competitiveCount: comp.length,
    uncompetitive: unc.map((r) => r.shgId),
    thinHeadroom: rows.filter((r) => r.competitive && r.headroomPct < thinHeadroom).map((r) => r.shgId),
    acMarkupTotal: sum(rows.map((r) => r.markupRev)),
    acMarkupAtRisk: sum(unc.map((r) => r.markupRev)),
    acMarkupSecure: sum(comp.map((r) => r.markupRev)),
    logisticsOutlay: sum(rows.map((r) => r.inboundSpend)) + sum(rows.map((r) => r.outboundSpend)),
    inboundOutlay: sum(rows.map((r) => r.inboundSpend)),
    outboundOutlay: sum(rows.map((r) => r.outboundSpend)),
    shgIncomeTotal: sum(rows.map((r) => r.shgIncome)),
    shgIncomeAtRisk: sum(unc.map((r) => r.shgIncome)),
    womenActiveAtRisk: sum(unc.map((r) => r.active)),
    membersInAtRiskShgs: sum(unc.map((r) => r.members)),
    byAc: { Bijnor: acSum("Bijnor"), Lucknow: acSum("Lucknow") },
  };
}

export interface ScenarioResult {
  id: ScenarioId;
  plan: Plan;
  rows: ScenarioRow[];
  summary: ScenarioSummary;
}

export function evaluateScenario(
  id: ScenarioId,
  data: CaseData,
  levers: Levers,
  acOverrides: Record<string, AcName> = {},
): ScenarioResult {
  const plan = buildPlan(id, data, levers, acOverrides);
  const rows = runScenario(data, plan, runOptions(levers));
  return { id, plan, rows, summary: summarise(rows, levers.thinHeadroom) };
}

export interface StressResult {
  label: string;
  shock: number;
  kind: "rates" | "volume";
  summary: ScenarioSummary;
}

/**
 * Stress tests keep the plan fixed (decisions already taken) and shock rates or volume.
 * Shocks stack on top of the current lever settings.
 */
export function stressTests(data: CaseData, plan: Plan, levers: Levers): StressResult[] {
  const base = runOptions(levers);
  const run = (o: RunOptions) => summarise(runScenario(data, plan, o), levers.thinHeadroom);
  return [
    { label: "Courier and truck rates rise 10%", shock: 0.1, kind: "rates", summary: run({ ...base, inMult: base.inMult * 1.1, outMult: base.outMult * 1.1 }) },
    { label: "Courier and truck rates rise 20%", shock: 0.2, kind: "rates", summary: run({ ...base, inMult: base.inMult * 1.2, outMult: base.outMult * 1.2 }) },
    { label: "Sales fall 20%", shock: -0.2, kind: "volume", summary: run({ ...base, volMult: base.volMult * 0.8 }) },
  ];
}
