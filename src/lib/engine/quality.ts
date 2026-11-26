import type { CaseData } from "./types";

export interface QualityCheck {
  rule: string;
  level: "blocking" | "warning";
  passed: boolean;
  detail: string;
}

/** Data-quality rules (PRD §11) applied to the case dataset. */
export function dataQuality(data: CaseData): QualityCheck[] {
  const s = data.shgs;
  const edges = data.rateCard.bands.map((b) => b.upToKm).filter((x): x is number => x !== null);
  const onEdge = s.filter((x) => edges.includes(x.distBijnor) || edges.includes(x.distLucknow));
  const nearEdge = s.filter((x) => edges.some((e) => Math.abs(x.distBijnor - e) <= 10 || Math.abs(x.distLucknow - e) <= 10));
  const byProduct = new Map<string, Set<number>>();
  for (const x of s) byProduct.set(x.product, (byProduct.get(x.product) ?? new Set()).add(x.market));
  const multiBench = [...byProduct.entries()].filter(([, v]) => v.size > 1);
  const ids = s.map((x) => x.id);
  const list = (xs: string[]) => (xs.length ? xs.join(", ") : "none");
  return [
    { rule: "Earning women ≤ members", level: "blocking", passed: s.every((x) => x.active <= x.members), detail: list(s.filter((x) => x.active > x.members).map((x) => x.id)) },
    { rule: "Weight > 0", level: "blocking", passed: s.every((x) => x.weight > 0), detail: list(s.filter((x) => !(x.weight > 0)).map((x) => x.id)) },
    { rule: "SHG profit < SHG price", level: "blocking", passed: s.every((x) => x.shgProfit < x.shgPrice), detail: list(s.filter((x) => x.shgProfit >= x.shgPrice).map((x) => x.id)) },
    { rule: "Distance present for both ACs", level: "blocking", passed: s.every((x) => Number.isFinite(x.distBijnor) && Number.isFinite(x.distLucknow)), detail: "all present" },
    { rule: "Unique SHG IDs", level: "blocking", passed: new Set(ids).size === ids.length, detail: `${ids.length} IDs` },
    { rule: "Distance exactly on a band edge", level: "warning", passed: onEdge.length === 0, detail: `${list(onEdge.map((x) => x.id))}: lower band applied (lever)` },
    { rule: "Distance within ±10 km of a band edge", level: "warning", passed: nearEdge.length === 0, detail: `${list(nearEdge.map((x) => x.id))}: verify road distance` },
    { rule: "Same product, different market benchmark", level: "warning", passed: multiBench.length === 0, detail: multiBench.map(([p, v]) => `${p}: ${[...v].map((n) => `₹${n}`).join(" vs ")}`).join("; ") || "none" },
    { rule: "Benchmark ≤ 120 days old", level: "warning", passed: false, detail: "Case benchmarks carry no source or date: collect source, date, channel and quality tier" },
  ];
}
