"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_LEVERS, type AcName, type AcOpex, type BoxItemInput, type Levers, type ScenarioId } from "@/lib/engine";

export const BUYER_TYPES = ["Corporate", "Government / GeM", "Hotel", "Prerna store", "Canteen"] as const;
export const STAGES = ["Lead", "Sample", "LoI", "PO", "Delivered", "Repeat"] as const;
export type BuyerType = (typeof BUYER_TYPES)[number];
export type Stage = (typeof STAGES)[number];
/** Stages that count as validated demand. */
export const VALIDATED_STAGES: Stage[] = ["LoI", "PO", "Delivered", "Repeat"];

export interface Buyer {
  id: string;
  name: string;
  type: BuyerType;
  owner: string;
  stage: Stage;
}

export interface Box {
  id: string;
  name: string;
  tier: "Essentials" | "Signature";
  items: BoxItemInput[];
  /** Seeded from the analysis (illustrative), not a real order. */
  illustrative?: boolean;
}

export interface Commitment {
  id: string;
  buyerId: string;
  kind: "box" | "sku";
  refId: string;
  /** Boxes (kind = box) or units (kind = sku). */
  quantity: number;
  deliveryMonth: string;
  stage: Stage;
  leadTimeMonths: number | null;
}

/** Money inputs are stored in integer paise. */
interface OpexPaise {
  variable: Record<string, number | null>;
  fixed: Record<string, number | null>;
}

export const PILOT_STATUSES = ["Not started", "On track", "At risk", "Passed", "Failed"] as const;
export type PilotStatus = (typeof PILOT_STATUSES)[number];
export type GateResult = "Pass" | "Fail" | "Not decided";

export interface AppState {
  scenario: ScenarioId;
  levers: Levers;
  acOverrides: Record<string, AcName>;
  opex: Record<AcName, OpexPaise>;
  capacityKg: Record<AcName, number | null>;
  buyers: Buyer[];
  boxes: Box[];
  commitments: Commitment[];
  useCommitted: boolean;
  pilotStatus: Record<string, PilotStatus>;
  gateResult: Record<string, GateResult>;
}

/** The three boxes from the analysis (Corporate Boxes sheet). Illustrative, labelled as such. */
export const SEED_BOXES: Box[] = [
  { id: "box-essentials", name: "Essentials Festive Box", tier: "Essentials", illustrative: true, items: ["SHG-01", "SHG-02", "SHG-04", "SHG-05"].map((shgId) => ({ shgId, qty: 1 })) },
  { id: "box-craft", name: "Signature Craft Box", tier: "Signature", illustrative: true, items: ["SHG-02", "SHG-03", "SHG-07"].map((shgId) => ({ shgId, qty: 1 })) },
  { id: "box-purvanchal", name: "Signature Purvanchal Box", tier: "Signature", illustrative: true, items: ["SHG-14", "SHG-17", "SHG-20"].map((shgId) => ({ shgId, qty: 1 })) },
];

const emptyOpex = (): OpexPaise => ({ variable: {}, fixed: {} });

export const INITIAL_STATE: AppState = {
  scenario: "SH",
  levers: DEFAULT_LEVERS,
  acOverrides: {},
  opex: { Bijnor: emptyOpex(), Lucknow: emptyOpex() },
  capacityKg: { Bijnor: null, Lucknow: null },
  buyers: [],
  boxes: SEED_BOXES,
  commitments: [],
  useCommitted: false,
  pilotStatus: {},
  gateResult: {},
};

const KEY = "prerna360:v2";
const OLD_KEYS = ["prerna360:v1"];

interface Ctx {
  state: AppState;
  hydrated: boolean;
  set: <K extends keyof AppState>(key: K, value: AppState[K] | ((prev: AppState[K]) => AppState[K])) => void;
  setLever: <K extends keyof Levers>(key: K, value: Levers[K]) => void;
  resetLevers: () => void;
  resetAll: () => void;
  opexRupees: (ac: AcName) => AcOpex;
}

const StoreContext = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      let raw = window.localStorage.getItem(KEY);
      let migrated = false;
      if (!raw) {
        // v1 → v2: keep the user's inputs, but do not keep S3 ("all staples to bulk") as the plan in view.
        for (const k of OLD_KEYS) {
          const old = window.localStorage.getItem(k);
          if (old) {
            raw = old;
            migrated = true;
            break;
          }
        }
      }
      if (raw) {
        const saved = JSON.parse(raw) as Partial<AppState>;
        if (migrated && (saved.scenario === "S3" || !saved.scenario)) saved.scenario = "SH";
        setState((s) => ({ ...s, ...saved, levers: { ...DEFAULT_LEVERS, ...(saved.levers ?? {}) } }));
      }
    } catch {
      /* storage unavailable: run with defaults */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const set = useCallback<Ctx["set"]>((key, value) => {
    setState((s) => ({
      ...s,
      [key]: typeof value === "function" ? (value as (p: AppState[typeof key]) => AppState[typeof key])(s[key]) : value,
    }));
  }, []);

  const ctx = useMemo<Ctx>(
    () => ({
      state,
      hydrated,
      set,
      setLever: (key, value) => setState((s) => ({ ...s, levers: { ...s.levers, [key]: value } })),
      resetLevers: () => setState((s) => ({ ...s, levers: DEFAULT_LEVERS })),
      resetAll: () => setState(INITIAL_STATE),
      opexRupees: (ac) => {
        const o = state.opex[ac];
        const conv = (r: Record<string, number | null>) =>
          Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v === null ? null : v / 100]));
        return { variable: conv(o.variable), fixed: conv(o.fixed) };
      },
    }),
    [state, hydrated, set],
  );

  return <StoreContext.Provider value={ctx}>{children}</StoreContext.Provider>;
}

export function useStore(): Ctx {
  const c = useContext(StoreContext);
  if (!c) throw new Error("useStore outside StoreProvider");
  return c;
}

export const newId = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
