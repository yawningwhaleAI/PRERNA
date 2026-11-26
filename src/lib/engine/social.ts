import type { CaseData, Levers } from "./types";

export function gini(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const n = v.length;
  if (n === 0) return 0;
  let cum = 0;
  let total = 0;
  v.forEach((x, i) => {
    cum += (i + 1) * x;
    total += x;
  });
  return (2 * cum) / (n * total) - (n + 1) / n;
}

export function median(values: number[]): number {
  const v = [...values].sort((a, b) => a - b);
  const n = v.length;
  if (n === 0) return NaN;
  const mid = Math.floor(n / 2);
  return n % 2 ? v[mid]! : (v[mid - 1]! + v[mid]!) / 2;
}

/** Python-style round half to even (used for the top-20% cut-off). */
export function roundHalfEven(x: number): number {
  const f = Math.floor(x);
  const diff = x - f;
  if (diff > 0.5) return f + 1;
  if (diff < 0.5) return f;
  return f % 2 === 0 ? f : f + 1;
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i]! - mx;
    const dy = ys[i]! - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

export type Archetype = "Skill-gated" | "Volume-thin" | "Broad, better-paid" | "Few earners, low pay";

export interface ShgSocialRow {
  shgId: string;
  district: string;
  product: string;
  group: string;
  members: number;
  active: number;
  inactive: number;
  participation: number;
  shgIncomeMonth: number;
  incomePerEarner: number;
  incomePerMemberIfShared: number;
  archetype: Archetype;
}

export interface SocialSummary {
  members: number;
  earners: number;
  notEarning: number;
  participation: number;
  shgIncomeTotal: number;
  meanIncomeEarner: number;
  medianIncomeEarner: number;
  meanIncomeAllMembers: number;
  giniEarners: number;
  giniAllMembers: number;
  minIncomeEarner: number;
  maxIncomeEarner: number;
  topQuintileShare: number;
  correlationParticipationIncome: number;
  shgsBelow50: string[];
  shgsFullParticipation: string[];
  earnersBelowLakhpati: number;
  byGroup: { group: string; participation: number; incomePerEarner: number; members: number; earners: number }[];
}

/**
 * Social baseline. Income per woman assumes SHG profit is split equally among earning women
 * (case rule 7); non-earners count as zero in the all-member figures.
 */
export function socialAnalysis(data: CaseData, levers: Levers): { rows: ShgSocialRow[]; summary: SocialSummary } {
  const vol = 1 + levers.volumeChange;
  const groupOf = new Map(data.attributes.map((a) => [a.shgId, a.group]));
  const base = data.shgs.map((s) => {
    const income = s.shgProfit * s.units * vol;
    return { s, income, perEarner: income / s.active };
  });
  const women: number[] = [];
  for (const b of base) {
    for (let i = 0; i < b.s.active; i++) women.push(b.perEarner);
    for (let i = 0; i < b.s.members - b.s.active; i++) women.push(0);
  }
  const earners = women.filter((w) => w > 0);
  const med = median(earners);
  const rows: ShgSocialRow[] = base.map(({ s, income, perEarner }) => {
    const participation = s.active / s.members;
    const highP = participation >= 0.5;
    const highPay = perEarner >= med;
    const archetype: Archetype = highP
      ? highPay
        ? "Broad, better-paid"
        : "Volume-thin"
      : highPay
        ? "Skill-gated"
        : "Few earners, low pay";
    return {
      shgId: s.id,
      district: s.district,
      product: s.product,
      group: groupOf.get(s.id) ?? "Unclassified",
      members: s.members,
      active: s.active,
      inactive: s.members - s.active,
      participation,
      shgIncomeMonth: income,
      incomePerEarner: perEarner,
      incomePerMemberIfShared: income / s.members,
      archetype,
    };
  });
  const sorted = [...earners].sort((a, b) => b - a);
  const k = Math.max(1, roundHalfEven(sorted.length * 0.2));
  const sumE = earners.reduce((a, b) => a + b, 0);
  const groups = [...new Set(rows.map((r) => r.group))];
  const members = rows.reduce((a, r) => a + r.members, 0);
  const active = rows.reduce((a, r) => a + r.active, 0);
  return {
    rows,
    summary: {
      members,
      earners: active,
      notEarning: members - active,
      participation: active / members,
      shgIncomeTotal: rows.reduce((a, r) => a + r.shgIncomeMonth, 0),
      meanIncomeEarner: sumE / earners.length,
      medianIncomeEarner: med,
      meanIncomeAllMembers: women.reduce((a, b) => a + b, 0) / women.length,
      giniEarners: gini(earners),
      giniAllMembers: gini(women),
      minIncomeEarner: Math.min(...earners),
      maxIncomeEarner: Math.max(...earners),
      topQuintileShare: sorted.slice(0, k).reduce((a, b) => a + b, 0) / sumE,
      correlationParticipationIncome: pearson(
        rows.map((r) => r.participation),
        rows.map((r) => r.incomePerEarner),
      ),
      shgsBelow50: rows.filter((r) => r.participation < 0.5).map((r) => r.shgId),
      shgsFullParticipation: rows.filter((r) => r.participation === 1).map((r) => r.shgId),
      earnersBelowLakhpati: earners.filter((w) => w < levers.lakhpatiMonthly).length,
      byGroup: groups.map((g) => {
        const gr = rows.filter((r) => r.group === g);
        const m = gr.reduce((a, r) => a + r.members, 0);
        const e = gr.reduce((a, r) => a + r.active, 0);
        return {
          group: g,
          members: m,
          earners: e,
          participation: e / m,
          incomePerEarner: gr.reduce((a, r) => a + r.shgIncomeMonth, 0) / e,
        };
      }),
    },
  };
}
