import { inboundCost, outboundCost } from "./rates";
import { distanceTo } from "./pricing";
import type { AcName, CaseData, Levers, Plan } from "./types";

export interface BoxItemInput {
  shgId: string;
  qty: number;
}

export interface BoxLine {
  shgId: string;
  product: string;
  ac: AcName;
  qty: number;
  shgPrice: number;
  inbound: number;
  markup: number;
  weight: number;
  market: number;
  shgProfit: number;
  unitsPerMonth: number;
  monthsOfOutput: number;
}

export interface BoxPriced {
  ok: true;
  ac: AcName;
  lines: BoxLine[];
  kg: number;
  contentsLanded: number;
  packaging: number;
  deliveryBulk: number;
  deliveryCourier: number;
  spBulk: number;
  spCourier: number;
  sumMarket: number;
  headroomBulk: number;
  headroomCourier: number;
  shgIncomePerBox: number;
  acMarkupPerBox: number;
  boxesPerOrder: number;
  shgIncomePerOrder: number;
  acMarkupPerOrder: number;
  bindingSku: string;
  monthsOfOutput: number;
}

export interface BoxRejected {
  ok: false;
  reason: "empty" | "mixed-ac" | "unknown-sku";
  message: string;
  acs?: { shgId: string; ac: AcName }[];
}

/**
 * Corporate box (Prerna 365). Contents must come from ONE AC (under the given plan).
 * Box SP = Σ(SHG price + inbound + markup) + packaging + delivery (bulk ₹/kg or courier on box kg).
 */
export function priceBox(data: CaseData, items: BoxItemInput[], plan: Plan, levers: Levers): BoxPriced | BoxRejected {
  const live = items.filter((i) => i.qty > 0);
  if (live.length === 0) return { ok: false, reason: "empty", message: "Add at least one SKU." };
  const card = data.rateCard;
  const inMult = 1 + levers.inboundRateChange;
  const outMult = 1 + levers.outboundRateChange;
  const lines: BoxLine[] = [];
  for (const it of live) {
    const s = data.shgs.find((x) => x.id === it.shgId);
    const a = plan[it.shgId];
    if (!s || !a) return { ok: false, reason: "unknown-sku", message: `Unknown SKU ${it.shgId}.` };
    lines.push({
      shgId: s.id,
      product: s.product,
      ac: a.ac,
      qty: it.qty,
      shgPrice: s.shgPrice,
      inbound: inboundCost(s.weight, distanceTo(s, a.ac), card, { edgeInclusive: levers.edgeInclusive, inMult }),
      markup: card.markup * s.shgPrice,
      weight: s.weight,
      market: s.market,
      shgProfit: s.shgProfit,
      unitsPerMonth: s.units,
      monthsOfOutput: (levers.boxesPerOrder * it.qty) / s.units,
    });
  }
  const acs = new Set(lines.map((l) => l.ac));
  if (acs.size > 1) {
    return {
      ok: false,
      reason: "mixed-ac",
      message: "Mixed-AC box blocked: every SKU in a box must ship from the same AC (no cross-AC freight).",
      acs: lines.map((l) => ({ shgId: l.shgId, ac: l.ac })),
    };
  }
  const ac = lines[0]!.ac;
  let kg = 0;
  let contentsLanded = 0;
  let sumMarket = 0;
  let shgIncomePerBox = 0;
  let acMarkupPerBox = 0;
  for (const l of lines) {
    kg += l.weight * l.qty;
    contentsLanded += (l.shgPrice + l.inbound + l.markup) * l.qty;
    sumMarket += l.market * l.qty;
    shgIncomePerBox += l.shgProfit * l.qty;
    acMarkupPerBox += l.markup * l.qty;
  }
  const packaging = levers.packagingPerBox;
  const deliveryBulk = card.bulkPerKg * kg * outMult;
  const deliveryCourier = outboundCost(kg, "Online", card, outMult);
  const spBulk = contentsLanded + packaging + deliveryBulk;
  const spCourier = contentsLanded + packaging + deliveryCourier;
  const binding = lines.reduce((a, b) => (b.monthsOfOutput > a.monthsOfOutput ? b : a));
  return {
    ok: true,
    ac,
    lines,
    kg,
    contentsLanded,
    packaging,
    deliveryBulk,
    deliveryCourier,
    spBulk,
    spCourier,
    sumMarket,
    headroomBulk: (sumMarket - spBulk) / sumMarket,
    headroomCourier: (sumMarket - spCourier) / sumMarket,
    shgIncomePerBox,
    acMarkupPerBox,
    boxesPerOrder: levers.boxesPerOrder,
    shgIncomePerOrder: shgIncomePerBox * levers.boxesPerOrder,
    acMarkupPerOrder: acMarkupPerBox * levers.boxesPerOrder,
    bindingSku: binding.shgId,
    monthsOfOutput: binding.monthsOfOutput,
  };
}

export interface CapacityLine {
  shgId: string;
  product: string;
  unitsRequired: number;
  unitsPerMonth: number;
  outputOverLeadTime: number;
  monthsOfOutput: number;
  ok: boolean;
  activeNow: number;
  /** Extra earning women needed to meet the order in the lead time at today's output per woman. */
  extraWomenNeeded: number;
}

/** Capacity check before accepting a PO: units required vs monthly output over the lead time. */
export function capacityCheck(
  data: CaseData,
  needs: { shgId: string; units: number }[],
  leadTimeMonths: number,
): { lines: CapacityLine[]; ok: boolean; binding: CapacityLine | null } {
  const bySku = new Map<string, number>();
  for (const n of needs) bySku.set(n.shgId, (bySku.get(n.shgId) ?? 0) + n.units);
  const lines: CapacityLine[] = [];
  for (const [shgId, unitsRequired] of bySku) {
    const s = data.shgs.find((x) => x.id === shgId);
    if (!s) continue;
    const output = s.units * leadTimeMonths;
    const perWomanPerMonth = s.units / s.active;
    const womenNeeded = leadTimeMonths > 0 ? Math.ceil(unitsRequired / (perWomanPerMonth * leadTimeMonths) - 1e-9) : Infinity;
    lines.push({
      shgId,
      product: s.product,
      unitsRequired,
      unitsPerMonth: s.units,
      outputOverLeadTime: output,
      monthsOfOutput: unitsRequired / s.units,
      ok: unitsRequired <= output,
      activeNow: s.active,
      extraWomenNeeded: Math.max(0, womenNeeded - s.active),
    });
  }
  const binding = lines.length ? lines.reduce((a, b) => (b.monthsOfOutput > a.monthsOfOutput ? b : a)) : null;
  return { lines, ok: lines.every((l) => l.ok), binding };
}
