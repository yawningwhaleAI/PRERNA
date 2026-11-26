import type { CaseData, Levers } from "./types";
import type { ScenarioRow } from "./scenarios";

export interface HeadroomRow {
  shgId: string;
  product: string;
  channel: "Online" | "Bulk";
  sp: number;
  market: number;
  headroomPct: number;
  eligible: boolean;
  shgPriceOld: number;
  shgPriceNew: number;
  deltaPrice: number;
  units: number;
  shgProfitUnit: number;
  active: number;
  extraShgIncomeMonth: number;
  extraIncomePerActive: number;
  baseIncomePerActive: number;
  extraAcMarkupMonth: number;
}

/**
 * Headroom-for-inclusion (assumption scenario). Eligible if the S3 channel is online and headroom > trigger.
 * New SHG price = (target × market − inbound − outbound) ÷ (1 + markup). The whole rise is treated as SHG profit.
 */
export function headroomSharing(data: CaseData, s3Rows: ScenarioRow[], levers: Levers): HeadroomRow[] {
  const markup = data.rateCard.markup;
  return s3Rows.map((r) => {
    const s = data.shgs.find((x) => x.id === r.shgId)!;
    const target = levers.headroomTargetSpPctMarket * r.market;
    const newPrice = (target - r.inbound - r.outbound) / (1 + markup);
    const eligible = r.headroomPct > levers.headroomTrigger && r.channel === "Online";
    const dP = eligible ? Math.max(0, newPrice - s.shgPrice) : 0;
    return {
      shgId: r.shgId,
      product: r.product,
      channel: r.channel,
      sp: r.sp,
      market: r.market,
      headroomPct: r.headroomPct,
      eligible: eligible && dP > 0,
      shgPriceOld: s.shgPrice,
      shgPriceNew: s.shgPrice + dP,
      deltaPrice: dP,
      units: r.units,
      shgProfitUnit: s.shgProfit,
      active: s.active,
      extraShgIncomeMonth: dP * r.units,
      extraIncomePerActive: (dP * r.units) / s.active,
      baseIncomePerActive: (s.shgProfit * r.units) / s.active,
      extraAcMarkupMonth: markup * dP * r.units,
    };
  });
}

export const PASSTHROUGH_SHARES = [0.5, 0.75, 1] as const;
export const VOLUME_KEPT = [0.8, 0.9, 1] as const;

/** Net change in SHG income: share of the price rise reaching profit × share of volume kept. */
export function passthroughGrid(rows: HeadroomRow[]): { share: number; kept: number; netChange: number }[] {
  const out: { share: number; kept: number; netChange: number }[] = [];
  for (const share of PASSTHROUGH_SHARES) {
    for (const kept of VOLUME_KEPT) {
      let extra = 0;
      for (const h of rows) {
        if (!(h.deltaPrice > 0)) continue;
        const newInc = (h.shgProfitUnit + share * h.deltaPrice) * h.units * kept;
        extra += newInc - h.shgProfitUnit * h.units;
      }
      out.push({ share, kept, netChange: extra });
    }
  }
  return out;
}

export interface InclusionVolumeRow {
  shgId: string;
  product: string;
  members: number;
  active: number;
  targetActive: number;
  newWomen: number;
  unitsNow: number;
  unitsNeeded: number;
  extraUnits: number;
  extraUnitsPct: number;
}

/** Units needed to reach the participation target without diluting income per earning woman. */
export function inclusionVolumeTest(data: CaseData, levers: Levers): InclusionVolumeRow[] {
  const vol = 1 + levers.volumeChange;
  return data.shgs.map((s) => {
    const target = Math.max(s.active, Math.ceil(levers.participationTarget * s.members));
    const unitsNow = s.units * vol;
    const unitsNeeded = (unitsNow * target) / s.active;
    return {
      shgId: s.id,
      product: s.product,
      members: s.members,
      active: s.active,
      targetActive: target,
      newWomen: target - s.active,
      unitsNow,
      unitsNeeded,
      extraUnits: unitsNeeded - unitsNow,
      extraUnitsPct: target / s.active - 1,
    };
  });
}
