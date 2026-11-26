import type { AcName, CaseData, Levers } from "./types";
import type { ScenarioResult } from "./scenarios";
import { allocate } from "./allocation";

export type AlertSeverity = "high" | "medium" | "info";

export interface Alert {
  id: string;
  severity: AlertSeverity;
  type: "above-market" | "thin-headroom" | "capacity" | "opex-missing" | "band-edge";
  scope: string;
  message: string;
  value?: number;
}

/**
 * Alerts for the selected scenario: SP > market; headroom below the thin threshold;
 * AC capacity > 85% (once capacity is entered); opex missing; band-edge distances (±10 km).
 */
export function buildAlerts(
  data: CaseData,
  result: ScenarioResult,
  levers: Levers,
  capacityKg: Record<AcName, number | null>,
  opexEntered: Record<AcName, boolean>,
): Alert[] {
  const out: Alert[] = [];
  for (const r of result.rows) {
    if (!r.competitive)
      out.push({ id: `mkt-${r.shgId}`, severity: "high", type: "above-market", scope: `${r.shgId} ${r.product}`, message: `SP above market at ${r.ac} (${r.channel})`, value: r.sp - r.market });
    else if (r.headroomPct < levers.thinHeadroom)
      out.push({ id: `thin-${r.shgId}`, severity: "medium", type: "thin-headroom", scope: `${r.shgId} ${r.product}`, message: `Headroom below ${Math.round(levers.thinHeadroom * 100)}% of market`, value: r.headroomPct });
  }
  for (const ac of ["Bijnor", "Lucknow"] as const) {
    const cap = capacityKg[ac];
    const kg = result.summary.byAc[ac].kg;
    if (cap && cap > 0 && kg / cap > 0.85)
      out.push({ id: `cap-${ac}`, severity: kg > cap ? "high" : "medium", type: "capacity", scope: `${ac} AC`, message: "Capacity utilisation above 85%", value: kg / cap });
    if (!opexEntered[ac])
      out.push({ id: `opex-${ac}`, severity: "info", type: "opex-missing", scope: `${ac} AC`, message: "Fixed opex not entered: break-even cannot be computed" });
  }
  for (const s of data.shgs) {
    const a = allocate(s, data.rateCard, { edgeInclusive: levers.edgeInclusive });
    if (a.bandEdgeWarning)
      out.push({ id: `edge-${s.id}`, severity: "info", type: "band-edge", scope: `${s.id} ${s.district}`, message: `Distance within ±10 km of a band edge (Bijnor ${s.distBijnor} km, Lucknow ${s.distLucknow} km): verify road distance` });
  }
  return out;
}
