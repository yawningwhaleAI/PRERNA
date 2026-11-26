import { sellingPrice, type PriceOptions } from "./pricing";
import type { AcName, Channel, RateCard, ShgRecord } from "./types";

export type ChannelFlag = "ok" | "premium-or-turnaround";

export interface ChannelDecision {
  channel: Channel;
  flag: ChannelFlag;
  onlineSp: number;
  bulkSp: number;
  onlineWorks: boolean;
  bulkWorks: boolean;
}

/**
 * Channel rule at the proposed AC:
 * keep bulk if already bulk; else online if online SP ≤ market; else bulk if bulk SP ≤ market;
 * else online, flagged for premium positioning or turnaround.
 */
export function channelRule(shg: ShgRecord, ac: AcName, card: RateCard, opts: PriceOptions = {}): ChannelDecision {
  const onlineSp = sellingPrice(shg, ac, "Online", card, opts).sp;
  const bulkSp = sellingPrice(shg, ac, "Bulk", card, opts).sp;
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
  return { channel, flag, onlineSp, bulkSp, onlineWorks, bulkWorks };
}

/** S2 rule: at the current AC, switch online → bulk only if online fails and bulk passes. */
export function channelSwitchOnly(shg: ShgRecord, card: RateCard, opts: PriceOptions = {}): Channel {
  if (shg.channel !== "Online") return shg.channel;
  const online = sellingPrice(shg, shg.linkedAc, "Online", card, opts).sp;
  const bulk = sellingPrice(shg, shg.linkedAc, "Bulk", card, opts).sp;
  return online > shg.market && bulk <= shg.market ? "Bulk" : "Online";
}
