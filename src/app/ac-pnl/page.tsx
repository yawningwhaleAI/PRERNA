"use client";

import clsx from "clsx";
import { Loading, Note, PageHeader, Section, TableWrap, ToCollect } from "@/components/ui";
import { FIXED_COST_LINES, VARIABLE_COST_LINES, workingCapital, type AcName, type AcPnl } from "@/lib/engine";
import { inr, num, toPaise } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

const ACS: AcName[] = ["Bijnor", "Lucknow"];

export default function AcPnlPage() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const cols: { key: string; p: AcPnl }[] = [];
  for (const sc of ["S0", "S3"] as const) for (const ac of ACS) cols.push({ key: `${ac} ${sc}`, p: m.pnl(sc, ac) });

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
      <PageHeader title="AC P&L" question="Is each AC viable? AC income, the costs UPSRLM must collect, break-even and working capital." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section title="AC P&L, ₹ per month" note="Logistics is a pass-through recovered in the price. Viability rests on secure markup (products at or below market). Costs are not in the case.">
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>₹ per month</th>{cols.map((c) => <th key={c.key} className="r">{c.key}</th>)}</tr>
              </thead>
              <tbody>
                {row("Linked SHGs", (p) => num(p.shgs))}
                {row("Units sold", (p) => num(p.units))}
                {row("kg handled", (p) => num(p.kg))}
                {row("Sales value at selling price (GMV)", (p) => inr(p.gmv))}
                {row("less: payments to SHGs", (p) => inr(p.shgPayments))}
                {row("less: logistics paid (recovered in price)", (p) => inr(p.logistics))}
                {row("AC markup, all products", (p) => inr(p.markup))}
                {row("AC markup, secure (competitive only)", (p) => <b>{inr(p.markupSecure)}</b>)}
                {row("less: variable costs", (p) => (p.variableEntered ? inr(p.variableCosts) : <ToCollect />))}
                {row("Contribution", (p) => <b>{inr(p.contribution)}</b>)}
                {row("less: fixed costs", (p) => (p.fixedCosts === null ? <ToCollect /> : inr(p.fixedCosts)))}
                {row("Operating result", (p) =>
                  p.operatingResult === null ? <ToCollect>opex needed</ToCollect> : <b className={clsx(p.operatingResult < 0 && "text-orange")}>{inr(p.operatingResult)}</b>,
                )}
                {row("Break-even units per month", (p) =>
                  p.breakEvenUnits === null ? <ToCollect>opex needed</ToCollect> : Number.isFinite(p.breakEvenUnits) ? num(p.breakEvenUnits) : "not reachable",
                )}
                {row("Opex coverage (contribution ÷ fixed)", (p) => (p.opexCoverage === null ? <ToCollect>opex needed</ToCollect> : `${p.opexCoverage.toFixed(2)}×`))}
                {row("Secure markup in minimum-wage staff salaries", (p) => num(p.staffYardstick, 1))}
              </tbody>
            </table>
          </TableWrap>
          <Note>
            Minimum wage ({inr(state.levers.minWageYardstick)}/month, UP unskilled, Oct 2026 – Mar 2027) is a yardstick, not an opex estimate. Break-even units = fixed costs ÷ contribution per secure unit.
          </Note>
        </Section>

        <Section title="Costs to collect (₹ per month, per AC)" note="Leave blank until UPSRLM provides actual figures. Nothing here is pre-filled; values are saved in this browser.">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Cost line</th>{ACS.map((a) => <th key={a} className="r">{a}</th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={3} className="font-semibold text-navy">Variable costs</td></tr>
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
                <tr><td colSpan={3} className="font-semibold text-navy">Fixed costs</td></tr>
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
                  <td>Storage and dispatch capacity (kg / month)</td>
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

      <Section title="Working capital, both ACs" note="Assumption: the AC pays SHGs on receipt and logistics on dispatch, and receives cash after the cycle. Need = (SHG payouts + logistics) × days ÷ 30.">
        <TableWrap>
          <table className="tbl max-w-2xl">
            <thead><tr><th>Days from paying SHG and logistics to receiving cash</th>{wc.map((w) => <th key={w.sc} className="r">{w.sc}</th>)}</tr></thead>
            <tbody>
              {[15, 30, 45].map((d) => (
                <tr key={d}><td>{d} days</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(workingCapital(w.pay, w.logi, d))}</td>)}</tr>
              ))}
              <tr><td>Monthly SHG payouts</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(w.pay)}</td>)}</tr>
              <tr><td>Monthly logistics</td>{wc.map((w) => <td key={w.sc} className="r tabular-nums">{inr(w.logi)}</td>)}</tr>
            </tbody>
          </table>
        </TableWrap>
      </Section>
    </div>
  );
}
