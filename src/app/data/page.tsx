"use client";

import { Loading, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { dataQuality, SCENARIOS } from "@/lib/engine";
import { inr, num } from "@/lib/format";
import { CASE, useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

function downloadCsv(name: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => (typeof v === "number" ? String(v) : `"${v.replace(/"/g, '""')}"`);
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

export default function DataPage() {
  const { state, hydrated, resetAll } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const checks = dataQuality(CASE);
  const card = CASE.rateCard;
  const exportScenario = () => {
    const sc = SCENARIOS.find((x) => x.id === state.scenario)!;
    downloadCsv(`prerna360_${sc.id}.csv`, [
      ["Plan", sc.name, "Assumptions", JSON.stringify(state.levers)],
      ["SHG", "Product", "Warehouse", "Sold", "SHG price", "Transport in", "Warehouse margin", "Delivery", "Selling price", "Market price", "Below market by", "Priced OK", "Units/month", "Warehouse earns/month", "Women earn/month", "Transport/month"],
      ...m.current.rows.map((r) => [r.shgId, r.product, r.ac, r.channel, r.shgPrice, r.inbound, r.markup, r.outbound, r.sp, r.market, r.headroomPct, r.competitive ? "Yes" : "No", r.units, r.markupRev, r.shgIncome, r.inboundSpend + r.outboundSpend]),
    ]);
  };

  return (
    <div>
      <PageHeader title="Data & sources" question="Where every number comes from: the case data, the transport rates, analyst labels and data checks.">
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={exportScenario}>Download this plan (CSV)</button>
          <button className="btn" onClick={() => { if (window.confirm("Clear everything saved in this browser (assumptions, warehouse choices, costs, buyers, boxes, orders)?")) resetAll(); }}>
            Reset saved inputs
          </button>
        </div>
      </PageHeader>

      <Section title="Provenance">
        <TableWrap>
          <table className="tbl">
            <tbody>
              <tr><td>Case dataset (source of truth, unmodified)</td><td className="whitespace-normal">{CASE.source.dataset} · sheet &quot;SHG Data&quot;</td></tr>
              <tr><td>Dataset SHA-256 (checked in CI)</td><td className="font-mono text-[11px] whitespace-normal">{CASE.source.datasetSha256}</td></tr>
              <tr><td>Analyst attributes</td><td className="whitespace-normal">{CASE.source.attributes}</td></tr>
              <tr><td>Calculation engine</td><td className="whitespace-normal">Pure TypeScript port of context/prerna_model.py; golden tests and parity against context/reference_outputs pass in CI.</td></tr>
              <tr><td>Saved inputs</td><td className="whitespace-normal">Costs, capacity, buyers, boxes, orders, warehouse choices and assumptions are kept in this browser only (prototype).</td></tr>
            </tbody>
          </table>
        </TableWrap>
        <Note>{CASE.source.note} Members are held as counts per SHG; no names, phone, Aadhaar or bank fields exist anywhere in the app.</Note>
      </Section>

      <Section title="Data checks">
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>Rule</th><th>Level</th><th>Result</th><th>Detail</th></tr></thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.rule}>
                  <td>{c.rule}</td>
                  <td>{c.level}</td>
                  <td><Pill tone={c.passed ? "ok" : c.level === "blocking" ? "orange" : "grey"}>{c.passed ? "pass" : c.level === "blocking" ? "fail" : "warning"}</Pill></td>
                  <td className="whitespace-normal">{c.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section title="Transport rates and margin (from the case)">
        <TableWrap>
          <table className="tbl max-w-2xl">
            <thead><tr><th>Item</th><th className="r">Value</th><th>Unit</th></tr></thead>
            <tbody>
              {card.bands.map((b, i) => (
                <tr key={i}>
                  <td>Transport to warehouse, {b.upToKm === null ? `above ${card.bands[i - 1]?.upToKm} km` : `${i === 0 ? "0" : (card.bands[i - 1]?.upToKm ?? 0) + 1}–${b.upToKm} km`}</td>
                  <td className="r">{inr(b.ratePerKg)}</td><td>per kg</td>
                </tr>
              ))}
              <tr><td>Online courier, first kg</td><td className="r">{inr(card.onlineFirstKg)}</td><td>per order (1 unit = 1 order)</td></tr>
              <tr><td>Online courier, each extra kg or part</td><td className="r">{inr(card.onlineExtraKg)}</td><td>per kg</td></tr>
              <tr><td>Bulk, shared truck</td><td className="r">{inr(card.bulkPerKg)}</td><td>per kg</td></tr>
              <tr><td>Warehouse margin</td><td className="r">{num(card.markup * 100)}%</td><td>of SHG price</td></tr>
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section title={`Case data: ${CASE.shgs.length} SHGs, unchanged`}>
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr><th>SHG</th><th>District</th><th className="r">Members</th><th className="r">Earning</th><th className="r">km Bijnor</th><th className="r">km Lucknow</th><th>Linked AC</th><th>Product</th><th className="r">kg</th><th className="r">SHG price</th><th className="r">SHG profit</th><th className="r">Units / month</th><th>Channel</th><th className="r">Market</th></tr>
            </thead>
            <tbody>
              {CASE.shgs.map((s) => (
                <tr key={s.id}>
                  <td className="font-semibold">{s.id}</td><td>{s.district}</td><td className="r">{s.members}</td><td className="r">{s.active}</td><td className="r">{s.distBijnor}</td><td className="r">{s.distLucknow}</td>
                  <td>{s.linkedAc}</td><td>{s.product}</td><td className="r">{s.weight}</td><td className="r">{inr(s.shgPrice)}</td><td className="r">{inr(s.shgProfit)}</td><td className="r">{num(s.units)}</td><td>{s.channel}</td><td className="r">{inr(s.market)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section title="Analyst labels (not in the case)">
        <TableWrap>
          <table className="tbl">
            <thead><tr><th>SHG</th><th>Product</th><th>Group</th><th>Brand tier</th><th>Category</th><th>ODOP / GI link (verify eligibility)</th></tr></thead>
            <tbody>
              {CASE.attributes.map((a) => (
                <tr key={a.shgId}><td className="font-semibold">{a.shgId}</td><td>{a.product}</td><td>{a.group}</td><td>{a.brandTier}</td><td>{a.category}</td><td className="whitespace-normal">{a.odopGi}</td></tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>
    </div>
  );
}
