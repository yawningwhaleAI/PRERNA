"use client";

import clsx from "clsx";
import { HowTo, Note, PageHeader, Section, TableWrap, ToCollect } from "@/components/ui";
import { FIXED_COST_LINES, VARIABLE_COST_LINES, workingCapitalHybrid, type AcName, type AcPnl } from "@/lib/engine";
import { useState } from "react";
import { inr, num, pct, signedPct, toPaise } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

const ACS: AcName[] = ["Bijnor", "Lucknow"];

export default function AcPnlPage() {
  const { state, set } = useStore();
  const m = useModel();
  const cols: { key: string; p: AcPnl }[] = [];
  for (const sc of ["S0", "SH"] as const) for (const ac of ACS) cols.push({ key: `${ac}, ${sc === "S0" ? "today" : "hybrid"}`, p: m.pnl(sc, ac) });

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

  const [onlineDays, setOnlineDays] = useState(15);
  const [instDays, setInstDays] = useState(30);
  const wch = workingCapitalHybrid(m.data, state.levers, state.acOverrides);
  const t = m.transfer;
  const B = t.byAc.find((x) => x.ac === "Bijnor")!;
  const Lk = t.byAc.find((x) => x.ac === "Lucknow")!;

  return (
    <div>
      <PageHeader title="Warehouse finances" question="How much gross markup does each AC earn, and what must be known before anyone can say it covers its costs?" />

      <HowTo
        steps={[
          <>Each AC earns a gross markup of {pct(m.data.rateCard.markup, 0)} of the SHG price on every unit it sells. That is <b>not profit</b>: no AC cost is in the case. Transport is paid by the buyer.</>,
          <><b>Warehouse managers:</b> report actual monthly costs in the operating-cost audit from Dec 2026. Leave a line blank until it is known: the app never guesses.</>,
          <>Once costs are in, the left table shows the monthly <b>profit or loss</b> and how many units the warehouse must sell to <b>break even</b>.</>,
        ]}
      />

      <Section title={`Re-linking moves ${inr(t.markupMoved)} of gross markup from Bijnor to Lucknow`} note="Gross markup before → after re-linking 7 SHGs. Neither AC's viability is known until its costs are collected.">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2" data-testid="transfer-bridge">
          {[B, Lk].map((x) => (
            <div key={x.ac} className="rounded border border-line bg-white p-3">
              <div className="text-[13px] font-bold text-navy">{x.ac}</div>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[13px]">
                <span><span className="text-grey">Today</span> <b className="tabular-nums">{inr(x.markupBefore)}</b></span>
                <span className={clsx("font-semibold tabular-nums", x.markupAfter < x.markupBefore ? "text-orange" : "text-ok")}>
                  {x.markupAfter < x.markupBefore ? `−${inr(x.markupBefore - x.markupAfter)} to Lucknow` : `+${inr(x.markupAfter - x.markupBefore)} from Bijnor`}
                </span>
                <span><span className="text-grey">After</span> <b className="tabular-nums">{inr(x.markupAfter)}</b></span>
              </div>
              <div className="mt-1 text-[12px] text-grey">
                Units {num(x.unitsBefore)} → {num(x.unitsAfter)} ({signedPct(x.unitsAfter / x.unitsBefore - 1)}) · kg {num(x.kgBefore)} → {num(x.kgAfter)} ({signedPct(x.kgAfter / x.kgBefore - 1)})
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border border-line bg-white p-3 text-[12.5px]">
            <div className="font-bold text-navy">Bijnor transition plan</div>
            <p className="mt-1">
              Units {num(B.unitsBefore)} → {num(B.unitsAfter)}. Each ₹1 lakh of monthly fixed cost needs <b>{num(B.unitsPerLakhFixedCost)}</b> units of markup
              ({inr(B.markupPerUnitAfter, 1)} per unit) <span className="text-grey">(yardstick, not a cost estimate)</span>.
            </p>
            <ol className="mt-1 list-decimal pl-5">
              <li>Onboard more west-UP SHGs to Bijnor.</li>
              <li>Build institutional demand near Bijnor.</li>
              <li>State support only if collected costs justify it.</li>
            </ol>
          </div>
          <div className="rounded border border-line bg-white p-3 text-[12.5px]">
            <div className="font-bold text-navy">Lucknow capacity check</div>
            <p className="mt-1">
              Units {signedPct(Lk.unitsAfter / Lk.unitsBefore - 1)}, kg {signedPct(Lk.kgAfter / Lk.kgBefore - 1)}. Each ₹1 lakh of fixed cost needs <b>{num(Lk.unitsPerLakhFixedCost)}</b> units
              ({inr(Lk.markupPerUnitAfter, 1)} per unit) <span className="text-grey">(yardstick, not a cost estimate)</span>.
            </p>
            <p className="mt-1">Audit space, staff and dispatch before each re-link: {num(Lk.kgBefore)} → {num(Lk.kgAfter)} kg a month.</p>
          </div>
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Section title="Gross markup and costs, ₹ per month" note="Secure gross markup counts only products priced at or below market (hybrid: current pack acceptance and secured bulk). Costs are not in the case data, so no AC can yet be called viable or not.">
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
                {row("AC gross markup, all products sold", (p) => inr(p.markup))}
                {row("Secure gross markup (products priced OK)", (p) => <b>{inr(p.markupSecure)}</b>)}
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
                {row("Secure gross markup = how many minimum-wage salaries (yardstick)", (p) => num(p.staffYardstick, 1))}
              </tbody>
            </table>
          </TableWrap>
          <Note>
            The minimum-wage row is only a yardstick for scale ({inr(state.levers.minWageYardstick)} a month, UP unskilled worker), not a cost estimate. Break-even = fixed costs ÷ what is left per unit after variable costs.
          </Note>
        </Section>

        <Section title="Operating-cost audit (₹ per month)" note="Not in the case data. Both ACs report actual costs monthly from Dec 2026; leave blank until known. Nothing is pre-filled; values are saved in this browser.">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Cost line</th>{ACS.map((a) => <th key={a} className="r">{a}</th>)}</tr></thead>
              <tbody>
                <tr><td colSpan={3} className="font-semibold text-navy">Costs that move with volume</td></tr>
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

      <Section title="Working capital (recommended hybrid, all buyers committed)" note="The AC pays SHGs on receipt and pays logistics on dispatch; buyers pay later. Need = (SHG payouts + logistics) × ((1 − b) × online days + b × institutional days) ÷ 30, where b is the bulk share of SHG payouts.">
        <div className="mb-2 rounded border border-orange/50 bg-orange/5 px-3 py-2 text-[13px] font-semibold text-orange" data-testid="wc-unresolved">Unresolved: who funds it.</div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="space-y-2 text-[13px]">
            <label className="flex items-center justify-between gap-2">
              <span>Online buyers pay after (days)<span className="ml-1 text-[11px] text-grey">assumption</span></span>
              <input className="field w-20 text-right" type="number" min={0} value={onlineDays} onChange={(e) => setOnlineDays(Math.max(0, Number(e.target.value) || 0))} aria-label="Online payment days" />
            </label>
            <label className="flex items-center justify-between gap-2">
              <span>Institutions pay after (days)<span className="ml-1 text-[11px] text-grey">assumption</span></span>
              <select className="field" value={instDays} onChange={(e) => setInstDays(Number(e.target.value))} aria-label="Institutional payment days">
                {[30, 60, 90].map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <div className="rounded border border-line bg-white p-3">
              <div className="text-[11px] font-semibold text-grey uppercase">Cash tied up</div>
              <div className="text-2xl font-bold text-navy" data-testid="wc-value">{inr(wch.wc(instDays, onlineDays))}</div>
              <div className="text-[12px] text-grey">≈ ₹{num(wch.wc(instDays, onlineDays) / 1e5, 1)} lakh</div>
            </div>
          </div>
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>Institutions pay in</th><th className="r">Cash tied up</th><th className="r">Lakh</th></tr></thead>
              <tbody>
                {[30, 60, 90].map((d) => (
                  <tr key={d} className={clsx(d === instDays && "font-semibold")}>
                    <td>{d} days</td>
                    <td className="r tabular-nums">{inr(wch.wc(d, onlineDays))}</td>
                    <td className="r tabular-nums">₹{num(wch.wc(d, onlineDays) / 1e5, 1)}</td>
                  </tr>
                ))}
                <tr><td>SHG payouts a month</td><td className="r tabular-nums">{inr(wch.payouts)}</td><td /></tr>
                <tr><td>Logistics a month</td><td className="r tabular-nums">{inr(wch.logistics)}</td><td /></tr>
                <tr><td>Bulk share of payouts (b)</td><td className="r tabular-nums">{pct(wch.bulkShare)}</td><td /></tr>
              </tbody>
            </table>
          </TableWrap>
        </div>
      </Section>
    </div>
  );
}
