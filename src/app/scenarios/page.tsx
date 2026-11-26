"use client";

import clsx from "clsx";
import { HowTo, Loading, Note, PageHeader, Section, TableWrap } from "@/components/ui";
import { SCENARIOS, type ScenarioSummary } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

type Row = [string, (s: ScenarioSummary, s0: ScenarioSummary) => string, boolean?];

const ROWS: Row[] = [
  ["Products priced at or below market", (s) => num(s.competitiveCount)],
  ["Products only just below market (thin margin)", (s) => num(s.thinHeadroom.length)],
  ["Warehouse income, all products", (s) => inr(s.acMarkupTotal)],
  ["Warehouse income at risk", (s) => inr(s.acMarkupAtRisk), true],
  ["Women's income at risk", (s) => inr(s.shgIncomeAtRisk), true],
  ["Earning women whose product is above market", (s) => num(s.womenActiveAtRisk), true],
  ["Transport cost (added to prices)", (s) => inr(s.logisticsOutlay)],
  ["Transport cost vs today", (s, s0) => pct(s.logisticsOutlay / s0.logisticsOutlay - 1)],
  ["Bijnor: SHGs linked", (s) => num(s.byAc.Bijnor.shgs)],
  ["Lucknow: SHGs linked", (s) => num(s.byAc.Lucknow.shgs)],
  ["Bijnor: warehouse income", (s) => inr(s.byAc.Bijnor.markup)],
  ["Lucknow: warehouse income", (s) => inr(s.byAc.Lucknow.markup)],
  ["Bijnor: safe income (products priced OK)", (s) => inr(s.byAc.Bijnor.markupSecure)],
  ["Lucknow: safe income (products priced OK)", (s) => inr(s.byAc.Lucknow.markupSecure)],
  ["Bijnor: transport cost", (s) => inr(s.byAc.Bijnor.logistics)],
  ["Lucknow: transport cost", (s) => inr(s.byAc.Lucknow.logistics)],
];

