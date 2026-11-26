import type { Levers } from "./types";

/** Lever defaults from CLAUDE.md. These reproduce context/reference_outputs exactly. */
export const DEFAULT_LEVERS: Levers = {
  edgeInclusive: true,
  inboundRateChange: 0,
  outboundRateChange: 0,
  volumeChange: 0,
  packagingPerBox: 40,
  boxesPerOrder: 1000,
  headroomTrigger: 0.1,
  headroomTargetSpPctMarket: 0.9,
  thinHeadroom: 0.05,
  participationTarget: 0.8,
  prernaStores: 543,
  minWageYardstick: 13190,
  lakhpatiMonthly: 10000,
};

export interface LeverMeta {
  key: keyof Levers;
  label: string;
  unit: "flag" | "pct" | "inr" | "count";
  assumption: boolean;
  note: string;
}

export const LEVER_META: LeverMeta[] = [
  { key: "edgeInclusive", label: "Band edge counts in the lower band", unit: "flag", assumption: true, note: "A2. Case wording '101–300'. Off: SHG-14 turns uncompetitive online at Lucknow." },
  { key: "inboundRateChange", label: "Change in inbound rates", unit: "pct", assumption: false, note: "Stress test. 0% = case rate card." },
  { key: "outboundRateChange", label: "Change in outbound rates", unit: "pct", assumption: false, note: "Stress test. 0% = case rate card." },
  { key: "volumeChange", label: "Change in monthly volume", unit: "pct", assumption: false, note: "Stress test. 0% = case volumes." },
  { key: "packagingPerBox", label: "Packaging cost per gift box", unit: "inr", assumption: true, note: "A16. No quote available; tested at ₹0–80." },
  { key: "boxesPerOrder", label: "Boxes per corporate order", unit: "count", assumption: true, note: "Illustrative order size, not a forecast." },
  { key: "headroomTrigger", label: "Headroom above which D2C price may rise", unit: "pct", assumption: true, note: "A10. Keeps a buffer below market." },
  { key: "headroomTargetSpPctMarket", label: "Target SP after rise (% of market)", unit: "pct", assumption: true, note: "A10. SP set at 90% of market." },
  { key: "thinHeadroom", label: "Thin headroom threshold", unit: "pct", assumption: true, note: "Flag products within 5% of market." },
  { key: "participationTarget", label: "Participation target per SHG", unit: "pct", assumption: true, note: "Inclusion test, illustrative target." },
  { key: "prernaStores", label: "Prerna Saras stores in UP", unit: "count", assumption: false, note: "Business Standard, 16 Sep 2026." },
  { key: "minWageYardstick", label: "UP minimum wage, unskilled (yardstick)", unit: "inr", assumption: false, note: "UP notification Oct 2026 – Mar 2027." },
  { key: "lakhpatiMonthly", label: "Lakhpati Didi average monthly income", unit: "inr", assumption: false, note: "MoRD definition (household income)." },
];
