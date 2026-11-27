"use client";

import clsx from "clsx";
import { HowTo, Kpi, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { acVolumes, type AcName } from "@/lib/engine";
import { inr, num, signedPct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function WarehouseLinks() {
  const { state, set } = useStore();
  const m = useModel();
  const plan = m.results.S1.plan; // recommended warehouse per SHG, including any manual choice
  const vol = 1 + state.levers.volumeChange;
  const before = acVolumes(m.data.shgs, (s) => s.linkedAc, vol);
  const after = acVolumes(m.data.shgs, (s) => plan[s.id]!.ac, vol);
  const rows = m.allocation.map((a) => {
    const chosen = plan[a.shgId]!.ac;
    const inbAt = (ac: AcName) => (ac === "Bijnor" ? a.inboundBijnor : a.inboundLucknow);
    const savingUnit = inbAt(a.linkedAc) - inbAt(chosen);
    return { ...a, chosen, manual: state.acOverrides[a.shgId] !== undefined, savingUnit, savingMonth: savingUnit * a.units };
  });
  const moves = rows.filter((r) => r.chosen !== r.linkedAc);
  const saving = rows.reduce((t, r) => t + r.savingMonth, 0);
  const choose = (id: string, ac: AcName, recommended: AcName) =>
    set("acOverrides", (o) => {
      const n = { ...o };
      if (ac === recommended) delete n[id];
      else n[id] = ac;
      return n;
    });
  const manualCount = Object.keys(state.acOverrides).length;

  return (
    <div>
      <PageHeader title="Warehouse links" question="Which warehouse should each SHG send its goods to?">
        {manualCount > 0 && <button className="btn" onClick={() => set("acOverrides", {})}>Undo my changes ({manualCount})</button>}
      </PageHeader>

      <HowTo
        steps={[
          <>Transport to the warehouse is charged by <b>distance band</b> (per kg), not per kilometre. Each SHG should use the warehouse in the <b>cheaper band</b>.</>,
          <>The <b>Recommended</b> column applies that rule. If both warehouses cost the same, the SHG <b>stays where it is</b> (no disruption for no saving).</>,
          <>Want to test a different choice? Change <b>Your choice</b> for any SHG. Every page (prices, plans, finances) updates. Use <b>Undo my changes</b> to go back.</>,
        ]}
      />

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4">
        <Kpi label="SHGs that should move" value={num(moves.length)} sub={moves.map((r) => r.shgId.replace("SHG-", "")).join(", ") || "none"} />
        <Kpi label="Transport saved" value={inr(saving)} sub="per month, vs today's links" alert={saving < 0} />
        {after.map((a, i) => (
          <Kpi
            key={a.ac}
            label={`${a.ac} after the moves`}
            value={`${num(a.shgs)} SHGs`}
            sub={`${num(a.units)} units (${signedPct(a.units / before[i]!.units - 1)}) · ${num(a.kg)} kg (${signedPct(a.kg / before[i]!.kg - 1)}) vs today`}
          />
        ))}
      </div>

      <Section title="Each SHG: transport cost per unit at each warehouse">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>District</th>
                <th>Today</th>
                <th className="r">Via Bijnor</th>
                <th className="r">Via Lucknow</th>
                <th>Recommended</th>
                <th>Your choice</th>
                <th className="r">Saved / unit</th>
                <th className="r">Units / month</th>
                <th className="r">Saved / month</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.shgId}>
                  <td className="font-semibold">{r.shgId}</td>
                  <td>{r.district}</td>
                  <td>{r.linkedAc}</td>
                  <td className={clsx("r tabular-nums", r.proposedAc === "Bijnor" && "font-semibold")}>
                    {inr(r.inboundBijnor, r.inboundBijnor % 1 ? 1 : 0)} <div className="text-[10.5px] text-grey">{num(r.kmBijnor)} km · {inr(r.rateBijnor, r.rateBijnor % 1 ? 1 : 0)}/kg</div>
                  </td>
                  <td className={clsx("r tabular-nums", r.proposedAc === "Lucknow" && "font-semibold")}>
                    {inr(r.inboundLucknow, r.inboundLucknow % 1 ? 1 : 0)} <div className="text-[10.5px] text-grey">{num(r.kmLucknow)} km · {inr(r.rateLucknow, r.rateLucknow % 1 ? 1 : 0)}/kg</div>
                  </td>
                  <td>{r.proposedAc}{r.cheapestAc === "Tie" && <div className="text-[10.5px] text-grey">same cost, stays</div>}</td>
                  <td>
                    <select
                      aria-label={`Your choice of warehouse for ${r.shgId}`}
                      className={clsx("field py-0.5", r.manual && "border-orange font-semibold text-orange")}
                      value={r.chosen}
                      onChange={(e) => choose(r.shgId, e.target.value as AcName, r.proposedAc)}
                    >
                      <option>Bijnor</option>
                      <option>Lucknow</option>
                    </select>
                  </td>
                  <td className={clsx("r tabular-nums", r.savingUnit < 0 && "above-market")}>{inr(r.savingUnit, r.savingUnit % 1 ? 1 : 0)}</td>
                  <td className="r tabular-nums">{num(r.units)}</td>
                  <td className={clsx("r tabular-nums", r.savingMonth < 0 && "above-market")}>{inr(r.savingMonth)}</td>
                  <td className="min-w-[150px] space-y-0.5 whitespace-normal [&>span]:mr-1">
                    {r.chosen !== r.linkedAc && <Pill>Move</Pill>}
                    {r.manual && <Pill tone="orange">Your change</Pill>}
                    {r.closerSameBand && <Pill tone="grey">Closer, but same cost</Pill>}
                    {r.bandEdgeWarning && <Pill tone="grey">Check road distance</Pill>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={8}>Total ({moves.length} SHGs move)</td>
                <td className="r tabular-nums">{num(rows.reduce((t, r) => t + r.units, 0))}</td>
                <td className="r tabular-nums">{inr(saving)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </TableWrap>
        <Note>
          &quot;Closer, but same cost&quot;: the Jhansi SHGs are nearer to Lucknow but pay the same band rate to either warehouse, so moving them saves nothing.
          &quot;Check road distance&quot;: the distance is within 10 km of a band boundary, so the real road distance decides the rate.
          Confirm Lucknow has room before moving SHGs: its volume rises sharply (see below).
        </Note>
      </Section>

      <Section title="Volume at each warehouse, today vs after the moves">
        <TableWrap>
          <table className="tbl max-w-4xl">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th className="r">SHGs today</th>
                <th className="r">SHGs after</th>
                <th className="r">Units today</th>
                <th className="r">Units after</th>
                <th className="r">Kg today</th>
                <th className="r">Kg after</th>
                <th className="r">Change in kg</th>
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
                    <td className="r tabular-nums">{num(b.kg)}</td>
                    <td className="r tabular-nums">{num(a.kg)}</td>
                    <td className="r tabular-nums">{signedPct(a.kg / b.kg - 1)}</td>
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
