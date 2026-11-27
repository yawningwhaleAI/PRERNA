"use client";

import clsx from "clsx";
import { ArchetypeScatter } from "@/components/charts";
import { AssumptionTag, HowTo, Kpi, Note, PageHeader, Section, TableWrap, ToCollect } from "@/components/ui";
import { PASSTHROUGH_SHARES, VOLUME_KEPT } from "@/lib/engine";
import { inr, num, pct, signedInr } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function Inclusion() {
  const { state } = useStore();
  const m = useModel();
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
      <PageHeader title="Women's income" question="Are all SHG women earning, or only a few? Who is left out, and what would it take to include them?" />

      <HowTo
        steps={[
          <>The boxes give the big picture: how many members earn from their SHG&apos;s product, typical pay, and how unequal pay is.</>,
          <>The chart shows each SHG by <b>share of members earning</b> (left to right) and <b>pay per earning woman</b> (bottom to top). Craft SHGs pay well but employ few women; food SHGs employ many on low pay.</>,
          <>The table shows how many more women each SHG could bring in, and the <b>extra orders</b> that needs so nobody&apos;s pay is cut.</>,
        ]}
      >
        Pay per woman assumes each SHG shares its profit equally among the women who earn (case rule). Real payout records are needed to confirm.
      </HowTo>

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
        <Kpi label="SHG members" value={num(s.members)} sub={`${num(s.notEarning)} not earning from the product`} />
        <Kpi label="Women earning" value={num(s.earners)} sub={`${pct(s.participation)} of members`} />
        <Kpi label="Typical pay per earning woman" value={inr(s.medianIncomeEarner)} sub={`a month (median) · ranges ${inr(s.minIncomeEarner)}–${inr(s.maxIncomeEarner)}`} tag={<AssumptionTag title="Equal split within SHG (case rule 7)" />} />
        <Kpi label="Pay inequality, earners" value={s.giniEarners.toFixed(2)} sub="Gini: 0 = everyone equal, 1 = one woman earns all" />
        <Kpi label="Pay inequality, all members" value={s.giniAllMembers.toFixed(2)} sub="Gini, counting non-earners at ₹0" alert />
        <Kpi label="Earned by the top 20%" value={pct(s.topQuintileShare)} sub="of all earning women's income" />
        <Kpi label="Pay vs share earning" value={`r = ${s.correlationParticipationIncome.toFixed(2)}`} sub={`observed association across ${num(rows.length)} SHGs, not causation`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Section title="Each SHG: share of members earning vs pay per woman" note={`Dashed lines: half of members earning, and typical pay (${inr(s.medianIncomeEarner)}). Hover a dot for the SHG.`}>
          <ArchetypeScatter rows={rows} medianIncome={s.medianIncomeEarner} />
        </Section>
        <div>
          <Section title="By product group" note="Group is an analyst classification (not in the case).">
            <TableWrap>
              <table className="tbl">
                <thead><tr><th>Group</th><th className="r">Members</th><th className="r">Earning</th><th className="r">Share earning</th><th className="r">Pay per earning woman</th></tr></thead>
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
              <li><b className="text-orange">{s.shgsBelow50.length} SHGs where fewer than half the members earn:</b> {s.shgsBelow50.join(", ") || "none"}.</li>
              <li><b>{num(m.results.S0.summary.womenActiveAtRisk)} earning women</b> are in SHGs whose product will be priced above market if nothing changes; {inr(m.results.S0.summary.shgIncomeAtRisk)} a month at risk.</li>
              <li><b>{num(s.earnersBelowLakhpati)} of {num(s.earners)} earners</b> earn below the Lakhpati average ({inr(L.lakhpatiMonthly)}/month) from this product alone (Lakhpati is household income: indicative only).</li>
              <li><b>Training → earning:</b> <ToCollect>training records needed</ToCollect> A trained woman only counts once she is paid.</li>
            </ul>
          </Section>
        </div>
      </div>

      <Section
        title={`Aspiration: ${pct(L.participationTarget, 0)} of members earning in each SHG (agreed SHG by SHG, not a mandate)`}
        note={`SHGs are autonomous and UPSRLM cannot assign work. At today's output per woman, ${num(newWomen)} more women earning needs ${num(extraUnits)} extra units sold a month (${pct(extraUnits / unitsNow)} more than today), so nobody's pay is cut. Training alone is not enough: inclusion needs orders.`}
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th><th>District</th><th>Product</th><th>Group</th><th className="r">Members</th><th className="r">Earning</th><th className="r">Share earning</th>
                <th className="r">SHG income</th><th className="r">Per earning woman</th><th className="r">Per member if shared</th><th>Priced OK today?</th><th>Type</th>
                <th className="r">Target earning</th><th className="r">More women</th><th className="r">Extra units / month</th>
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

      <details className="mb-6 rounded border border-line bg-white px-3 py-2" data-testid="advanced-analysis">
        <summary className="cursor-pointer text-[13px] font-semibold text-navy">
          Advanced analysis: SHG price rise (headroom-for-inclusion) <span className="ml-1 rounded-sm bg-gray-100 px-1.5 py-0.5 text-[11px] font-semibold text-grey">not part of the recommendation</span>
        </summary>
        <p className="mt-2 text-[12px] text-grey">
          Kept for transparency only. The submission does not recommend raising prices: it would work against fair prices for buyers, and the gains go mostly to SHGs whose women already earn the most.
        </p>
        <div className="mt-3">
      <Section
        title="Can some SHGs raise their price and share the gain?"
        note={
          <>
            Some online products (recommended plan) sell more than {pct(L.headroomTrigger, 0)} below market. Their SHG could raise its price so the selling price is still {pct(L.headroomTargetSpPctMarket, 0)} of market
            <AssumptionTag />, and pass the extra to its women. Sales are assumed unchanged; this must be tested before doing it.
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>SHG</th><th>Product</th><th className="r">Selling price</th><th className="r">Market price</th><th className="r">Below market by</th><th className="r">New SHG price</th><th className="r">Rise</th><th className="r">Extra for women / month</th><th className="r">Extra per earning woman</th><th className="r">Pay per woman now</th><th className="r">Extra for warehouse</th></tr>
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
                <tr><td colSpan={7}>Total ({eligible.length} SHGs qualify)</td><td className="r tabular-nums">{inr(eligible.reduce((t, h) => t + h.extraShgIncomeMonth, 0))}</td><td colSpan={2} /><td className="r tabular-nums">{inr(eligible.reduce((t, h) => t + h.extraAcMarkupMonth, 0))}</td></tr>
              </tfoot>
            </table>
          </TableWrap>
          <div>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr><th>Share of the rise reaching women ↓ · sales kept →<AssumptionTag onDark /></th>{VOLUME_KEPT.map((k) => <th key={k} className="r">{pct(k, 0)}</th>)}</tr>
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
            <Note>Change in women&apos;s income per month for the qualifying SHGs: if only part of the rise reaches the women, or sales fall after the rise, the gain shrinks. Approve a rise only with a commitment to bring more members into earning, and only after a price test keeps sales steady: otherwise the gain goes to SHGs whose women already earn the most.</Note>
          </div>
        </div>
      </Section>
        </div>
      </details>
    </div>
  );
}
