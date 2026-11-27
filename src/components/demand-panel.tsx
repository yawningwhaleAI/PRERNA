"use client";

import clsx from "clsx";
import { AssumptionTag, Note, Pill, TableWrap } from "@/components/ui";
import { inr, num, pct } from "@/lib/format";
import { SHG, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

function PctInput({ id, label, value, onChange, testId }: { id: string; label: React.ReactNode; value: number; onChange: (v: number) => void; testId: string }) {
  return (
    <label htmlFor={id} className="block">
      <div className="mb-1 text-[12.5px] font-semibold text-navy">{label}</div>
      <div className="flex items-center gap-2">
        <input
          id={`${id}-range`}
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(value * 100)}
          onChange={(e) => onChange(Number(e.target.value) / 100)}
          className="w-full accent-[#204B75]"
          aria-label={typeof label === "string" ? label : id}
        />
        <input
          id={id}
          data-testid={testId}
          type="number"
          min={0}
          max={100}
          step={5}
          value={Math.round(value * 100)}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n)) onChange(Math.min(100, Math.max(0, n)) / 100);
          }}
          className="field w-16 text-right"
        />
        <span className="text-xs text-grey">%</span>
      </div>
    </label>
  );
}

/** Demand scenarios for the recommended hybrid plan, plus the blanket-bulk comparison. */
export function DemandPanel({ compact = false }: { compact?: boolean }) {
  const { state, setLever } = useStore();
  const m = useModel();
  const h = m.hybrid;
  const s = h.summary;
  const total = h.rows.length;
  const effective = h.demand.bulkSecured;
  const gatedNames = h.gatedIds.map((i) => SHG.get(i)?.product).join(", ");
  const packNames = h.packIds.map((i) => SHG.get(i)?.product).join(", ");
  const outputs: [string, string, boolean][] = [
    ["Products priced at or below market", `${num(s.competitiveCount)} of ${num(total)}`, s.competitiveCount < total],
    ["AC gross markup secured (not profit)", inr(s.acMarkupSecure), false],
    ["Women's income at risk (bulk volume without a buyer stays online, above market)", inr(s.shgIncomeAtRisk), s.shgIncomeAtRisk > 0],
    ["Women's income lost (buyers who decline the multi-pack)", inr(h.incomeLostPacks), h.incomeLostPacks > 0],
    ["Earning women still exposed", num(s.womenActiveAtRisk), s.womenActiveAtRisk > 0],
  ];

  return (
    <div className="rounded border border-line bg-white p-3">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-3">
          <PctInput
            id="pack-acceptance"
            testId="pack-acceptance"
            label={<>Pack acceptance: buyers who accept the multi-pack<AssumptionTag /></>}
            value={state.levers.packAcceptance}
            onChange={(v) => setLever("packAcceptance", v)}
          />
          <PctInput
            id="bulk-secured"
            testId="bulk-secured"
            label={<>Bulk secured: volume with a committed buyer<AssumptionTag /></>}
            value={state.levers.bulkSecured}
            onChange={(v) => setLever("bulkSecured", v)}
          />
          <p className="text-[11.5px] text-grey">
            From the order book (LoI or later): <b>{pct(m.autoSecured, 0)}</b> of {num(h.gatedIds.reduce((t, i) => t + (SHG.get(i)?.units ?? 0), 0))} units.
            In use: <b>{pct(effective, 0)}</b> (the higher of the two).
          </p>
          <div className="flex flex-wrap gap-1.5">
            {m.presets.map((p) => {
              const active = Math.abs(state.levers.packAcceptance - p.packAcceptance) < 1e-9 && Math.abs(state.levers.bulkSecured - p.bulkSecured) < 1e-9;
              return (
                <button
                  key={p.id}
                  data-testid={`preset-${p.id}`}
                  title={p.note}
                  className={clsx("btn !px-2 !py-1 text-[12px]", active && "btn-primary")}
                  onClick={() => {
                    setLever("packAcceptance", p.packAcceptance);
                    setLever("bulkSecured", p.bulkSecured);
                  }}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <TableWrap>
            <table className="tbl" data-testid="demand-outputs">
              <tbody>
                {outputs.map(([k, v, bad]) => (
                  <tr key={k}>
                    <td className="whitespace-normal">{k}</td>
                    <td className={clsx("r tabular-nums font-semibold", bad ? "text-orange" : "text-navy")} data-testid={k.startsWith("Products") ? "demand-competitive" : undefined}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
          <p className="mt-1.5 text-[11.5px] text-grey">
            A product counts as priced OK only if <b>all</b> its volume sells at or below market. Multi-packs: {packNames}. Bulk once a buyer commits: {gatedNames}.
          </p>
        </div>
      </div>

      {!compact && (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div>
            <div className="mb-1 text-[13px] font-bold text-navy">The three presets (hybrid)</div>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr><th>Preset</th><th className="r">Packs</th><th className="r">Bulk</th><th className="r">Priced OK</th><th className="r">Markup secured</th><th className="r">Income at risk</th><th className="r">Lost (packs)</th><th className="r">Women exposed</th></tr>
                </thead>
                <tbody>
                  {m.presets.map((p) => (
                    <tr key={p.id}>
                      <td>{p.label}{p.id === "base_case_illustrative" && <span className="ml-1"><Pill tone="grey">illustrative</Pill></span>}</td>
                      <td className="r">{pct(p.packAcceptance, 0)}</td>
                      <td className="r">{pct(p.bulkSecured, 0)}</td>
                      <td className="r tabular-nums">{num(p.result.summary.competitiveCount)}</td>
                      <td className="r tabular-nums">{inr(p.result.summary.acMarkupSecure)}</td>
                      <td className="r tabular-nums">{inr(p.result.summary.shgIncomeAtRisk)}</td>
                      <td className="r tabular-nums">{inr(p.result.incomeLostPacks)}</td>
                      <td className="r tabular-nums">{num(p.result.summary.womenActiveAtRisk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
          </div>
          <div>
            <div className="mb-1 text-[13px] font-bold text-navy">Compare: all five staples to bulk (same buyer rule)</div>
            <TableWrap>
              <table className="tbl">
                <thead>
                  <tr><th>Bulk volume secured</th><th className="r">Priced OK</th><th className="r">Markup secured</th><th className="r">Income at risk</th></tr>
                </thead>
                <tbody>
                  {m.blanket.map((b) => (
                    <tr key={b.secured}>
                      <td>{pct(b.secured, 0)}</td>
                      <td className={clsx("r tabular-nums", b.result.summary.competitiveCount < total && "text-orange")}>{num(b.result.summary.competitiveCount)}</td>
                      <td className="r tabular-nums">{inr(b.result.summary.acMarkupSecure)}</td>
                      <td className="r tabular-nums">{inr(b.result.summary.shgIncomeAtRisk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </TableWrap>
            <Note>Blanket bulk stays at the floor until every staple unit finds a buyer. The hybrid needs buyers for fewer units and keeps two staples selling online as multi-packs.</Note>
          </div>
        </div>
      )}
    </div>
  );
}
