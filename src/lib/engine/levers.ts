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
  { key: "inboundRateChange", label: "Change in transport rates to the warehouse", unit: "pct", assumption: false, note: "Test what happens if trucking to the warehouse gets dearer. 0% = case rates." },
  { key: "outboundRateChange", label: "Change in courier and truck rates to buyers", unit: "pct", assumption: false, note: "Test what happens if delivery gets dearer. 0% = case rates." },
  { key: "volumeChange", label: "Change in units sold", unit: "pct", assumption: false, note: "Test a drop or rise in sales. 0% = case volumes." },
  { key: "packagingPerBox", label: "Packaging cost per gift box", unit: "inr", assumption: true, note: "No quote yet; the research tested ₹0–80." },
  { key: "boxesPerOrder", label: "Boxes in one corporate order", unit: "count", assumption: true, note: "Example order size, not a forecast." },
  { key: "headroomTrigger", label: "Price rise allowed if a product is this far below market", unit: "pct", assumption: true, note: "Keeps a safety buffer below market." },
  { key: "headroomTargetSpPctMarket", label: "…and the new price stays at this share of market", unit: "pct", assumption: true, note: "e.g. 90% = still 10% cheaper than market." },
  { key: "thinHeadroom", label: "Warn when a product is less than this far below market", unit: "pct", assumption: true, note: "Products this close to market can tip over with small cost rises." },
  { key: "participationTarget", label: "Target share of members earning in each SHG", unit: "pct", assumption: true, note: "Used for the inclusion test; illustrative." },
  { key: "prernaStores", label: "Prerna Saras stores in UP", unit: "count", assumption: false, note: "Business Standard, 16 Sep 2026." },
  { key: "minWageYardstick", label: "UP minimum wage, unskilled worker (₹ a month)", unit: "inr", assumption: false, note: "UP notification Oct 2026 – Mar 2027; used only as a yardstick." },
  { key: "lakhpatiMonthly", label: "Lakhpati Didi average monthly income", unit: "inr", assumption: false, note: "MoRD definition (household income)." },
  { key: "edgeInclusive", label: "A distance of exactly 100/300/500 km pays the lower rate", unit: "flag", assumption: true, note: "How the case wording '101–300 km' is read. Untick to test the other reading: the Varanasi wooden toys (SHG-14) then cost more than market online." },
];
