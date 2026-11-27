"use client";

import Link from "next/link";
import clsx from "clsx";
import { Section, TableWrap } from "@/components/ui";
import { BulkComparison, ExposureSplit, HeadlineCards } from "@/components/headline";
import { SCENARIOS, type RateCard } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

const ROLES = [
  {
    who: "State marketing team (monthly review)",
    steps: [
      ["Open Overview", "/command-centre", "and switch between Today and Hybrid: the floor after re-linking, the ceiling, and what is still at risk."],
      ["Check the action list", "/command-centre", "on Overview: which SHGs to re-link, which products become multi-packs, which wait for a bulk buyer."],
      ["Approve a plan", "/scenarios", "after comparing all four plans side by side."],
    ],
  },
  {
    who: "Warehouse (AC) manager, Bijnor or Lucknow",
    steps: [
      ["Enter monthly costs", "/ac-pnl", "(rent, salaries, packaging) and storage capacity. They start empty because the case has none."],
      ["Read the result", "/ac-pnl", ": does the warehouse cover its costs, and how many units must it sell?"],
      ["Watch alerts", "/command-centre", "for products priced above market and a warehouse getting full."],
    ],
  },
  {
    who: "Sales team (bulk buyers and Prerna 365 gift boxes)",
    steps: [
      ["Record every buyer and order", "/buyers", ": confirmed orders (LoI or later) are what move a product to bulk."],
      ["Build a gift box", "/buyers", "from one warehouse's stock: the app prices it and blocks mixed boxes."],
      ["Run the capacity check", "/buyers", "before accepting a purchase order: can the SHGs make it in time?"],
    ],
  },
  {
    who: "District mission manager",
    steps: [
      ["Open Women's income", "/inclusion", "to see SHGs where fewer than half the members earn."],
      ["Plan inclusion with orders", "/inclusion", ": how many extra units it takes to bring more women in without cutting anyone's pay."],
    ],
  },
] as const;

const glossary = (c: RateCard): [string, string][] => [
  ["Warehouse (AC)", "Aggregation Centre: Bijnor or Lucknow. Collects, packs and ships SHG products."],
  ["Warehouse link", "The warehouse an SHG sends its goods to."],
  ["Online", `One parcel per order by courier: ${inr(c.onlineFirstKg)} for the first kg plus ${inr(c.onlineExtraKg)} for each extra kg or part.`],
  ["Bulk", `Many units together by shared truck to Prerna stores, canteens or institutions: ${inr(c.bulkPerKg)} per kg.`],
  ["Selling price", `SHG price + transport to the warehouse + warehouse margin (${pct(c.markup, 0)} of SHG price) + delivery to the buyer.`],
  ["Priced OK", "Selling price at or below the market price of a similar product. Above market = likely to struggle to sell."],
  ["Income at risk", "Money from products priced above market: the AC markup and the women's income on those products. An upper bound: some sales may continue."],
  ["Gross markup", `The AC's ${pct(c.markup, 0)} on the SHG price: its only income, before any AC cost. Not profit.`],
  ["Secure gross markup", "Gross markup from products priced OK. Whether it covers an AC's costs is unknown until costs are collected."],
  ["Multi-pack", "Several units sold as one online order, so they share one courier charge."],
  ["Floor / ceiling", "Floor: products priced OK after re-linking alone (no buyers needed). Ceiling: once every pack is accepted and every bulk unit has a buyer."],
  ["Transport band", `Transport to the warehouse is charged by distance band (${c.bands.map((b) => inr(b.ratePerKg)).join(" / ")} per kg), not per km. Moving closer only helps if it changes the band.`],
  ["Assumption", "A value the case does not give (for example packaging cost). Marked with a grey tag and editable under Assumptions."],
  ["To collect", "Data UPSRLM must gather (warehouse costs, capacity, buyers). Never filled with made-up numbers."],
];

