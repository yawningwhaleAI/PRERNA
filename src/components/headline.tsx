"use client";

import Link from "next/link";
import { inr, num, pct } from "@/lib/format";
import { SHG, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

/** Floor / freight saved / ceiling: the three numbers the submission leads with. */
export function HeadlineCards() {
  const m = useModel();
  const total = m.hybrid.rows.length;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3" data-testid="headline-cards">
      <div className="rounded border border-line bg-white p-3">
        <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Floor</div>
        <div className="mt-0.5 text-3xl font-bold text-navy" data-testid="floor">{num(m.floor.competitiveCount)} / {num(total)}</div>
        <div className="text-[12.5px]">products at or below market after re-linking {num(m.freight.moves.length)} SHGs. <b>No new buyers needed.</b></div>
      </div>
      <div className="rounded border border-line bg-white p-3">
        <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Freight saved</div>
        <div className="mt-0.5 text-3xl font-bold text-navy">{inr(m.freight.total)}</div>
        <div className="text-[12.5px]">a month less inbound freight, <b>passed to buyers as lower prices, not AC income</b>.</div>
      </div>
      <div className="rounded border border-line bg-white p-3">
        <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Ceiling</div>
        <div className="mt-0.5 text-3xl font-bold text-navy" data-testid="ceiling">{num(m.ceiling.summary.competitiveCount)} / {num(total)}</div>
        <div className="text-[12.5px]">only when buyers commit: multi-packs accepted and bulk orders signed.</div>
      </div>
    </div>
  );
}

/** Today's exposure, shown as an upper bound split by how far above market each product is. */
export function ExposureSplit() {
  const m = useModel();
  const e = m.exposure;
  const s0 = m.results.S0.summary;
  return (
    <div className="rounded border border-orange/40 bg-orange/5 p-3 text-[13px]">
      <div className="mb-1 font-semibold text-navy">
        If nothing changes: {num(m.results.S0.rows.length - s0.competitiveCount)} of {num(m.results.S0.rows.length)} products priced above market (upper bound)
      </div>
      <table className="w-full max-w-2xl text-[12.5px]">
        <thead>
          <tr className="text-left text-grey">
            <th className="py-0.5 font-semibold">Maximum monthly exposure</th>
            <th className="py-0.5 text-right font-semibold">Total</th>
            <th className="py-0.5 text-right font-semibold">&gt;5% above market</th>
            <th className="py-0.5 text-right font-semibold">0–5% above (some sales likely continue)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>AC gross markup</td>
            <td className="text-right font-bold text-orange tabular-nums">{inr(e.markup.total)}</td>
            <td className="text-right tabular-nums">{inr(e.markup.far)}</td>
            <td className="text-right tabular-nums">{inr(e.markup.near)}</td>
          </tr>
          <tr>
            <td>Income of {num(e.women)} earning women</td>
            <td className="text-right font-bold text-orange tabular-nums">{inr(e.income.total)}</td>
            <td className="text-right tabular-nums">{inr(e.income.far)}</td>
            <td className="text-right tabular-nums">{inr(e.income.near)}</td>
          </tr>
        </tbody>
      </table>
      <p className="mt-2">
        <b>{num(m.zeroMarkup.length)} products stay above market even at zero markup</b> ({m.zeroMarkup.map((z) => SHG.get(z.shgId)?.product).join(", ")}): courier alone is{" "}
        {pct(Math.min(...m.zeroMarkup.map((z) => z.courierShareOfShgPrice)), 0)}–{pct(Math.max(...m.zeroMarkup.map((z) => z.courierShareOfShgPrice)), 0)} of the SHG price. The cause is logistics, not the AC&apos;s markup.
      </p>
    </div>
  );
}

/** New bulk volume that needs buyers: hybrid vs blanket bulk. */
export function BulkComparison() {
  const { state } = useStore();
  const m = useModel();
  const stores = state.levers.prernaStores;
  const hyb = m.bulkDemandHybrid;
  const bl = m.bulkDemandBlanket;
  const need = (x: typeof hyb) => x.reduce((t, b) => t + b.unitsNeeded, 0);
  const conf = (x: typeof hyb) => x.reduce((t, b) => t + Math.min(b.confirmed, b.unitsNeeded), 0);
  const online = m.data.shgs.filter((s) => s.channel === "Online").reduce((t, s) => t + s.units, 0);
  const rows = [
    { name: "Buyer-backed hybrid (recommended)", x: hyb, rec: true },
    { name: "All five staples to bulk", x: bl, rec: false },
  ];
  return (
    <div className="rounded border border-line bg-white p-3 text-[13px]">
      <div className="mb-1 font-semibold text-navy">New bulk units that need buyers each month</div>
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="text-left text-grey">
            <th className="py-0.5 font-semibold">Plan</th>
            <th className="py-0.5 text-right font-semibold">Units / month</th>
            <th className="py-0.5 text-right font-semibold">Share of today&apos;s online units</th>
            <th className="py-0.5 text-right font-semibold">Per Prerna Saras store</th>
            <th className="py-0.5 text-right font-semibold">Confirmed so far</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name} className={r.rec ? "font-semibold" : ""}>
              <td>{r.name}</td>
              <td className="text-right tabular-nums">{num(need(r.x))}</td>
              <td className="text-right tabular-nums">{pct(need(r.x) / online, 0)}</td>
              <td className="text-right tabular-nums">{num(need(r.x) / stores, 1)}</td>
              <td className="text-right tabular-nums">{num(conf(r.x))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-grey">
        Online sales stay live until a buyer signs. Record buyers and their letters of intent or purchase orders in{" "}
        <Link href="/buyers" className="text-navy underline">Buyers &amp; gift boxes</Link>; confirmed volume moves the plan from the floor towards the ceiling.
      </p>
    </div>
  );
}
