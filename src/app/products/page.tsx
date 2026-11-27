"use client";

import clsx from "clsx";
import { useState } from "react";
import { Waterfall } from "@/components/charts";
import { HowTo, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { BulkComparison } from "@/components/headline";
import { SCENARIOS } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { ATTR, SHG, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

export default function PricesAndChannels() {
  const { state } = useStore();
  const m = useModel();
  const [selected, setSelected] = useState("SHG-16");
  const [fAc, setFAc] = useState("All");
  const [fTier, setFTier] = useState("All");
  const [fComp, setFComp] = useState("All");
  const [more, setMore] = useState(false);
  const plan = SCENARIOS.find((x) => x.id === state.scenario)!;
  const row = m.current.rows.find((r) => r.shgId === selected)!;
  const curRow = new Map(m.current.rows.map((r) => [r.shgId, r]));
  const bulkCheck = new Map(m.bulkDemandHybrid.map((b) => [b.shgId, b]));
  const card = m.data.rateCard;
  const rows = m.channels.filter((c) => {
    const a = ATTR.get(c.shgId);
    const r = curRow.get(c.shgId)!;
    return (
      (fAc === "All" || c.ac === fAc) &&
      (fTier === "All" || a?.brandTier === fTier) &&
      (fComp === "All" || (fComp === "Competitive" ? r.competitive : !r.competitive))
    );
  });

  return (
    <div>
      <PageHeader title="Prices & channels" question="Is each product priced at or below market? Should it be sold online or in bulk?" />

      <HowTo
        steps={[
          <>Pick a product to see how its price is built: SHG price + transport in + warehouse margin ({pct(card.markup, 0)}) + delivery. Compare it with the market price (dashed line).</>,
          <>The table compares <b>online</b> (courier, {inr(card.onlineFirstKg)} per order for the first kg) with <b>bulk</b> (truck, {inr(card.bulkPerKg)} per kg) at the recommended warehouse.</>,
          <>The <b>Recommended</b> column follows the hybrid plan: keep online, sell online as a <b>multi-pack</b> (several units in one parcel), or move to bulk <b>only once a buyer commits</b>.</>,
        ]}
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Section
          title="How the price is built"
          right={
            <select className="field" value={selected} onChange={(e) => setSelected(e.target.value)} aria-label="Product">
              {m.data.shgs.map((s) => <option key={s.id} value={s.id}>{s.id} {s.product}</option>)}
            </select>
          }
          note={`In the plan "${plan.name}", ${row.product} goes through ${row.ac} and is sold ${row.channel === "Bulk" ? "in bulk" : "online"}${(m.current.plan[row.shgId]?.unitsPerParcel ?? 1) > 1 ? ` as a ${m.current.plan[row.shgId]!.unitsPerParcel}-pack (price per unit)` : ""}${m.current.plan[row.shgId]?.needsBuyer && row.channel === "Online" ? " until a bulk buyer commits" : ""}.`}
        >
          <Waterfall shgPrice={row.shgPrice} inbound={row.inbound} markup={row.markup} outbound={row.outbound} sp={row.sp} market={row.market} />
        </Section>
        <Section title={`${row.shgId} ${row.product}`}>
          <TableWrap>
            <table className="tbl">
              <tbody>
                <tr><td>Warehouse · sold</td><td className="r">{row.ac} · {row.channel}</td></tr>
                <tr><td>Selling price vs market</td><td className={clsx("r tabular-nums", !row.competitive && "above-market")}>{inr(row.sp, 1)} vs {inr(row.market)}</td></tr>
                <tr>
                  <td>Verdict</td>
                  <td className={clsx("r", !row.competitive ? "above-market" : "font-semibold text-ok")}>
                    {row.competitive
                      ? `Priced OK: ${pct(row.headroomPct)} below market`
                      : row.headroomPct >= 0
                        ? "Priced OK where sold, but not all volume is covered yet"
                        : `Too expensive: ${pct(-row.headroomPct)} above market`}
                  </td>
                </tr>
                <tr><td>Transport share of the price</td><td className="r tabular-nums">{pct((row.inbound + row.outbound) / row.sp)}</td></tr>
                <tr><td>AC gross markup per month</td><td className="r tabular-nums">{inr(row.markupRev)}</td></tr>
                <tr><td>SHG women earn per month</td><td className="r tabular-nums">{inr(row.shgIncome)} ({num(row.active)} women)</td></tr>
                <tr><td>Brand tier · ODOP/GI</td><td className="r whitespace-normal">{ATTR.get(row.shgId)?.brandTier} · {ATTR.get(row.shgId)?.odopGi || "–"}</td></tr>
              </tbody>
            </table>
          </TableWrap>
          <Note>Brand tier and ODOP/GI links are analyst classifications (not in the case); eligibility to be verified.</Note>
        </Section>
      </div>

      <Section
        title="Online, multi-pack or bulk? (at the recommended AC)"
        right={
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select className="field" value={fAc} onChange={(e) => setFAc(e.target.value)} aria-label="Warehouse filter"><option value="All">All warehouses</option><option>Bijnor</option><option>Lucknow</option></select>
            <select className="field" value={fTier} onChange={(e) => setFTier(e.target.value)} aria-label="Brand tier filter"><option value="All">All tiers</option><option>Essentials</option><option>Signature</option></select>
            <select className="field" value={fComp} onChange={(e) => setFComp(e.target.value)} aria-label="Price filter"><option value="All">All products</option><option value="Competitive">Priced OK</option><option value="Above">Above market</option></select>
            <label className="flex items-center gap-1"><input type="checkbox" checked={more} onChange={(e) => setMore(e.target.checked)} className="accent-[#204B75]" />Analyst columns</label>
          </div>
        }
      >
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>SHG</th>
                <th>Product</th>
                <th>Warehouse</th>
                <th className="r">Price online</th>
                <th className="r">Multi-pack price</th>
                <th className="r">Price in bulk</th>
                <th className="r">Market price</th>
                <th>Sold today</th>
                <th>Recommended</th>
                <th className="r">Bulk buyers confirmed</th>
                {more && (
                  <>
                    <th className="r">Max margin online</th>
                    <th className="r">Max margin bulk</th>
                    <th className="r">Courier as % of SHG price</th>
                    <th className="r">Left for a shop&apos;s margin (bulk)</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = SHG.get(c.shgId)!;
                const b = bulkCheck.get(c.shgId);
                return (
                  <tr key={c.shgId}>
                    <td className="font-semibold">{c.shgId}</td>
                    <td>{s.product}</td>
                    <td>{c.ac}</td>
                    <td className={clsx("r tabular-nums", !c.onlineWorks && "above-market")}>{inr(c.onlineSp)}</td>
                    <td className={clsx("r tabular-nums", c.packSp !== null && c.packSp > s.market && "above-market")}>{c.packSp === null ? "–" : `${inr(c.packSp, 2)} (${c.packSize}-pack)`}</td>
                    <td className={clsx("r tabular-nums", !c.bulkWorks && "above-market")}>{inr(c.bulkSp)}</td>
                    <td className="r tabular-nums">{inr(s.market)}</td>
                    <td>{s.channel}</td>
                    <td>
                      {c.packSize > 1 ? (
                        <Pill tone="navy">Online {c.packSize}-pack</Pill>
                      ) : c.hybrid.needsBuyer ? (
                        <Pill tone="navy">Bulk once a buyer commits</Pill>
                      ) : (
                        <Pill tone="grey">Keep {c.hybrid.channel.toLowerCase()}</Pill>
                      )}
                    </td>
                    <td className={clsx("r tabular-nums", b && b.gap > 0 && "text-orange")}>{b ? `${num(Math.min(b.confirmed, b.unitsNeeded))} of ${num(b.unitsNeeded)}` : "–"}</td>
                    {more && (
                      <>
                        <td className={clsx("r tabular-nums", c.maxMarkupOnline < card.markup && "above-market")}>{pct(c.maxMarkupOnline)}</td>
                        <td className="r tabular-nums">{pct(c.maxMarkupBulk)}</td>
                        <td className="r tabular-nums">{pct(c.courierPctOfShgPrice, 0)}</td>
                        <td className="r tabular-nums">{pct(c.stockistHeadroom)}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <Note>
          Orange price = above market. &quot;Max margin&quot;: the highest warehouse margin that still keeps the product at or below market (orange when below the {pct(card.markup, 0)} the case sets).
          &quot;Left for a shop&apos;s margin&quot;: how far below market the bulk price is, which is what a Prerna store or retailer can keep.
        </Note>
      </Section>

      <Section title="Moving to bulk needs bulk buyers">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-2 text-[13px] leading-relaxed">
            <p>
              Today almost every product is sold online, and today&apos;s online customers will not turn into bulk buyers. So the recommended plan keeps selling online until an institution
              (canteens, hostels, offices, government buyers on GeM SARAS) <b>signs a letter of intent or purchase order</b>. Only that confirmed volume moves to bulk.
            </p>
            <p>
              Reseller room at market price is thin for these staples, so sell to <b>end users</b> (institutions), not to resellers who need a margin. Multi-pack prices are modelled from the case tariff, not observed sales.
            </p>
          </div>
          <BulkComparison />
        </div>
      </Section>
    </div>
  );
}
