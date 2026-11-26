"use client";

import clsx from "clsx";
import { ArchetypeScatter } from "@/components/charts";
import { AssumptionTag, Kpi, Loading, Note, PageHeader, Section, TableWrap, ToCollect } from "@/components/ui";
import { PASSTHROUGH_SHARES, VOLUME_KEPT } from "@/lib/engine";
import { inr, num, pct, signedInr } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function Inclusion() {
  const { state, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const { rows, summary: s } = m.social;
  const vol = new Map(m.inclusionVolume.map((v) => [v.shgId, v]));
  const s0 = new Map(m.results.S0.rows.map((r) => [r.shgId, r]));
  const newWomen = m.inclusionVolume.reduce((t, v) => t + v.newWomen, 0);
  const extraUnits = m.inclusionVolume.reduce((t, v) => t + v.extraUnits, 0);
  const unitsNow = m.inclusionVolume.reduce((t, v) => t + v.unitsNow, 0);
  const eligible = m.headroom.filter((h) => h.eligible);
  const L = state.levers;

  return (
    <div>
      <PageHeader title="Inclusion" question="Are all SHG women benefiting, or only a few? Who is left behind, and what would it take to include them?" />

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="Members" value={num(s.members)} sub={`${num(s.notEarning)} not earning from the product`} />
        <Kpi label="Earning women" value={num(s.earners)} sub={`participation ${pct(s.participation)}`} />
        <Kpi label="Median income per earner" value={inr(s.medianIncomeEarner)} sub={`mean ${inr(s.meanIncomeEarner)} · range ${inr(s.minIncomeEarner)}–${inr(s.maxIncomeEarner)}`} tag={<AssumptionTag title="Equal split within SHG (case rule 7)" />} />
        <Kpi label="Gini, earners" value={s.giniEarners.toFixed(2)} sub="0 = equal, 1 = one person earns all" />
        <Kpi label="Gini, all members" value={s.giniAllMembers.toFixed(2)} sub="non-earners counted at ₹0" alert />
        <Kpi label="Top 20% share" value={pct(s.topQuintileShare)} sub="of earners' income" />
        <Kpi label="Participation vs pay" value={`r = ${s.correlationParticipationIncome.toFixed(2)}`} sub="better-paid SHGs employ fewer women" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Section title="SHG archetypes" note={`Participation × income per earning woman. Dashed lines: 50% participation and the median income per earner (${inr(s.medianIncomeEarner)}).`}>
          <ArchetypeScatter rows={rows} medianIncome={s.medianIncomeEarner} />
        </Section>
        <div>
          <Section title="By product group" note="Group is an analyst classification (not in the case).">
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Group</th><th className="r">Members</th><th className="r">Earners</th><th className="r">Participation</th><th className="r">Income per earner</th></tr></thead>
                <tbody>
                  {s.byGroup.map((g) => (
                    <tr key={g.group}><td>{g.group}</td><td className="r">{num(g.members)}</td><td className="r">{num(g.earners)}</td><td className="r">{pct(g.participation)}</td><td className="r">{inr(g.incomePerEarner)}</td></tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </Section>
          <Section title="Who needs action">
            <ul className="space-y-1.5 text-[13px]">
              <li><b className="text-orange">{s.shgsBelow50.length} SHGs below 50% participation:</b> {s.shgsBelow50.join(", ") || "none"}.</li>
              <li><b>{num(m.results.S0.summary.womenActiveAtRisk)} earning women</b> are in SHGs priced above market today (S0); {inr(m.results.S0.summary.shgIncomeAtRisk)} a month at risk.</li>
              <li><b>{num(s.earnersBelowLakhpati)} of {num(s.earners)} earners</b> earn below the Lakhpati average ({inr(L.lakhpatiMonthly)}/month) from this product alone (Lakhpati is household income: indicative only).</li>
              <li><b>Training → earning funnel:</b> <ToCollect>training records needed</ToCollect> Trained women are never counted as earning.</li>
            </ul>
          </Section>
        </div>
      </div>

      <Section
        title={`Participation by SHG and the inclusion volume test (target ${pct(L.participationTarget, 0)})`}
        note={`Reaching the target without diluting income per woman needs ${num(newWomen)} new earners and ${num(extraUnits)} extra units a month (${pct(extraUnits / unitsNow)} of today's volume). Inclusion needs orders, not only training.`}
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th><th>District</th><th>Product</th><th>Group</th><th className="r">Members</th><th className="r">Earning</th><th className="r">Participation</th>
                <th className="r">SHG income</th><th className="r">Per earner</th><th className="r">Per member if shared</th><th>Competitive (S0)</th><th>Archetype</th>
                <th className="r">Target earners</th><th className="r">New earners</th><th className="r">Extra units</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const v = vol.get(r.shgId)!;
                const comp = s0.get(r.shgId)!.competitive;
                return (
                  <tr key={r.shgId}>
                    <td className="font-semibold">{r.shgId}</td><td>{r.district}</td><td>{r.product}</td><td>{r.group}</td>
                    <td className="r">{num(r.members)}</td><td className="r">{num(r.active)}</td>
                    <td className={clsx("r", r.participation < 0.5 && "above-market")}>{pct(r.participation)}</td>
                    <td className="r tabular-nums">{inr(r.shgIncomeMonth)}</td><td className="r tabular-nums">{inr(r.incomePerEarner)}</td><td className="r tabular-nums">{inr(r.incomePerMemberIfShared)}</td>
                    <td className={clsx(!comp && "above-market")}>{comp ? "Yes" : "No"}</td><td>{r.archetype}</td>
                    <td className="r">{num(v.targetActive)}</td><td className="r">{num(v.newWomen)}</td><td className="r tabular-nums">{num(v.extraUnits)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4}>Total</td><td className="r">{num(s.members)}</td><td className="r">{num(s.earners)}</td><td className="r">{pct(s.participation)}</td>
                <td className="r tabular-nums">{inr(s.shgIncomeTotal)}</td><td className="r tabular-nums">{inr(s.meanIncomeEarner)}</td><td className="r tabular-nums">{inr(s.meanIncomeAllMembers)}</td>
                <td colSpan={2} /><td className="r">{num(m.inclusionVolume.reduce((t, v) => t + v.targetActive, 0))}</td><td className="r">{num(newWomen)}</td><td className="r tabular-nums">{num(extraUnits)}</td>
              </tr>
            </tfoot>
          </table>
        </TableWrap>
      </Section>

      <Section
        title="Headroom-for-inclusion"
        note={
          <>
            Where an online product (S3) sits more than {pct(L.headroomTrigger, 0)} below market, the SHG price may rise so SP lands at {pct(L.headroomTargetSpPctMarket, 0)} of market
            <AssumptionTag />. New SHG price = (target × market − inbound − outbound) ÷ 1.15. Volume held constant; price elasticity is unknown.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>SHG</th><th>Product</th><th className="r">S3 SP</th><th className="r">Market</th><th className="r">Headroom</th><th className="r">New SHG price</th><th className="r">Rise</th><th className="r">Extra SHG income</th><th className="r">Extra per earner</th><th className="r">Income per earner now</th><th className="r">Extra AC markup</th></tr>
              </thead>
              <tbody>
                {eligible.length === 0 && <tr><td colSpan={11}>No eligible products at these levers.</td></tr>}
                {eligible.map((h) => (
                  <tr key={h.shgId}>
                    <td className="font-semibold">{h.shgId}</td><td>{h.product}</td><td className="r tabular-nums">{inr(h.sp)}</td><td className="r tabular-nums">{inr(h.market)}</td><td className="r">{pct(h.headroomPct)}</td>
                    <td className="r tabular-nums">{inr(h.shgPriceNew, 2)}</td><td className="r tabular-nums">{inr(h.deltaPrice, 2)}</td><td className="r tabular-nums">{inr(h.extraShgIncomeMonth)}</td>
                    <td className="r tabular-nums">{inr(h.extraIncomePerActive)}</td><td className="r tabular-nums">{inr(h.baseIncomePerActive)}</td><td className="r tabular-nums">{inr(h.extraAcMarkupMonth)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr><td colSpan={7}>Total ({eligible.length} eligible)</td><td className="r tabular-nums">{inr(eligible.reduce((t, h) => t + h.extraShgIncomeMonth, 0))}</td><td colSpan={2} /><td className="r tabular-nums">{inr(eligible.reduce((t, h) => t + h.extraAcMarkupMonth, 0))}</td></tr>
              </tfoot>
            </table>
          </TableWrap>
          <div>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr><th>Share of rise to profit ↓ · volume kept →<AssumptionTag onDark /></th>{VOLUME_KEPT.map((k) => <th key={k} className="r">{pct(k, 0)}</th>)}</tr>
                </thead>
                <tbody>
                  {PASSTHROUGH_SHARES.map((sh) => (
                    <tr key={sh}>
                      <td className="font-semibold">{pct(sh, 0)}</td>
                      {VOLUME_KEPT.map((k) => {
                        const c = m.grid.find((g) => g.share === sh && g.kept === k)!;
                        return <td key={k} className={clsx("r tabular-nums", c.netChange < 0 && "above-market")}>{signedInr(c.netChange)}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <Note>Archetypes split at 50% participation and the median income per earner (analyst classification). Change in SHG income per month, eligible products only. Approve a price rise only with an inclusion compact (participation target, apprentice stipends) and only if price tests keep at least 90% of volume: gains otherwise go to SHGs whose earners already earn the most.</Note>
          </div>
        </div>
      </Section>
    </div>
  );
}
