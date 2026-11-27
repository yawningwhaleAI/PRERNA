"use client";

import Link from "next/link";
import clsx from "clsx";
import { HeadroomChart } from "@/components/charts";
import { HowTo, Kpi, PageHeader, Pill, Section, TableWrap, ToCollect } from "@/components/ui";
import { DemandPanel } from "@/components/demand-panel";
import { BulkComparison, ExposureSplit, HeadlineCards } from "@/components/headline";
import { SCENARIOS } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function Overview() {
  const { state } = useStore();
  const m = useModel();
  const s = m.current.summary;
  const s0 = m.results.S0.summary;
  const plan = SCENARIOS.find((x) => x.id === state.scenario)!;
  const total = m.current.rows.length;
  const social = m.social.summary;
  const acs = ["Bijnor", "Lucknow"] as const;
  const pnl = { Bijnor: m.pnl(state.scenario, "Bijnor"), Lucknow: m.pnl(state.scenario, "Lucknow") };
  const sevOrder = { high: 0, medium: 1, info: 2 };
  const alerts = [...m.alerts].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
  const changes = m.data.shgs
    .map((sh) => ({ sh, a: m.current.plan[sh.id]! }))
    .filter(({ sh, a }) => a.ac !== sh.linkedAc || a.channel !== sh.channel || (a.unitsPerParcel ?? 1) > 1);
  const bulkCheck = new Map(m.bulkDemand.map((b) => [b.shgId, b]));
  const isHybrid = state.scenario === "SH";

  return (
    <div>
      <PageHeader title="Overview" question="Is the plan working? Which products are priced above market, and what needs attention?">
        {state.useCommitted && <Pill tone="orange">Using confirmed orders as volume</Pill>}
      </PageHeader>

      <HowTo
        steps={[
          <>The three cards are the plan in one line: the <b>floor</b> you get from re-linking alone, the freight saved, and the <b>ceiling</b> once buyers commit.</>,
          <>Use the <b>Plan</b> buttons to compare. <b>Hybrid</b> is the recommendation; <b>Today</b> shows the problem.</>,
          <>In the hybrid, move the <b>pack acceptance</b> and <b>bulk secured</b> inputs (or record real orders) to see how many products end up priced OK.</>,
          <>The <b>action list</b> shows exactly which SHGs move warehouse and which products change channel in this plan.</>,
          <>Work through the <b>alerts</b> list at the bottom each month.</>,
        ]}
      />

      <div className="mb-4">
        <HeadlineCards />
      </div>
      <div className="mb-5">
        <ExposureSplit />
      </div>

      {isHybrid && (
        <Section title="Recommended plan: how many products end up priced OK depends on buyers" note="Inputs are assumptions until orders arrive. Presets: no bulk buyer yet, an illustrative base case, and all buyers commit.">
          <DemandPanel compact />
        </Section>
      )}

      <p className="mb-4 max-w-4xl rounded border-l-4 border-navy bg-tint px-3 py-2 text-[14px]">
        In <b>{plan.name}</b>, <b className={clsx(s.competitiveCount < total && "text-orange")}>{num(s.competitiveCount)} of {num(total)}</b> products are priced at or below market.{" "}
        {s.acMarkupAtRisk > 0 ? (
          <>
            <b className="text-orange">{inr(s.acMarkupAtRisk)}</b> of AC gross markup and <b className="text-orange">{inr(s.shgIncomeAtRisk)}</b> of women&apos;s income ({num(s.womenActiveAtRisk)} women) are at risk each month.
          </>
        ) : (
          <>No AC markup or women&apos;s income is at risk on price.</>
        )}{" "}
        Transport costs {inr(s.logisticsOutlay)} a month ({pct(s.logisticsOutlay / s0.logisticsOutlay - 1)} vs today).
      </p>

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 xl:grid-cols-6">
        <Kpi label="Products priced OK" value={<span data-testid="kpi-competitive">{s.competitiveCount}</span>} sub={`of ${total} · today ${s0.competitiveCount} · floor ${m.floor.competitiveCount} · ceiling ${m.ceiling.summary.competitiveCount}`} alert={s.competitiveCount < total} />
        <Kpi label="AC gross markup at risk" value={inr(s.acMarkupAtRisk)} sub={`of ${inr(s.acMarkupTotal)} a month · not profit`} alert={s.acMarkupAtRisk > 0} />
        <Kpi label="Women's income at risk" value={inr(s.shgIncomeAtRisk)} sub={`${num(s.womenActiveAtRisk)} earning women affected`} alert={s.shgIncomeAtRisk > 0} />
        <Kpi label="Transport cost" value={inr(s.logisticsOutlay)} sub={`today: ${inr(s0.logisticsOutlay)} · added to prices`} />
        <Kpi label="Secure gross markup, Bijnor" value={inr(s.byAc.Bijnor.markupSecure)} sub={`before AC costs · today ${inr(s0.byAc.Bijnor.markupSecure)}`} />
        <Kpi label="Secure gross markup, Lucknow" value={inr(s.byAc.Lucknow.markupSecure)} sub={`before AC costs · today ${inr(s0.byAc.Lucknow.markupSecure)}`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title={`Action list: what changes in this plan (${changes.length})`} note="Compared with today. Nothing changes in the Today plan.">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>SHG</th><th>Product</th><th>Warehouse</th><th>Sold</th><th>Why</th></tr>
              </thead>
              <tbody>
                {changes.length === 0 && <tr><td colSpan={5}>No changes: this is today&apos;s setup.</td></tr>}
                {changes.map(({ sh, a }) => {
                  const row = m.current.rows.find((r) => r.shgId === sh.id)!;
                  const moved = a.ac !== sh.linkedAc;
                  const switched = a.channel !== sh.channel;
                  const pack = a.unitsPerParcel ?? 1;
                  const b = bulkCheck.get(sh.id);
                  const ch = m.channels.find((x) => x.shgId === sh.id);
                  return (
                    <tr key={sh.id}>
                      <td className="font-semibold">{sh.id}</td>
                      <td>{sh.product}</td>
                      <td>{moved ? <b>{sh.linkedAc} → {a.ac}</b> : a.ac}</td>
                      <td>{switched ? <b>{sh.channel} → {a.channel}</b> : pack > 1 ? <b>Online {pack}-pack</b> : a.channel}</td>
                      <td className="min-w-[220px] whitespace-normal text-[12px]">
                        {moved && "Cheaper transport band. "}
                        {pack > 1 && `${pack}-pack shares one courier parcel: ${inr(row.sp, 2)} per unit vs market ${inr(row.market)}. `}
                        {switched && a.needsBuyer && `Bulk (${inr(ch?.bulkSp ?? 0)} vs market ${inr(row.market)}) only once a buyer commits: ${num(Math.min(b?.confirmed ?? 0, b?.unitsNeeded ?? 0))} of ${num(b?.unitsNeeded ?? 0)} units confirmed. Until then it sells online at ${inr(ch?.onlineSp ?? 0)}.`}
                        {switched && !a.needsBuyer && `Too expensive online; in bulk it sells at ${inr(row.sp)} vs market ${inr(row.market)}. Needs bulk buyers.`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          <div className="mt-2">
            <BulkComparison />
          </div>
        </Section>

        <Section title="Bijnor vs Lucknow" note="Gross markup is the AC's only income, before any AC cost: it is not profit. Whether an AC covers its costs is unknown until costs are collected.">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>Per month</th>{acs.map((a) => <th key={a} className="r">{a}</th>)}</tr>
              </thead>
              <tbody>
                {([
                  ["SHGs linked", (a: (typeof acs)[number]) => num(s.byAc[a].shgs)],
                  ["Units sold", (a: (typeof acs)[number]) => num(s.byAc[a].units)],
                  ["Kg handled", (a: (typeof acs)[number]) => num(s.byAc[a].kg)],
                  ["Sales value", (a: (typeof acs)[number]) => inr(s.byAc[a].gmv)],
                  [`AC gross markup (${pct(m.data.rateCard.markup, 0)} of SHG price)`, (a: (typeof acs)[number]) => inr(s.byAc[a].markup)],
                  ["Secure gross markup (products priced OK)", (a: (typeof acs)[number]) => inr(s.byAc[a].markupSecure)],
                  ["Transport cost (passed to buyers)", (a: (typeof acs)[number]) => inr(s.byAc[a].logistics)],
                ] as const).map(([label, f]) => (
                  <tr key={label}>
                    <td>{label}</td>
                    {acs.map((a) => <td key={a} className="r tabular-nums">{f(a)}</td>)}
                  </tr>
                ))}
                <tr>
                  <td>Covers its monthly costs?</td>
                  {acs.map((a) => (
                    <td key={a} className="r">{pnl[a].opexCoverage === null ? <ToCollect>costs needed</ToCollect> : `${pnl[a].opexCoverage.toFixed(2)}× costs`}</td>
                  ))}
                </tr>
                <tr>
                  <td>How full is the warehouse?</td>
                  {acs.map((a) => {
                    const cap = state.capacityKg[a];
                    return <td key={a} className="r">{cap ? pct(s.byAc[a].kg / cap) : <ToCollect>capacity needed</ToCollect>}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </TableWrap>
          <p className="mt-1.5 text-[11.5px] text-grey">Enter costs and capacity under <Link className="text-navy underline" href="/ac-pnl">Warehouse finances</Link>.</p>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="How far each product is below (or above) market" note="Blue: cheaper than market by this much. Orange: more expensive than market, likely to struggle to sell.">
          <HeadroomChart rows={m.current.rows.map((r) => ({ label: `${r.shgId.replace("SHG-", "")} ${r.product}`, headroom: r.headroomPct, sp: r.sp, market: r.market }))} />
        </Section>

        <Section title={`Alerts to work through (${alerts.length})`} note="High: priced above market. Medium: only just below market. Info: data to collect or check.">
          <TableWrap maxH={560}>
            <table className="tbl">
              <thead>
                <tr><th>Priority</th><th>Where</th><th>What</th><th className="r">By how much</th></tr>
              </thead>
              <tbody>
                {alerts.map((a) => (
                  <tr key={a.id}>
                    <td><Pill tone={a.severity === "high" ? "orange" : a.severity === "medium" ? "navy" : "grey"}>{a.severity}</Pill></td>
                    <td>{a.scope}</td>
                    <td className="min-w-[240px] whitespace-normal">{a.message}</td>
                    <td className={clsx("r tabular-nums", a.type === "above-market" && "above-market")}>
                      {a.value === undefined ? "" : a.type === "above-market" ? `+${inr(a.value)}` : pct(a.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>
      </div>
      <p className="text-[11px] text-grey">Participation across all SHGs: {pct(social.participation)} of {num(social.members)} members earn.</p>
    </div>
  );
}