export default function Scenarios() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const s0 = m.results.S0.summary;
  const cur = m.current;
  return (
    <div>
      <PageHeader title="Compare plans" question="What does each plan do to prices, warehouse income and women's income?" />

      <HowTo
        steps={[
          <>Each column is one plan. Read across a row to see how a plan changes it. Click a column heading to make it the plan shown on every page.</>,
          <><b>Today</b> = no changes. <b>Fix links</b> = SHGs use the warehouse with cheaper transport. <b>Fix channels</b> = staples too expensive online are sold in bulk. <b>Fix both</b> = the recommended plan.</>,
          <>&quot;What if things get worse?&quot; tests whether the recommended plan still holds if transport rates rise or sales fall.</>,
        ]}
      />

      <Section
        title="The four plans side by side (₹ per month)"
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Measure</th>
                {SCENARIOS.map((sc) => (
                  <th key={sc.id} className={clsx("r cursor-pointer", state.scenario === sc.id && "!bg-orange")} onClick={() => set("scenario", sc.id)}>
                    {sc.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, f, risk]) => (
                <tr key={label}>
                  <td>{label}</td>
                  {SCENARIOS.map((sc) => {
                    const s = m.results[sc.id].summary;
                    const v = f(s, s0);
                    const isRisk = risk && (label.startsWith("Earning") ? s.womenActiveAtRisk > 0 : (label.includes("Warehouse") ? s.acMarkupAtRisk : s.shgIncomeAtRisk) > 0);
                    return (
                      <td key={sc.id} className={clsx("r tabular-nums", isRisk && "above-market", state.scenario === sc.id && "font-semibold")}>
                        {v}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Note>
          Transport is passed on to buyers, so total warehouse income is the same in every plan. What changes is how much of it is <b>safe</b>: income from products priced above market is at risk because they may not sell.
          Fix both prices every product at or below market, but only works if the staples find bulk buyers (see Prices &amp; channels) and shops accept the margin.
        </Note>
      </Section>

      <Section
        title="What if things get worse? (recommended plan)"
        note="Keeps the Fix both decisions as they are, then raises transport rates or cuts sales on top of the current assumptions."
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>If…</th>
                <th className="r">Products priced OK</th>
                <th>Pushed above market</th>
                <th className="r">Warehouse income</th>
                <th className="r">Warehouse income at risk</th>
                <th className="r">Women&apos;s income at risk</th>
                <th className="r">Transport cost</th>
              </tr>
            </thead>
            <tbody>
              {m.stress.map((t) => (
                <tr key={t.label}>
                  <td>{t.label}</td>
                  <td className="r tabular-nums">{num(t.summary.competitiveCount)}</td>
                  <td className="whitespace-normal">{t.summary.uncompetitive.join(", ") || "–"}</td>
                  <td className="r tabular-nums">{inr(t.summary.acMarkupTotal)}</td>
                  <td className={clsx("r tabular-nums", t.summary.acMarkupAtRisk > 0 && "above-market")}>{inr(t.summary.acMarkupAtRisk)}</td>
                  <td className={clsx("r tabular-nums", t.summary.shgIncomeAtRisk > 0 && "above-market")}>{inr(t.summary.shgIncomeAtRisk)}</td>
                  <td className="r tabular-nums">{inr(t.summary.logisticsOutlay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Note>Prices depend on transport rates; warehouse income depends on volume. A sales drop keeps prices OK but cuts warehouse income.</Note>
      </Section>

      <Section title={`Every product in the plan: ${SCENARIOS.find((x) => x.id === cur.id)!.name}`} note="Orange = above market.">
        <TableWrap maxH={560}>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th>Sold</th>
                <th className="r">SHG price</th>
                <th className="r">Transport in</th>
                <th className="r">Warehouse margin</th>
                <th className="r">Delivery</th>
                <th className="r">Selling price</th>
                <th className="r">Market price</th>
                <th className="r">Below market by</th>
                <th className="r">Units</th>
                <th className="r">Warehouse earns / month</th>
                <th className="r">Women earn / month</th>
                <th className="r">Transport / month</th>
                <th className="r">Earning women</th>
              </tr>
            </thead>
            <tbody>
              {cur.rows.map((r) => (
                <tr key={r.shgId}>
                  <td className="font-semibold">{r.shgId}</td>
                  <td>{r.product}</td>
                  <td>{r.ac}</td>
                  <td>{r.channel}</td>
                  <td className="r tabular-nums">{inr(r.shgPrice)}</td>
                  <td className="r tabular-nums">{inr(r.inbound, 1)}</td>
                  <td className="r tabular-nums">{inr(r.markup, 1)}</td>
                  <td className="r tabular-nums">{inr(r.outbound, 1)}</td>
                  <td className={clsx("r tabular-nums", !r.competitive && "above-market")}>{inr(r.sp, 1)}</td>
                  <td className="r tabular-nums">{inr(r.market)}</td>
                  <td className={clsx("r tabular-nums", !r.competitive && "above-market")}>{pct(r.headroomPct)}</td>
                  <td className="r tabular-nums">{num(r.units)}</td>
                  <td className="r tabular-nums">{inr(r.markupRev)}</td>
                  <td className="r tabular-nums">{inr(r.shgIncome)}</td>
                  <td className="r tabular-nums">{inr(r.inboundSpend + r.outboundSpend)}</td>
                  <td className="r tabular-nums">{num(r.active)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={11}>Total · {cur.summary.competitiveCount} priced OK</td>
                <td className="r tabular-nums">{num(cur.rows.reduce((t, r) => t + r.units, 0))}</td>
                <td className="r tabular-nums">{inr(cur.summary.acMarkupTotal)}</td>
                <td className="r tabular-nums">{inr(cur.summary.shgIncomeTotal)}</td>
                <td className="r tabular-nums">{inr(cur.summary.logisticsOutlay)}</td>
                <td className="r tabular-nums">{num(cur.rows.reduce((t, r) => t + r.active, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </TableWrap>
      </Section>
    </div>
  );
}
