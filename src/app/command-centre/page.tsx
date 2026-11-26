"use client";

import Link from "next/link";
import clsx from "clsx";
import { HeadroomChart } from "@/components/charts";
import { Kpi, Loading, PageHeader, Pill, Section, TableWrap, ToCollect } from "@/components/ui";
import { SCENARIOS } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function CommandCentre() {
  const { state, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const s = m.current.summary;
  const s0 = m.results.S0.summary;
  const sc = SCENARIOS.find((x) => x.id === state.scenario)!;
  const total = m.current.rows.length;
  const social = m.social.summary;
  const acs = ["Bijnor", "Lucknow"] as const;
  const pnl = { Bijnor: m.pnl(state.scenario, "Bijnor"), Lucknow: m.pnl(state.scenario, "Lucknow") };
  const sevOrder = { high: 0, medium: 1, info: 2 };
  const alerts = [...m.alerts].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  return (
    <div>
      <PageHeader title="Command Centre" question={`${sc.short}: ${sc.label}. Are products competitive, is each AC viable, and whose income is at risk?`}>
        {state.useCommitted && <Pill tone="orange">Committed volume in use</Pill>}
      </PageHeader>

      <div className="mb-6 grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
        <Kpi
          label="Products competitive"
          value={<span data-testid="kpi-competitive">{s.competitiveCount}</span>}
          sub={`of ${total} at or below market · S0: ${s0.competitiveCount}`}
          alert={s.competitiveCount < total}
        />
        <Kpi label="AC markup at risk" value={inr(s.acMarkupAtRisk)} sub={`${pct(s.acMarkupAtRisk / s.acMarkupTotal)} of ${inr(s.acMarkupTotal)}`} alert={s.acMarkupAtRisk > 0} />
        <Kpi label="Women's income at risk" value={inr(s.shgIncomeAtRisk)} sub={`${num(s.womenActiveAtRisk)} earning women in uncompetitive SHGs`} alert={s.shgIncomeAtRisk > 0} />
        <Kpi label="Logistics outlay" value={inr(s.logisticsOutlay)} sub={`${pct(s.logisticsOutlay / s0.logisticsOutlay - 1)} vs S0 · passed through`} />
        <Kpi label="Secure markup, Bijnor" value={inr(s.byAc.Bijnor.markupSecure)} sub={`S0: ${inr(s0.byAc.Bijnor.markupSecure)}`} />
        <Kpi label="Secure markup, Lucknow" value={inr(s.byAc.Lucknow.markupSecure)} sub={`S0: ${inr(s0.byAc.Lucknow.markupSecure)}`} />
        <Kpi label="Participation" value={pct(social.participation)} sub={`${num(social.earners)} of ${num(social.members)} members earn`} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <Section title="Headroom to market by product" note="Headroom = (market − SP) ÷ market at the scenario's AC and channel. Orange bars are priced above market and count as 'at risk'.">
          <HeadroomChart
            rows={m.current.rows.map((r) => ({ label: `${r.shgId.replace("SHG-", "")} ${r.product}`, headroom: r.headroomPct, sp: r.sp, market: r.market }))}
          />
        </Section>

        <div>
          <Section title="AC comparison" note="Secure markup counts only products at or below market: the basis for viability. Opex and capacity are not in the case.">
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>₹ per month</th>
                    {acs.map((a) => (
                      <th key={a} className="r">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Linked SHGs", (a: (typeof acs)[number]) => num(s.byAc[a].shgs)],
                    ["Units sold", (a: (typeof acs)[number]) => num(s.byAc[a].units)],
                    ["kg handled", (a: (typeof acs)[number]) => num(s.byAc[a].kg)],
                    ["GMV at selling price", (a: (typeof acs)[number]) => inr(s.byAc[a].gmv)],
                    ["AC markup, all products", (a: (typeof acs)[number]) => inr(s.byAc[a].markup)],
                    ["AC markup, secure", (a: (typeof acs)[number]) => inr(s.byAc[a].markupSecure)],
                    ["Logistics outlay", (a: (typeof acs)[number]) => inr(s.byAc[a].logistics)],
                  ].map(([label, f]) => (
                    <tr key={label as string}>
                      <td>{label as string}</td>
                      {acs.map((a) => (
                        <td key={a} className="r tabular-nums">{(f as (a: (typeof acs)[number]) => string)(a)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td>Opex coverage (contribution ÷ fixed)</td>
                    {acs.map((a) => (
                      <td key={a} className="r">{pnl[a].opexCoverage === null ? <ToCollect>opex needed</ToCollect> : `${pnl[a].opexCoverage.toFixed(2)}×`}</td>
                    ))}
                  </tr>
                  <tr>
                    <td>Capacity utilisation (kg)</td>
                    {acs.map((a) => {
                      const cap = state.capacityKg[a];
                      return <td key={a} className="r">{cap ? pct(s.byAc[a].kg / cap) : <ToCollect>capacity needed</ToCollect>}</td>;
                    })}
                  </tr>
                </tbody>
              </table>
            </TableWrap>
            <p className="mt-1.5 text-[11.5px] text-grey">Enter opex and capacity on the <Link className="text-navy underline" href="/ac-pnl">AC P&amp;L</Link> page.</p>
          </Section>

          <Section title={`Alerts (${alerts.length})`}>
            <TableWrap maxH={320}>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Scope</th>
                    <th>Alert</th>
                    <th className="r">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {alerts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <Pill tone={a.severity === "high" ? "orange" : a.severity === "medium" ? "navy" : "grey"}>{a.severity}</Pill>
                      </td>
                      <td>{a.scope}</td>
                      <td className="whitespace-normal">{a.message}</td>
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
      </div>
    </div>
  );
}
