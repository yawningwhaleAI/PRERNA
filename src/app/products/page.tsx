"use client";

import clsx from "clsx";
import { useState } from "react";
import { Waterfall } from "@/components/charts";
import { Loading, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { SCENARIOS } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { ATTR, SHG, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function Products() {
  const { state, hydrated } = useStore();
  const m = useModel();
  const [selected, setSelected] = useState("SHG-16");
  const [fAc, setFAc] = useState("All");
  const [fTier, setFTier] = useState("All");
  const [fComp, setFComp] = useState("All");
  if (!hydrated) return <Loading />;
  const sc = SCENARIOS.find((x) => x.id === state.scenario)!;
  const row = m.current.rows.find((r) => r.shgId === selected)!;
  const curRow = new Map(m.current.rows.map((r) => [r.shgId, r]));
  const rows = m.channels.filter((c) => {
    const a = ATTR.get(c.shgId);
    const r = curRow.get(c.shgId)!;
    return (
      (fAc === "All" || r.ac === fAc) &&
      (fTier === "All" || a?.brandTier === fTier) &&
      (fComp === "All" || (fComp === "Competitive" ? r.competitive : !r.competitive))
    );
  });
  const moved = m.channels.filter((c) => c.channel === "Bulk" && SHG.get(c.shgId)!.channel === "Online");
  const newBulkUnits = moved.reduce((t, c) => t + SHG.get(c.shgId)!.units * (1 + state.levers.volumeChange), 0);

  return (
    <div>
      <PageHeader title="Products & Channel" question="Which products are uncompetitive, why, and should each sell online or in bulk?" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Section
          title="Price build-up"
          right={
            <select className="field" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Product">
              {m.data.shgs.map((s) => (
                <option key={s.id} value={s.id}>{s.id} {s.product}</option>
              ))}
            </select>
          }
          note={`${sc.short}: ${row.product} ships from ${row.ac} and sells ${row.channel.toLowerCase()}. Dashed line = market price of a similar product.`}
        >
          <Waterfall shgPrice={row.shgPrice} inbound={row.inbound} markup={row.markup} outbound={row.outbound} sp={row.sp} market={row.market} />
        </Section>
        <Section title={`${row.shgId} at a glance`}>
          <TableWrap>
            <table className="tbl">
              <tbody>
                <tr><td>Scenario AC / channel</td><td className="r">{row.ac} · {row.channel}</td></tr>
                <tr><td>Selling price vs market</td><td className={clsx("r tabular-nums", !row.competitive && "above-market")}>{inr(row.sp, 1)} vs {inr(row.market)}</td></tr>
                <tr><td>Headroom</td><td className={clsx("r tabular-nums", !row.competitive && "above-market")}>{pct(row.headroomPct)}</td></tr>
                <tr><td>Logistics share of SP</td><td className="r tabular-nums">{pct((row.inbound + row.outbound) / row.sp)}</td></tr>
                <tr><td>AC markup per month</td><td className="r tabular-nums">{inr(row.markupRev)}</td></tr>
                <tr><td>SHG income per month</td><td className="r tabular-nums">{inr(row.shgIncome)}</td></tr>
                <tr><td>Brand tier · ODOP/GI</td><td className="r whitespace-normal">{ATTR.get(row.shgId)?.brandTier} · {ATTR.get(row.shgId)?.odopGi || "–"}</td></tr>
              </tbody>
            </table>
          </TableWrap>
          <Note>Brand tier and ODOP/GI links are analyst classifications (not in the case); eligibility to be verified.</Note>
        </Section>
      </div>

      <Section
        title="Online vs bulk at the proposed AC (channel rule)"
        note="Rule: keep bulk if already bulk; else online if online SP ≤ market; else bulk if bulk SP ≤ market; else online, flagged for premium positioning or turnaround. No product moves without buyer or store commitments (pilot gate)."
        right={
          <div className="flex flex-wrap gap-2 text-xs">
            <select className="field" value={fAc} onChange={(e) => setFAc(e.target.value)} aria-label="AC filter"><option value="All">All ACs</option><option>Bijnor</option><option>Lucknow</option></select>
            <select className="field" value={fTier} onChange={(e) => setFTier(e.target.value)} aria-label="Brand tier filter"><option value="All">All tiers</option><option>Essentials</option><option>Signature</option></select>
            <select className="field" value={fComp} onChange={(e) => setFComp(e.target.value)} aria-label="Competitive filter"><option value="All">All products</option><option>Competitive</option><option>Above market</option></select>
          </div>
        }
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>Product</th>
                <th>Tier</th>
                <th>Proposed AC</th>
                <th className="r">Inbound</th>
                <th className="r">Courier</th>
                <th className="r">Bulk</th>
                <th className="r">SP online</th>
                <th className="r">SP bulk</th>
                <th className="r">Market</th>
                <th className="r">Max markup online</th>
                <th className="r">Max markup bulk</th>
                <th className="r">Courier % of SHG price</th>
                <th>Current</th>
                <th>Proposed</th>
                <th className="r">Stockist headroom</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = SHG.get(c.shgId)!;
                return (
                  <tr key={c.shgId}>
                    <td className="font-semibold">{c.shgId}</td>
                    <td>{s.product}</td>
                    <td>{ATTR.get(c.shgId)?.brandTier}</td>
                    <td>{c.ac}</td>
                    <td className="r tabular-nums">{inr(c.inbound, 1)}</td>
                    <td className="r tabular-nums">{inr(c.onlineOutbound, 1)}</td>
                    <td className="r tabular-nums">{inr(c.bulkOutbound, 1)}</td>
                    <td className={clsx("r tabular-nums", !c.onlineWorks && "above-market")}>{inr(c.onlineSp, 1)}</td>
                    <td className={clsx("r tabular-nums", !c.bulkWorks && "above-market")}>{inr(c.bulkSp, 1)}</td>
                    <td className="r tabular-nums">{inr(s.market)}</td>
                    <td className={clsx("r tabular-nums", c.maxMarkupOnline < m.data.rateCard.markup && "above-market")}>{pct(c.maxMarkupOnline)}</td>
                    <td className="r tabular-nums">{pct(c.maxMarkupBulk)}</td>
                    <td className="r tabular-nums">{pct(c.courierPctOfShgPrice, 0)}</td>
                    <td>{s.channel}</td>
                    <td>
                      <Pill tone={c.channel !== s.channel ? "navy" : "grey"}>{c.channel}</Pill>
                      {c.flag !== "ok" && <span className="ml-1"><Pill tone="orange">premium / turnaround</Pill></span>}
                    </td>
                    <td className="r tabular-nums">{pct(c.stockistHeadroom)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <Note>
          Max markup = highest markup that keeps SP at or below market (orange when below the case&apos;s 15%). Bulk SP is compared with the same market price, as the case instructs;
          stockist headroom shows what is left for a retailer&apos;s margin. New bulk volume from channel switches: {num(newBulkUnits)} units a month ≈{" "}
          {num(newBulkUnits / state.levers.prernaStores, 1)} units per Prerna Saras store ({num(state.levers.prernaStores)} stores; sell-through to be validated).
        </Note>
      </Section>
    </div>
  );
}
