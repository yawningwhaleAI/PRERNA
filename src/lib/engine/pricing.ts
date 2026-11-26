import { inboundCost, outboundCost } from "./rates";
import type { AcName, Channel, RateCard, ShgRecord } from "./types";

export interface PriceOptions {
  markup?: number;
  inMult?: number;
  outMult?: number;
  unitsPerParcel?: number;
  edgeInclusive?: boolean;
}

export interface PriceBuild {
  shgPrice: number;
  inbound: number;
  markup: number;
  outbound: number;
  sp: number;
}

export function distanceTo(shg: ShgRecord, ac: AcName): number {
  return ac === "Bijnor" ? shg.distBijnor : shg.distLucknow;
}

/** SP = SHG price + inbound + AC markup + outbound. */
export function sellingPrice(
  shg: ShgRecord,
  ac: AcName,
  channel: Channel,
  card: RateCard,
  opts: PriceOptions = {},
): PriceBuild {
  const inb = inboundCost(shg.weight, distanceTo(shg, ac), card, {
    edgeInclusive: opts.edgeInclusive ?? true,
    inMult: opts.inMult ?? 1,
  });
  const mk = (opts.markup ?? card.markup) * shg.shgPrice;
  const outb = outboundCost(shg.weight, channel, card, opts.outMult ?? 1, opts.unitsPerParcel ?? 1);
  return { shgPrice: shg.shgPrice, inbound: inb, markup: mk, outbound: outb, sp: shg.shgPrice + inb + mk + outb };
}

export const isCompetitive = (sp: number, market: number) => sp <= market;
export const headroomPct = (sp: number, market: number) => (market - sp) / market;
