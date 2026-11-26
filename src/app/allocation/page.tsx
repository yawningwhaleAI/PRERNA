"use client";

import clsx from "clsx";
import { Kpi, Loading, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { acVolumes, type AcName } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { CASE, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function Allocation() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const plan = m.results.S1.plan; // hub rule + what-if overrides
  const vol = 1 + state.levers.volumeChange;
  const before = acVolumes(m.data.shgs, (s) => s.linkedAc, vol);
  const after = acVolumes(m.data.shgs, (s) => plan[s.id]!.ac, vol);
  const rows = m.allocation.map((a) => {
    const chosen = plan[a.shgId]!.ac;
    const inbAt = (ac: AcName) => (ac === "Bijnor" ? a.inboundBijnor : a.inboundLucknow);
    const savingUnit = inbAt(a.linkedAc) - inbAt(chosen);
    return { ...a, chosen, overridden: state.acOverrides[a.shgId] !== undefined, savingUnit, savingMonth: savingUnit * a.units };
  });
  const relinks = rows.filter((r) => r.chosen !== r.linkedAc);
  const saving = rows.reduce((t, r) => t + r.savingMonth, 0);
  const setOverride = (id: string, ac: AcName, hubAc: AcName) =>
    set("acOverrides", (o) => {
      const n = { ...o };
      if (ac === hubAc) delete n[id];
      else n[id] = ac;
      return n;
    });

  return (
    <div>
      <PageHeader title="Allocation" question="Is each SHG linked to the right AC? Decided on tariff bands, not kilometres.">
        {Object.keys(state.acOverrides).length > 0 && (
          <button className="btn" onClick={() => set("acOverrides", {})}>Clear what-if overrides ({Object.keys(state.acOverrides).length})</button>
        )}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi label="SHGs re-linked" value={num(relinks.length)} sub={relinks.map((r) => r.shgId.replace("SHG-", "")).join(", ") || "none"} />
        <Kpi label="Inbound saving" value={inr(saving)} sub="per month vs today's links" alert={saving < 0} />
        {after.map((a, i) => (
          <Kpi
            key={a.ac}
            label={`${a.ac} after re-linking`}
            value={`${num(a.shgs)} SHGs`}
            sub={`${num(a.units)} units (${pct(a.units / before[i]!.units - 1, 0)}) · ${num(a.kg)} kg (${pct(a.kg / before[i]!.kg - 1, 0)})`}
          />
        ))}
      </div>

      <Section
        title="SHG-to-AC allocation"
        note="Hub rule: link each SHG to the AC with the lower inbound band; on a tie keep the current link. Use 'What-if AC' to override any SHG: the override flows into S1 and S3 on every screen."
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>District</th>
                <th>Linked now</th>
                <th className="r">km Bijnor</th>
                <th className="r">km Lucknow</th>
                <th className="r">₹/kg Bijnor</th>
                <th className="r">₹/kg Lucknow</th>
                <th className="r">Inbound Bijnor</th>
                <th className="r">Inbound Lucknow</th>
                <th>Cheapest</th>
                <th>Hub rule</th>
                <th>What-if AC</th>
                <th className="r">Saving / unit</th>
                <th className="r">Units</th>
                <th className="r">Saving / month</th>
                <th>Flags</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.shgId}>
                  <td className="font-semibold">{r.shgId}</td>
                  <td>{r.district}</td>
                  <td>{r.linkedAc}</td>
                  <td className="r tabular-nums">{num(r.kmBijnor)}</td>
                  <td className="r tabular-nums">{num(r.kmLucknow)}</td>
                  <td className="r tabular-nums">{inr(r.rateBijnor, r.rateBijnor % 1 ? 1 : 0)}</td>
                  <td className="r tabular-nums">{inr(r.rateLucknow, r.rateLucknow % 1 ? 1 : 0)}</td>
                  <td className="r tabular-nums">{inr(r.inboundBijnor, 1)}</td>
                  <td className="r tabular-nums">{inr(r.inboundLucknow, 1)}</td>
                  <td>{r.cheapestAc}</td>
                  <td>{r.proposedAc}</td>
                  <td>
                    <select
                      aria-label={`What-if AC for ${r.shgId}`}
                      className={clsx("field py-0.5", r.overridden && "border-orange font-semibold text-orange")}
                      value={r.chosen}
                      onChange={(e) => setOverride(r.shgId, e.target.value as AcName, r.proposedAc)}
                    >
                      <option>Bijnor</option>
                      <option>Lucknow</option>
                    </select>
                  </td>
                  <td className={clsx("r tabular-nums", r.savingUnit < 0 && "above-market")}>{inr(r.savingUnit, 1)}</td>
                  <td className="r tabular-nums">{num(r.units)}</td>
                  <td className={clsx("r tabular-nums", r.savingMonth < 0 && "above-market")}>{inr(r.savingMonth)}</td>
                  <td className="space-x-1">
                    {r.chosen !== r.linkedAc && <Pill>Re-link</Pill>}
                    {r.overridden && <Pill tone="orange">What-if</Pill>}
                    {r.closerSameBand && <Pill tone="grey">Closer AC, same band</Pill>}
                    {r.bandEdgeWarning && <Pill tone="grey">Band edge ±10 km</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={12}>Total ({relinks.length} re-linked)</td>
                <td />
                <td className="r tabular-nums">{num(rows.reduce((t, r) => t + r.units, 0))}</td>
                <td className="r tabular-nums">{inr(saving)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableWrap>
        <Note>
          Proximity is not savings: an SHG closer to the other AC but in the same band (Jhansi) saves nothing by moving, so the tie rule keeps it where it is.
          Lucknow capacity is not in the case: confirm it before re-linking ({CASE.shgs.length} SHGs in scope).
        </Note>
      </Section>

      <Section title="Volume at each AC, before and after">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>AC</th>
                <th className="r">SHGs now</th>
                <th className="r">SHGs after</th>
                <th className="r">Units now</th>
                <th className="r">Units after</th>
                <th className="r">Change</th>
                <th className="r">kg now</th>
                <th className="r">kg after</th>
                <th className="r">Change</th>
              </tr>
            </thead>
            <tbody>
              {before.map((b, i) => {
                const a = after[i]!;
                return (
                  <tr key={b.ac}>
                    <td className="font-semibold">{b.ac}</td>
                    <td className="r">{num(b.shgs)}</td>
                    <td className="r">{num(a.shgs)}</td>
                    <td className="r tabular-nums">{num(b.units)}</td>
                    <td className="r tabular-nums">{num(a.units)}</td>
                    <td className="r tabular-nums">{pct(a.units / b.units - 1)}</td>
                    <td className="r tabular-nums">{num(b.kg)}</td>
                    <td className="r tabular-nums">{num(a.kg)}</td>
                    <td className="r tabular-nums">{pct(a.kg / b.kg - 1)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Section>
    </div>
  );
}
