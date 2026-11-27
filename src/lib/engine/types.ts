/** Core types for the Prerna 360 calculation engine. Pure data; no I/O. */

export const ACS = ["Bijnor", "Lucknow"] as const;
export type AcName = (typeof ACS)[number];
export type Channel = "Online" | "Bulk";

/** One row of the case 'SHG Data' sheet, unchanged. Money in rupees. */
export interface ShgRecord {
  id: string;
  district: string;
  members: number;
  active: number;
  distBijnor: number;
  distLucknow: number;
  linkedAc: AcName;
  product: string;
  weight: number;
  shgPrice: number;
  shgProfit: number;
  units: number;
  channel: Channel;
  market: number;
}

/** Analyst classification (not in the case). Kept separate from case data. */
export interface ProductAttribute {
  shgId: string;
  product: string;
  group: "Food & other" | "Craft & textile";
  brandTier: "Essentials" | "Signature";
  category: string;
  odopGi: string;
}

export interface RateBand {
  /** Upper limit in km; null = no upper limit. */
  upToKm: number | null;
  ratePerKg: number;
}

export interface RateCard {
  version: number;
  label: string;
  bands: RateBand[];
  onlineFirstKg: number;
  onlineExtraKg: number;
  bulkPerKg: number;
  markup: number;
}

export interface CaseData {
  source: { dataset: string; datasetSha256: string; attributes: string; note: string };
  shgs: ShgRecord[];
  rateCard: RateCard;
  attributes: ProductAttribute[];
}

/** Analyst levers. Defaults (levers.ts) reproduce the reference outputs. */
export interface Levers {
  edgeInclusive: boolean;
  inboundRateChange: number;
  outboundRateChange: number;
  volumeChange: number;
  packagingPerBox: number;
  boxesPerOrder: number;
  headroomTrigger: number;
  headroomTargetSpPctMarket: number;
  thinHeadroom: number;
  participationTarget: number;
  prernaStores: number;
  minWageYardstick: number;
  lakhpatiMonthly: number;
  /** Hybrid plan: share of multi-pack volume buyers accept (0..1). Assumption. */
  packAcceptance: number;
  /** Hybrid plan: share of needs-buyer bulk volume with a buyer commitment (0..1), set by hand. The order book can raise it. */
  bulkSecured: number;
}

/** Demand-backed hybrid configuration (final submission). */
export interface HybridConfig {
  /** Units per online multi-pack, by SHG. */
  packs: Record<string, number>;
  /** Products that move to institutional bulk only once a buyer commits. */
  needsBuyer: string[];
  pilotShgs: string[];
}

export type ScenarioId = "S0" | "S1" | "S2" | "S3" | "SH";

export interface Assignment {
  ac: AcName;
  channel: Channel;
  /** Units per online parcel (hamper or multi-pack; 1 otherwise). */
  unitsPerParcel?: number;
  /** Hybrid plan: this bulk move only counts once a buyer commits. */
  needsBuyer?: boolean;
}

export type Plan = Record<string, Assignment>;
