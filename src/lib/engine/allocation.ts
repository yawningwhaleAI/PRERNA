import { inboundCost, inboundRate } from "./rates";
import type { AcName, RateCard, ShgRecord } from "./types";

export interface AllocationRow {
  shgId: string;
  district: string;
  linkedAc: AcName;
  kmBijnor: number;
  kmLucknow: number;
  rateBijnor: number;
  rateLucknow: number;
  inboundBijnor: number;
  inboundLucknow: number;
  cheapestAc: AcName | "Tie";
  proposedAc: AcName;
  relink: boolean;
  savingPerUnit: number;
  units: number;
  savingPerMonth: number;
  closerAc: AcName;
  /** Closer AC differs from the proposed AC but sits in the same band (proximity without savings). */
  closerSameBand: boolean;
  /** Distance within ±10 km of a band edge at either AC. */
  bandEdgeWarning: boolean;
}

export interface AllocationOptions {
  edgeInclusive?: boolean;
  inMult?: number;
  volMult?: number;
}

/** Hub rule: link each SHG to the AC with the lower inbound band; on a tie keep the current link. */
export function allocate(shg: ShgRecord, card: RateCard, opts: AllocationOptions = {}): AllocationRow {
  const ro = { edgeInclusive: opts.edgeInclusive ?? true, inMult: opts.inMult ?? 1 };
  const inbB = inboundCost(shg.weight, shg.distBijnor, card, ro);
  const inbL = inboundCost(shg.weight, shg.distLucknow, card, ro);
  const cheapestAc: AcName | "Tie" = inbB < inbL ? "Bijnor" : inbL < inbB ? "Lucknow" : "Tie";
  const proposedAc: AcName = cheapestAc === "Tie" ? shg.linkedAc : cheapestAc;
  const current = shg.linkedAc === "Bijnor" ? inbB : inbL;
  const savingPerUnit = Math.max(0, current - Math.min(inbB, inbL));
  const units = shg.units * (opts.volMult ?? 1);
  const closerAc: AcName = shg.distBijnor < shg.distLucknow ? "Bijnor" : "Lucknow";
  const edges = card.bands.map((b) => b.upToKm).filter((x): x is number => x !== null);
  const nearEdge = (km: number) => edges.some((e) => Math.abs(km - e) <= 10);
  return {
    shgId: shg.id,
    district: shg.district,
    linkedAc: shg.linkedAc,
    kmBijnor: shg.distBijnor,
    kmLucknow: shg.distLucknow,
    rateBijnor: inboundRate(shg.distBijnor, card, ro.edgeInclusive) * ro.inMult,
    rateLucknow: inboundRate(shg.distLucknow, card, ro.edgeInclusive) * ro.inMult,
    inboundBijnor: inbB,
    inboundLucknow: inbL,
    cheapestAc,
    proposedAc,
    relink: proposedAc !== shg.linkedAc,
    savingPerUnit,
    units,
    savingPerMonth: savingPerUnit * units,
    closerAc,
    closerSameBand: closerAc !== proposedAc && inbB === inbL,
    bandEdgeWarning: nearEdge(shg.distBijnor) || nearEdge(shg.distLucknow),
  };
}

export function allocateAll(shgs: ShgRecord[], card: RateCard, opts: AllocationOptions = {}): AllocationRow[] {
  return shgs.map((s) => allocate(s, card, opts));
}

export interface AcVolume {
  ac: AcName;
  shgs: number;
  units: number;
  kg: number;
}

export function acVolumes(shgs: ShgRecord[], acOf: (s: ShgRecord) => AcName, volMult = 1): AcVolume[] {
  return (["Bijnor", "Lucknow"] as const).map((ac) => {
    const mine = shgs.filter((s) => acOf(s) === ac);
    return {
      ac,
      shgs: mine.length,
      units: mine.reduce((a, s) => a + s.units * volMult, 0),
      kg: mine.reduce((a, s) => a + s.weight * s.units * volMult, 0),
    };
  });
}
