import { allocate } from "./allocation";
import { channelRule, channelSwitchOnly } from "./channel";
import { sellingPrice, type PriceOptions } from "./pricing";
import type { AcName, CaseData, Levers, Plan, ScenarioId, ShgRecord } from "./types";

export const SCENARIOS: { id: ScenarioId; short: string; label: string }[] = [
  { id: "S0", short: "S0 Today", label: "Today's links and channels, logistics charged" },
  { id: "S1", short: "S1 Re-link", label: "Re-link mis-linked SHGs (hub rule), channels unchanged" },
  { id: "S2", short: "S2 Channel", label: "Channel switch at current AC only" },
  { id: "S3", short: "S3 Re-link + channel", label: "Hub rule plus channel rule (recommended core)" },
];

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
    { label: "Logistics rates +10%", shock: 0.1, kind: "rates", summary: run({ ...base, inMult: base.inMult * 1.1, outMult: base.outMult * 1.1 }) },
    { label: "Logistics rates +20%", shock: 0.2, kind: "rates", summary: run({ ...base, inMult: base.inMult * 1.2, outMult: base.outMult * 1.2 }) },
    { label: "Volume −20%", shock: -0.2, kind: "volume", summary: run({ ...base, volMult: base.volMult * 0.8 }) },
  ];
}
