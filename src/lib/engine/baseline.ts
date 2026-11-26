import { allocate } from "./allocation";
import { inboundRate, outboundCost } from "./rates";
import { distanceTo, sellingPrice } from "./pricing";
import type { AcName, CaseData, Channel, Levers } from "./types";
import { runOptions } from "./scenarios";
import { DEFAULT_LEVERS } from "./levers";

/** Product-level economics at today's link and channel (mirrors 01_baseline_product_economics.csv). */
export interface BaselineRow {
  shgId: string;
  district: string;
  product: string;
  linkedAc: AcName;
  channel: Channel;
  weight: number;
  units: number;
  shgPrice: number;
  market: number;
  valueDensity: number;
  kmLinked: number;
  bandRateLinked: number;
  bandRateBijnor: number;
  bandRateLucknow: number;
  inbound: number;
  markup: number;
  outbound: number;
  sp: number;
  gap: number;
  headroomPct: number;
  competitive: boolean;
  logisticsShareOfSp: number;
  logisticsPctOfShgPrice: number;
  acMarkupMonth: number;
  acInboundSpendMonth: number;
  acOutboundSpendMonth: number;
  gmvMonth: number;
  kgMonth: number;
  inboundBijnor: number;
  inboundLucknow: number;
  cheapestAc: AcName | "Tie";
  closerAc: AcName;
  reallocSavingUnit: number;
  reallocSavingMonth: number;
  mislinked: boolean;
  bestAc: AcName;
  spBOnline: number;
  spBBulk: number;
  spLOnline: number;
  spLBulk: number;
  onlineMinusBulkOutbound: number;
  maxMarkupPctOnline: number;
  maxMarkupPctBulk: number;
  members: number;
  active: number;
  participation: number;
  inactive: number;
  shgIncomeMonth: number;
  incomePerActiveMonth: number;
  incomePerMemberMonthIfShared: number;
  shgProfitUnit: number;
}

export function baseline(data: CaseData, levers: Levers = DEFAULT_LEVERS): BaselineRow[] {
  const o = runOptions(levers);
  const card = data.rateCard;
  const po = { inMult: o.inMult, outMult: o.outMult, edgeInclusive: o.edgeInclusive };
  return data.shgs.map((s) => {
    const cur = sellingPrice(s, s.linkedAc, s.channel, card, po);
    const alloc = allocate(s, card, { edgeInclusive: o.edgeInclusive, inMult: o.inMult, volMult: o.volMult });
    const units = s.units * o.volMult;
    const km = distanceTo(s, s.linkedAc);
    const best = alloc.proposedAc;
    const spAt = (ac: AcName, ch: Channel) => sellingPrice(s, ac, ch, card, po).sp;
    const maxMk = (ch: Channel) => (s.market - sellingPrice(s, best, ch, card, { ...po, markup: 0 }).sp) / s.shgPrice;
    const income = s.shgProfit * units;
    return {
      shgId: s.id,
      district: s.district,
      product: s.product,
      linkedAc: s.linkedAc,
      channel: s.channel,
      weight: s.weight,
      units,
      shgPrice: s.shgPrice,
      market: s.market,
      valueDensity: s.shgPrice / s.weight,
      kmLinked: km,
      bandRateLinked: inboundRate(km, card, o.edgeInclusive),
      bandRateBijnor: inboundRate(s.distBijnor, card, o.edgeInclusive),
      bandRateLucknow: inboundRate(s.distLucknow, card, o.edgeInclusive),
      inbound: cur.inbound,
      markup: cur.markup,
      outbound: cur.outbound,
      sp: cur.sp,
      gap: cur.sp - s.market,
      headroomPct: (s.market - cur.sp) / s.market,
      competitive: cur.sp <= s.market,
      logisticsShareOfSp: (cur.inbound + cur.outbound) / cur.sp,
      logisticsPctOfShgPrice: (cur.inbound + cur.outbound) / s.shgPrice,
      acMarkupMonth: cur.markup * units,
      acInboundSpendMonth: cur.inbound * units,
      acOutboundSpendMonth: cur.outbound * units,
      gmvMonth: cur.sp * units,
      kgMonth: s.weight * units,
      inboundBijnor: alloc.inboundBijnor,
      inboundLucknow: alloc.inboundLucknow,
      cheapestAc: alloc.cheapestAc,
      closerAc: alloc.closerAc,
      reallocSavingUnit: alloc.savingPerUnit,
      reallocSavingMonth: alloc.savingPerUnit * units,
      mislinked: alloc.savingPerUnit > 0,
      bestAc: best,
      spBOnline: spAt("Bijnor", "Online"),
      spBBulk: spAt("Bijnor", "Bulk"),
      spLOnline: spAt("Lucknow", "Online"),
      spLBulk: spAt("Lucknow", "Bulk"),
      onlineMinusBulkOutbound: outboundCost(s.weight, "Online", card, o.outMult) - outboundCost(s.weight, "Bulk", card, o.outMult),
      maxMarkupPctOnline: maxMk("Online"),
      maxMarkupPctBulk: maxMk("Bulk"),
      members: s.members,
      active: s.active,
      participation: s.active / s.members,
      inactive: s.members - s.active,
      shgIncomeMonth: income,
      incomePerActiveMonth: income / s.active,
      incomePerMemberMonthIfShared: income / s.members,
      shgProfitUnit: s.shgProfit,
    };
  });
}
