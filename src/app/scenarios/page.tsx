"use client";

import clsx from "clsx";
import { Loading, Note, PageHeader, Section, TableWrap } from "@/components/ui";
import { SCENARIOS, type ScenarioSummary } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

type Row = [string, (s: ScenarioSummary, s0: ScenarioSummary) => string, boolean?];

const ROWS: Row[] = [
  ["Products at or below market (of 20)", (s) => num(s.competitiveCount)],
  ["Products within thin headroom of market", (s) => num(s.thinHeadroom.length)],
  ["AC markup, all products", (s) => inr(s.acMarkupTotal)],
  ["AC markup at risk", (s) => inr(s.acMarkupAtRisk), true],
  ["SHG income at risk", (s) => inr(s.shgIncomeAtRisk), true],
  ["Earning women in uncompetitive SHGs", (s) => num(s.womenActiveAtRisk), true],
  ["Logistics outlay", (s) => inr(s.logisticsOutlay)],
  ["Change in logistics vs S0", (s, s0) => pct(s.logisticsOutlay / s0.logisticsOutlay - 1)],
  ["Bijnor: linked SHGs", (s) => num(s.byAc.Bijnor.shgs)],
  ["Lucknow: linked SHGs", (s) => num(s.byAc.Lucknow.shgs)],
  ["Bijnor: AC markup", (s) => inr(s.byAc.Bijnor.markup)],
  ["Lucknow: AC markup", (s) => inr(s.byAc.Lucknow.markup)],
  ["Bijnor: secure markup (competitive only)", (s) => inr(s.byAc.Bijnor.markupSecure)],
  ["Lucknow: secure markup (competitive only)", (s) => inr(s.byAc.Lucknow.markupSecure)],
  ["Bijnor: logistics outlay", (s) => inr(s.byAc.Bijnor.logistics)],
  ["Lucknow: logistics outlay", (s) => inr(s.byAc.Lucknow.logistics)],
];

export default function Scenarios() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const s0 = m.results.S0.summary;
  const cur = m.current;
  return (
    <div>
      <PageHeader title="Scenarios" question="What does each operating model do to prices, AC income and women's income?" />

      <Section
        title="Scenario summary (₹ per month)"
        note="S0 today's links and channels with logistics charged · S1 re-link only · S2 channel switch at current AC · S3 re-link plus channel (recommended core). Click a column to select it."
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Measure</th>
                {SCENARIOS.map((sc) => (
                  <th key={sc.id} className={clsx("r cursor-pointer", state.scenario === sc.id && "!bg-orange")} onClick={() => set("scenario", sc.id)}>
                    {sc.short}
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
                    const isRisk = risk && (label.startsWith("Earning") ? s.womenActiveAtRisk > 0 : (label.includes("markup") ? s.acMarkupAtRisk : s.shgIncomeAtRisk) > 0);
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
          Logistics is a pass-through, so total AC markup does not change between scenarios. The AC&apos;s risk is volume: markup on products priced above market counts as at risk.
          S3 makes all products competitive on price only if the staples keep their volume in bulk (unvalidated) and stockists accept the margin.
        </Note>
      </Section>

      <Section
        title="Stress tests on S3"
        note="Stress tests keep the S3 plan fixed (links and channels already decided) and shock logistics rates or volume on top of the current levers."
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Test</th>
                <th className="r">Products at or below market</th>
                <th>Now above market</th>
                <th className="r">AC markup, all</th>
                <th className="r">AC markup at risk</th>
                <th className="r">SHG income at risk</th>
                <th className="r">Logistics outlay</th>
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
        <Note>Competitiveness is price-driven, viability is volume-driven: a 20% volume fall keeps prices competitive but lowers AC markup.</Note>
      </Section>

      <Section title={`${cur.id} product detail`} note="Every product in the selected scenario. Above-market values in orange.">
        <TableWrap maxH={560}>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>Product</th>
                <th>AC</th>
                <th>Channel</th>
                <th className="r">SHG price</th>
                <th className="r">Inbound</th>
                <th className="r">Markup</th>
                <th className="r">Outbound</th>
                <th className="r">SP</th>
                <th className="r">Market</th>
                <th className="r">Headroom</th>
                <th className="r">Units</th>
                <th className="r">AC markup / month</th>
                <th className="r">SHG income / month</th>
                <th className="r">Logistics / month</th>
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
                <td colSpan={11}>Total · {cur.summary.competitiveCount} competitive</td>
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
