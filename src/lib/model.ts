"use client";

import { useMemo } from "react";
import caseData from "@/data/case-data.json";
import {
  acPnl,
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
    const results = Object.fromEntries(
      (["S0", "S1", "S2", "S3"] as ScenarioId[]).map((id) => [id, evaluateScenario(id, data, L, state.acOverrides)]),
    ) as Record<ScenarioId, ReturnType<typeof evaluateScenario>>;
    const current = results[state.scenario];
    const opt = { edgeInclusive: L.edgeInclusive, inMult: 1 + L.inboundRateChange, volMult: 1 + L.volumeChange };
    const allocation = allocateAll(data.shgs, data.rateCard, opt);
    const priceOpts = { edgeInclusive: L.edgeInclusive, inMult: 1 + L.inboundRateChange, outMult: 1 + L.outboundRateChange };
    const channels = data.shgs.map((s) => {
      const ac = results.S3.plan[s.id]!.ac;
      return { shgId: s.id, ac, ...channelRule(s, ac, data.rateCard, priceOpts) };
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
    return {
      /** Products the plan moves from online to bulk vs bulk buyers confirmed in the order book. */
      bulkDemand: bulkDemandCheck(CASE.shgs, current.plan, committed, vol),
      bulkDemandS3: bulkDemandCheck(CASE.shgs, results.S3.plan, committed, vol),
      data,
      committed,
      results,
      current,
      allocation,
      channels,
      baseline: baseline(data, L),
      stress: stressTests(data, results.S3.plan, L),
      social: socialAnalysis(data, L),
      inclusionVolume: inclusionVolumeTest(data, L),
      headroom,
      grid: passthroughGrid(headroom),
      pnl,
      alerts: buildAlerts(data, current, L, state.capacityKg, opexEntered),
    };
  }, [state, opexRupees]);
}
