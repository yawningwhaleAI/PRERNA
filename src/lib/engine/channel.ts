import { sellingPrice, type PriceOptions } from "./pricing";
import type { AcName, Channel, RateCard, ShgRecord } from "./types";

export type ChannelFlag = "ok" | "premium-or-turnaround";

export interface ChannelDecision {
  channel: Channel;
  flag: ChannelFlag;
  inbound: number;
  onlineOutbound: number;
  bulkOutbound: number;
  onlineSp: number;
  bulkSp: number;
  onlineWorks: boolean;
  bulkWorks: boolean;
  /** Highest markup (share of SHG price) that keeps SP at or below market. */
  maxMarkupOnline: number;
  maxMarkupBulk: number;
  courierPctOfShgPrice: number;
  /** What is left below market for a stockist's margin if sold in bulk. */
  stockistHeadroom: number;
}

/**
 * Channel rule at the proposed AC:
 * keep bulk if already bulk; else online if online SP ≤ market; else bulk if bulk SP ≤ market;
 * else online, flagged for premium positioning or turnaround.
 */
export function channelRule(shg: ShgRecord, ac: AcName, card: RateCard, opts: PriceOptions = {}): ChannelDecision {
  const online = sellingPrice(shg, ac, "Online", card, opts);
  const bulk = sellingPrice(shg, ac, "Bulk", card, opts);
  const onlineSp = online.sp;
  const bulkSp = bulk.sp;
  const onlineWorks = onlineSp <= shg.market;
  const bulkWorks = bulkSp <= shg.market;
  let channel: Channel;
  let flag: ChannelFlag = "ok";
  if (shg.channel === "Bulk") channel = "Bulk";
  else if (onlineWorks) channel = "Online";
  else if (bulkWorks) channel = "Bulk";
  else {
    channel = "Online";
    flag = "premium-or-turnaround";
  }
  return {
    channel,
    flag,
    inbound: online.inbound,
    onlineOutbound: online.outbound,
    bulkOutbound: bulk.outbound,
    onlineSp,
    bulkSp,
    onlineWorks,
    bulkWorks,
    maxMarkupOnline: (shg.market - shg.shgPrice - online.inbound - online.outbound) / shg.shgPrice,
    maxMarkupBulk: (shg.market - shg.shgPrice - bulk.inbound - bulk.outbound) / shg.shgPrice,
    courierPctOfShgPrice: online.outbound / shg.shgPrice,
    stockistHeadroom: (shg.market - bulkSp) / shg.market,
  };
}

/** S2 rule: at the current AC, switch online → bulk only if online fails and bulk passes. */
export function channelSwitchOnly(shg: ShgRecord, card: RateCard, opts: PriceOptions = {}): Channel {
  if (shg.channel !== "Online") return shg.channel;
  const online = sellingPrice(shg, shg.linkedAc, "Online", card, opts).sp;
  const bulk = sellingPrice(shg, shg.linkedAc, "Bulk", card, opts).sp;
  return online > shg.market && bulk <= shg.market ? "Bulk" : "Online";
}

export interface BulkDemandRow {
  shgId: string;
  product: string;
  /** Units a month that must find bulk buyers (today's online volume). */
  unitsNeeded: number;
  /** Units from validated buyer commitments (LoI, PO, delivered, repeat). */
  confirmed: number;
  gap: number;
}

/**
 * A channel switch is only real if bulk buyers exist. For every product the plan moves from online to bulk,
 * compare the volume that must find bulk buyers with the volume confirmed in the order book.
 */
export function bulkDemandCheck(
  shgs: ShgRecord[],
  plan: Record<string, { channel: Channel }>,
  committed: Map<string, number>,
  volMult = 1,
): BulkDemandRow[] {
  return shgs
    .filter((s) => s.channel === "Online" && plan[s.id]?.channel === "Bulk")
    .map((s) => {
      const unitsNeeded = s.units * volMult;
      const confirmed = committed.get(s.id) ?? 0;
      return { shgId: s.id, product: s.product, unitsNeeded, confirmed, gap: Math.max(0, unitsNeeded - confirmed) };
    });
}
