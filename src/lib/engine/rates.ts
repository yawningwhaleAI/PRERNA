import type { Channel, RateCard } from "./types";

export interface RateOptions {
  edgeInclusive?: boolean;
  /** Multiplier on inbound rates, e.g. 1.1 for +10%. */
  inMult?: number;
  /** Multiplier on outbound rates. */
  outMult?: number;
}

/** Python-compatible round(x, 9). */
const round9 = (x: number) => Math.round(x * 1e9) / 1e9;

/** ₹ per kg for a distance. 0 km uses the first band. Band edges go to the lower band when edgeInclusive. */
export function inboundRate(km: number, card: RateCard, edgeInclusive = true): number {
  for (const band of card.bands) {
    if (band.upToKm === null) return band.ratePerKg;
    if (km < band.upToKm || (edgeInclusive && km === band.upToKm)) return band.ratePerKg;
  }
  const last = card.bands[card.bands.length - 1];
  if (!last) throw new Error("Rate card has no bands");
  return last.ratePerKg;
}

export function inboundCost(weight: number, km: number, card: RateCard, opts: RateOptions = {}): number {
  return weight * inboundRate(km, card, opts.edgeInclusive ?? true) * (opts.inMult ?? 1);
}

/**
 * Per-unit outbound cost. Online: first kg per order + each extra kg or part (one unit = one order).
 * unitsPerParcel > 1 models a hamper (scenario only).
 */
export function outboundCost(
  weight: number,
  channel: Channel,
  card: RateCard,
  outMult = 1,
  unitsPerParcel = 1,
): number {
  if (channel === "Bulk") return card.bulkPerKg * weight * outMult;
  const parcelKg = weight * unitsPerParcel;
  const extra = Math.max(0, Math.ceil(round9(parcelKg - 1)));
  return ((card.onlineFirstKg + card.onlineExtraKg * extra) * outMult) / unitsPerParcel;
}
