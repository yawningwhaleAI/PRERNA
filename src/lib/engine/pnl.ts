import type { AcName } from "./types";
import type { AcSummary, ScenarioRow } from "./scenarios";

/** Operating-cost audit lines (final submission, slide 5). Collected monthly from Dec 2026. */
export const FIXED_COST_LINES = ["Rent", "Salaries", "Utilities"] as const;
export const VARIABLE_COST_LINES = ["Handling and packaging", "Stock losses and returns", "Marketplace fees"] as const;

/** Opex entries in ₹ per month; null = not yet collected. */
export interface AcOpex {
  variable: Record<string, number | null>;
  fixed: Record<string, number | null>;
}

export interface AcPnl {
  ac: AcName;
  shgs: number;
  units: number;
  kg: number;
  gmv: number;
  shgPayments: number;
  logistics: number;
  markup: number;
  markupSecure: number;
  secureUnits: number;
  variableEntered: boolean;
  variableCosts: number;
  contribution: number;
  fixedEntered: boolean;
  fixedCosts: number | null;
  operatingResult: number | null;
  breakEvenUnits: number | null;
  opexCoverage: number | null;
  staffYardstick: number;
}

/** Only the listed audit lines count (older saved keys are ignored). */
const total = (r: Record<string, number | null>, lines: readonly string[]) => lines.reduce<number>((a, k) => a + (r[k] ?? 0), 0);
const anyEntered = (r: Record<string, number | null>, lines: readonly string[]) => lines.some((k) => r[k] !== null && r[k] !== undefined);

/**
 * AC P&L for one AC under one scenario. Viability is built on SECURE markup (competitive products only).
 * Costs are not in the case: until they are entered, operating result and break-even show "opex needed".
 */
export function acPnl(ac: AcName, s: AcSummary, rows: ScenarioRow[], opex: AcOpex | undefined, minWage: number): AcPnl {
  const variable = opex?.variable ?? {};
  const fixed = opex?.fixed ?? {};
  const variableCosts = total(variable, VARIABLE_COST_LINES);
  const contribution = s.markupSecure - variableCosts;
  const fixedEntered = anyEntered(fixed, FIXED_COST_LINES);
  const fixedCosts = fixedEntered ? total(fixed, FIXED_COST_LINES) : null;
  const secureUnits = rows.filter((r) => r.ac === ac && r.competitive).reduce((a, r) => a + r.units, 0);
  const perUnit = secureUnits > 0 ? contribution / secureUnits : 0;
  return {
    ac,
    shgs: s.shgs,
    units: s.units,
    kg: s.kg,
    gmv: s.gmv,
    shgPayments: s.shgPayments,
    logistics: s.logistics,
    markup: s.markup,
    markupSecure: s.markupSecure,
    secureUnits,
    variableEntered: anyEntered(variable, VARIABLE_COST_LINES),
    variableCosts,
    contribution,
    fixedEntered,
    fixedCosts,
    operatingResult: fixedCosts === null ? null : contribution - fixedCosts,
    breakEvenUnits: fixedCosts === null ? null : perUnit > 0 ? fixedCosts / perUnit : Infinity,
    opexCoverage: fixedCosts === null || fixedCosts === 0 ? null : contribution / fixedCosts,
    staffYardstick: s.markupSecure / minWage,
  };
}

/** Working capital: AC pays SHGs on receipt and logistics on dispatch; cash comes back after `days`. */
export function workingCapital(shgPayments: number, logistics: number, days: number): number {
  return ((shgPayments + logistics) * days) / 30;
}
