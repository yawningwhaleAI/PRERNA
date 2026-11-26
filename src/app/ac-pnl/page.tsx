"use client";

import clsx from "clsx";
import { HowTo, Loading, Note, PageHeader, Section, TableWrap, ToCollect } from "@/components/ui";
import { FIXED_COST_LINES, VARIABLE_COST_LINES, workingCapital, type AcName, type AcPnl } from "@/lib/engine";
import { inr, num, pct, toPaise } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

const ACS: AcName[] = ["Bijnor", "Lucknow"];

export default function AcPnlPage() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const cols: { key: string; p: AcPnl }[] = [];
  for (const sc of ["S0", "S3"] as const) for (const ac of ACS) cols.push({ key: `${ac}, ${sc === "S0" ? "today" : "recommended"}`, p: m.pnl(sc, ac) });

  const setCost = (ac: AcName, kind: "variable" | "fixed", line: string, raw: string) =>
    set("opex", (o) => ({
      ...o,
      [ac]: { ...o[ac], [kind]: { ...o[ac][kind], [line]: raw === "" ? null : toPaise(Math.max(0, Number(raw) || 0)) } },
    }));
  const costValue = (ac: AcName, kind: "variable" | "fixed", line: string) => {
    const v = state.opex[ac][kind][line];
    return v === null || v === undefined ? "" : String(v / 100);
  };

  const row = (label: string, f: (p: AcPnl) => React.ReactNode, cls?: string) => (
    <tr className={cls}>
      <td>{label}</td>
      {cols.map((c) => <td key={c.key} className="r tabular-nums">{f(c.p)}</td>)}
    </tr>
  );

  const wc = (["S0", "S3"] as const).map((sc) => {
    const s = m.results[sc].summary;
    const pay = s.byAc.Bijnor.shgPayments + s.byAc.Lucknow.shgPayments;
    return { sc, pay, logi: s.logisticsOutlay };
  });

  return (
    <div>
      <PageHeader title="Warehouse finances" question="Does each warehouse earn enough to cover its costs? Today vs the recommended plan." />

      <HowTo
        steps={[
          <>Each warehouse earns {pct(m.data.rateCard.markup, 0)} of the SHG price on every unit it sells. Transport is paid by the buyer, so it is not income.</>,
          <><b>Warehouse managers:</b> type your real monthly costs in the right-hand table (rent, salaries, packaging…). Leave a line blank if you don&apos;t know it yet: the app never guesses.</>,
          <>Once costs are in, the left table shows the monthly <b>profit or loss</b> and how many units the warehouse must sell to <b>break even</b>.</>,
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section title="Income and costs, ₹ per month" note="Safe income counts only products priced at or below market: it is what a warehouse can rely on. Costs are not in the case data.">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>₹ per month</th>{cols.map((c) => <th key={c.key} className="r">{c.key}</th>)}</tr>
              </thead>
              <tbody>
                {row("SHGs linked", (p) => num(p.shgs))}
                {row("Units sold", (p) => num(p.units))}
                {row("Kg handled", (p) => num(p.kg))}
                {row("Sales value (what buyers pay)", (p) => inr(p.gmv))}
                {row("less: paid to SHGs", (p) => inr(p.shgPayments))}
                {row("less: transport (charged to buyers)", (p) => inr(p.logistics))}
                {row("Warehouse income, all products", (p) => inr(p.markup))}
                {row("Safe income (products priced OK)", (p) => <b>{inr(p.markupSecure)}</b>)}
                {row("less: variable costs", (p) => (p.variableEntered ? inr(p.variableCosts) : <ToCollect />))}
                {row("Left after variable costs", (p) => <b>{inr(p.contribution)}</b>)}
                {row("less: fixed costs", (p) => (p.fixedCosts === null ? <ToCollect /> : inr(p.fixedCosts)))}
                {row("Monthly profit or loss", (p) =>
                  p.operatingResult === null ? <ToCollect>costs needed</ToCollect> : <b className={clsx(p.operatingResult < 0 && "text-orange")}>{inr(p.operatingResult)}</b>,
                )}
                {row("Units needed to break even", (p) =>
                  p.breakEvenUnits === null ? <ToCollect>costs needed</ToCollect> : Number.isFinite(p.breakEvenUnits) ? num(p.breakEvenUnits) : "not reachable",
                )}
                {row("Covers fixed costs how many times?", (p) => (p.opexCoverage === null ? <ToCollect>costs needed</ToCollect> : `${p.opexCoverage.toFixed(2)}×`))}
                {row("Safe income = how many minimum-wage salaries", (p) => num(p.staffYardstick, 1))}
              </tbody>
            </table>
          </TableWrap>
          <Note>
            The minimum-wage row is only a yardstick for scale ({inr(state.levers.minWageYardstick)} a month, UP unskilled worker), not a cost estimate. Break-even = fixed costs ÷ what is left per unit after variable costs.
          </Note>
        </Section>

        <Section title="Enter monthly costs (₹ per month)" note="Leave blank until the real figure is known. Nothing is pre-filled. Values are saved in this browser.">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Cost line</th>{ACS.map((a) => <th key={a} className="r">{a}</th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={3} className="font-semibold text-navy">Variable costs (go up with sales)</td></tr>
                {VARIABLE_COST_LINES.map((l) => (
                  <tr key={l}>
                    <td className="whitespace-normal">{l}</td>
                    {ACS.map((a) => (
                      <td key={a} className="r">
                        <input className="field w-28 text-right" type="number" min={0} placeholder="to collect" value={costValue(a, "variable", l)} onChange={(e) => setCost(a, "variable", l, e.target.value)} aria-label={`${l} ${a}`} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr><td colSpan={3} className="font-semibold text-navy">Fixed costs (same every month)</td></tr>
                {FIXED_COST_LINES.map((l) => (
                  <tr key={l}>
                    <td className="whitespace-normal">{l}</td>
                    {ACS.map((a) => (
                      <td key={a} className="r">
                        <input className="field w-28 text-right" type="number" min={0} placeholder="to collect" value={costValue(a, "fixed", l)} onChange={(e) => setCost(a, "fixed", l, e.target.value)} aria-label={`${l} ${a}`} />
                      </td>
                    ))}
                  </tr>
                ))}
                <tr><td colSpan={3} className="font-semibold text-navy">Capacity</td></tr>
                <tr>
                  <td>Most kg the warehouse can handle a month</td>
                  {ACS.map((a) => (
                    <td key={a} className="r">
                      <input
                        className="field w-28 text-right"
                        type="number"
                        min={0}
                        placeholder="to collect"
                        value={state.capacityKg[a] ?? ""}
                        onChange={(e) => set("capacityKg", (c) => ({ ...c, [a]: e.target.value === "" ? null : Math.max(0, Number(e.target.value) || 0) }))}
                        aria-label={`Capacity ${a}`}
                      />
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </TableWrap>
          <button className="btn mt-2" onClick={() => { set("opex", { Bijnor: { variable: {}, fixed: {} }, Lucknow: { variable: {}, fixed: {} } }); set("capacityKg", { Bijnor: null, Lucknow: null }); }}>
            Clear entered costs
          </button>
        </Section>
      </div>

      <Section title="Cash needed to run both warehouses" note="Assumption: the warehouse pays SHGs when goods arrive and pays transport when it ships, but buyers pay later. The longer buyers take, the more cash is tied up.">
        <TableWrap>
          <table className="tbl max-w-2xl">
            <thead><tr><th>If buyers pay after…</th>{wc.map((w) => <th key={w.sc} className="r">{w.sc === "S0" ? "Today" : "Recommended plan"}</th>)}</tr></thead>
            <tbody>
              {[15, 30, 45].map((d) => (
                <tr key={d}><td>{d} days, cash tied up</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(workingCapital(w.pay, w.logi, d))}</td>)}</tr>
              ))}
              <tr><td>Paid to SHGs each month</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(w.pay)}</td>)}</tr>
              <tr><td>Transport paid each month</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(w.logi)}</td>)}</tr>
            </tbody>
          </table>
        </TableWrap>
      </Section>
    </div>
  );
}
