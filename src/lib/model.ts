"use client";

import { useMemo } from "react";
import caseData from "@/data/case-data.json";
import {
  DEMAND_PRESETS,
  aboveMarketAtZeroMarkup,
  acTransfer,
  acPnl,
  evaluateBlanketGated,
  evaluateHybrid,
  exposureBySeverity,
  relinkSaving,
  securedShareFromOrders,
  sellingPrice,
  allocateAll,
  baseline,
  buildAlerts,
  bulkDemandCheck,
  channelRule,
  evaluateScenario,
  headroomSharing,
  inclusionVolumeTest,
  passthroughGrid,
  socialAnalysis,
  stressTests,
  type AcName,
  type CaseData,
  type ScenarioId,
} from "@/lib/engine";
import { useStore, VALIDATED_STAGES, type AppState } from "@/lib/store";

export const CASE = caseData as CaseData;
export const ATTR = new Map(CASE.attributes.map((a) => [a.shgId, a]));
export const SHG = new Map(CASE.shgs.map((s) => [s.id, s]));

/** Units per SKU from validated commitments (LoI or later); boxes are expanded into their contents. */
export function committedUnits(state: AppState): Map<string, number> {
  const m = new Map<string, number>();
  for (const c of state.commitments) {
    if (!VALIDATED_STAGES.includes(c.stage)) continue;
    if (c.kind === "sku") m.set(c.refId, (m.get(c.refId) ?? 0) + c.quantity);
    else {
      const box = state.boxes.find((b) => b.id === c.refId);
      for (const it of box?.items ?? []) m.set(it.shgId, (m.get(it.shgId) ?? 0) + c.quantity * it.qty);
    }
  }
  return m;
}

/** All engine outputs for the current state. Every number on screen comes from here. */
export function useModel() {
  const { state, opexRupees } = useStore();
  return useMemo(() => {
    const committed = committedUnits(state);
    const data: CaseData =
      state.useCommitted && committed.size
        ? { ...CASE, shgs: CASE.shgs.map((s) => (committed.has(s.id) ? { ...s, units: committed.get(s.id)! } : s)) }
        : CASE;
    const L = state.levers;
    const hybrid = evaluateHybrid(data, L, state.acOverrides, committed);
    const results = {
      ...Object.fromEntries((["S0", "S1", "S2", "S3"] as ScenarioId[]).map((id) => [id, evaluateScenario(id, data, L, state.acOverrides)])),
      SH: hybrid,
    } as unknown as Record<ScenarioId, ReturnType<typeof evaluateScenario>>;
    const ceiling = evaluateHybrid(data, { ...L, packAcceptance: 1, bulkSecured: 1 }, state.acOverrides);
    const current = results[state.scenario];
    const opt = { edgeInclusive: L.edgeInclusive, inMult: 1 + L.inboundRateChange, volMult: 1 + L.volumeChange };
    const allocation = allocateAll(data.shgs, data.rateCard, opt);
    const priceOpts = { edgeInclusive: L.edgeInclusive, inMult: 1 + L.inboundRateChange, outMult: 1 + L.outboundRateChange };
    const channels = data.shgs.map((s) => {
      const ac = results.S3.plan[s.id]!.ac;
      const h = results.SH.plan[s.id]!;
      const pack = h.unitsPerParcel ?? 1;
      return {
        shgId: s.id,
        ac,
        ...channelRule(s, ac, data.rateCard, priceOpts),
        /** Recommended (hybrid) treatment. */
        hybrid: h,
        packSize: pack,
        packSp: pack > 1 ? sellingPrice(s, h.ac, "Online", data.rateCard, { ...priceOpts, unitsPerParcel: pack }).sp : null,
      };
    });
    const opex = { Bijnor: opexRupees("Bijnor"), Lucknow: opexRupees("Lucknow") };
    const pnl = (id: ScenarioId, ac: AcName) =>
      acPnl(ac, results[id].summary.byAc[ac], results[id].rows, opex[ac], L.minWageYardstick);
    const opexEntered = {
      Bijnor: Object.values(opex.Bijnor.fixed).some((v) => v !== null),
      Lucknow: Object.values(opex.Lucknow.fixed).some((v) => v !== null),
    };
    const headroom = headroomSharing(data, results.S3.rows, L);
    const vol = 1 + L.volumeChange;
    const presets = DEMAND_PRESETS.map((p) => ({ ...p, result: evaluateHybrid(data, { ...L, packAcceptance: p.packAcceptance, bulkSecured: p.bulkSecured }, state.acOverrides) }));
    const blanket = [0, 0.25, 0.5, 0.75, 1].map((c) => ({ secured: c, result: evaluateBlanketGated(data, L, c, state.acOverrides) }));
    return {
      /** Recommended hybrid with the demand gate applied (current pack acceptance and secured bulk). */
      hybrid,
      /** Share of needs-buyer bulk volume covered by confirmed orders in the order book. */
      autoSecured: securedShareFromOrders(data, hybrid.gatedIds, committed, vol),
      ceiling,
      presets,
      blanket,
      /** Floor: re-link only (S1). */
      floor: results.S1.summary,
      freight: relinkSaving(data, L),
      exposure: exposureBySeverity(results.S0.rows, 0.05),
      zeroMarkup: aboveMarketAtZeroMarkup(results.S1.rows),
      transfer: acTransfer(results.S0.summary, results.S1.summary),
      bulkDemandHybrid: bulkDemandCheck(CASE.shgs, results.SH.plan, committed, vol),
      /** Products the plan moves from online to bulk vs bulk buyers confirmed in the order book. */
      bulkDemand: bulkDemandCheck(CASE.shgs, current.plan, committed, vol),
      bulkDemandS3: bulkDemandCheck(CASE.shgs, results.S3.plan, committed, vol),
      bulkDemandBlanket: bulkDemandCheck(CASE.shgs, results.S3.plan, committed, vol),
      data,
      committed,
      results,
      current,
      allocation,
      channels,
      baseline: baseline(data, L),
      stress: stressTests(data, results.SH.plan, L),
      social: socialAnalysis(data, L),
      inclusionVolume: inclusionVolumeTest(data, L),
      headroom,
      grid: passthroughGrid(headroom),
      pnl,
      alerts: buildAlerts(data, current, L, state.capacityKg, opexEntered),
    };
  }, [state, opexRupees]);
}