export default function Start() {
  const { state, set } = useStore();
  const m = useModel();
  const total = m.results.S0.rows.length;
  const stores = state.levers.prernaStores;

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-navy">Prerna 360: start here</h1>
      <p className="mt-1 max-w-3xl text-[14px] text-[#1f2933]">
        From October 2027 the Bijnor and Lucknow warehouses must add transport costs to the price of every Prerna product.
        This app shows which products will then cost more than the market, and what to change so they keep selling and the women keep earning.
      </p>

      <div className="my-5 space-y-3">
        <HeadlineCards />
        <ExposureSplit />
      </div>

      <Section title="Two root causes, two fixes">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border border-line p-3 text-[13px]">
            <div className="font-semibold text-navy">1. Wrong warehouse → Fix warehouse links</div>
            Many SHGs in central and eastern UP still send goods to Bijnor because they were linked before Lucknow opened. Transport is charged by distance band, so switching them to Lucknow cuts the cost.
          </div>
          <div className="rounded border border-line p-3 text-[13px]">
            <div className="font-semibold text-navy">2. Courier cost on cheap, heavy staples → multi-packs and buyer-backed bulk</div>
            Atta, jaggery, mustard oil, garam masala and detergent pay {inr(m.data.rateCard.onlineFirstKg)}+ courier per online order. Jaggery and garam masala fit under market as online multi-packs (one parcel, several units).
            Atta, detergent and mustard oil fit in bulk by truck at {inr(m.data.rateCard.bulkPerKg)}/kg, but only once an institution commits to buy.
          </div>
        </div>
      </Section>

      <Section title="The plans" note="Pick a plan with the Plan buttons at the top of any page. The hybrid's count depends on buyers: shown here with no bulk buyer yet and 75% pack acceptance (assumption).">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Plan</th>
                <th>What changes</th>
                <th className="r">Products priced OK</th>
                <th className="r">Income at risk (warehouse + women)</th>
                <th className="r">Transport cost</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {SCENARIOS.map((sc) => {
                const s = m.results[sc.id].summary;
                return (
                  <tr key={sc.id}>
                    <td className="font-semibold">{sc.name}</td>
                    <td className="whitespace-normal"><div className="min-w-[260px] max-w-xl">{sc.what}</div></td>
                    <td className={clsx("r tabular-nums", s.competitiveCount < total && "above-market")}>{num(s.competitiveCount)} of {num(total)}</td>
                    <td className={clsx("r tabular-nums", s.acMarkupAtRisk + s.shgIncomeAtRisk > 0 && "above-market")}>{inr(s.acMarkupAtRisk + s.shgIncomeAtRisk)}</td>
                    <td className="r tabular-nums">{inr(s.logisticsOutlay)}</td>
                    <td>
                      <Link href="/command-centre" className="text-navy underline" onClick={() => set("scenario", sc.id)}>View</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section title="If orders today are mostly online, how can anything move to bulk?">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="space-y-2 text-[13px] leading-relaxed">
            <p>
              <b>It can&apos;t be switched overnight</b>, and the recommended plan doesn&apos;t try to. Today&apos;s online customers will not become bulk buyers.
              So the plan <b>fixes the AC links now</b> (no buyers needed) and <b>moves products only when buyers commit</b>:
            </p>
            <ul className="list-disc space-y-1 pl-5">
              <li><b>Jaggery and garam masala stay online as multi-packs</b>: several units share one courier parcel, which brings the price per unit under market.</li>
              <li><b>Atta, detergent and mustard oil move to institutional bulk</b> (canteens, hostels, offices, government buyers on GeM SARAS) <b>only after a buyer signs</b> a letter of intent or purchase order. Until then they keep selling online.</li>
            </ul>
            <p>Products that already sell well online (honey, brass, zari, chikankari, sarees, ghee, toys) stay online. Prerna Saras stores ({num(stores)}) are one more outlet to test.</p>
          </div>
          <BulkComparison />
        </div>
      </Section>

      <Section title="Who uses it, and how (monthly)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {ROLES.map((r) => (
            <div key={r.who} className="rounded border border-line p-3">
              <div className="mb-1 text-[13px] font-bold text-navy">{r.who}</div>
              <ol className="list-decimal space-y-1 pl-5 text-[12.5px]">
                {r.steps.map(([label, href, rest]) => (
                  <li key={label}>
                    <Link href={href} className="font-semibold text-navy underline">{label}</Link> {rest}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Words used in this app">
        <TableWrap>
          <table className="tbl">
            <tbody>
              {glossary(m.data.rateCard).map(([k, v]) => (
                <tr key={k}>
                  <td className="w-48 font-semibold">{k}</td>
                  <td className="whitespace-normal">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="mt-2 text-[11.5px] text-grey">
          Overall participation today: {pct(m.social.summary.participation)} of members earn from their SHG&apos;s product. Numbers are calculated from the case data; inputs you type are saved in this browser only.
        </p>
      </Section>
    </div>
  );
}
