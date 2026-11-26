"use client";

import Link from "next/link";
import clsx from "clsx";
import { Loading, Section, TableWrap } from "@/components/ui";
import { SCENARIOS, type RateCard } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { useModel } from "@/lib/model";
import { useStore } from "@/lib/store";

const ROLES = [
  {
    who: "State marketing team (monthly review)",
    steps: [
      ["Open Overview", "/command-centre", "and switch between Today and Fix both: how many products are priced OK, how much income is at risk."],
      ["Check the action list", "/command-centre", "on Overview: which SHGs to move and which products to sell in bulk."],
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
      ["Record every buyer and order", "/buyers", "so a move to bulk is backed by real demand, not hope."],
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
  ["Income at risk", "Money from products priced above market: the warehouse margin and the women's income on those products."],
  ["Safe warehouse income", "Warehouse margin from products priced OK. This is what the warehouse can count on to pay its costs."],
  ["Transport band", `Transport to the warehouse is charged by distance band (${c.bands.map((b) => inr(b.ratePerKg)).join(" / ")} per kg), not per km. Moving closer only helps if it changes the band.`],
  ["Assumption", "A value the case does not give (for example packaging cost). Marked with a grey tag and editable under Assumptions."],
  ["To collect", "Data UPSRLM must gather (warehouse costs, capacity, buyers). Never filled with made-up numbers."],
];

export default function Start() {
  const { state, set, hydrated } = useStore();
  const m = useModel();
  if (!hydrated) return <Loading />;
  const s0 = m.results.S0.summary;
  const total = m.results.S0.rows.length;
  const bulk = m.bulkDemandS3;
  const needed = bulk.reduce((t, b) => t + b.unitsNeeded, 0);
  const confirmed = bulk.reduce((t, b) => t + Math.min(b.confirmed, b.unitsNeeded), 0);
  const stores = state.levers.prernaStores;

  return (
    <div className="max-w-6xl">
      <h1 className="text-2xl font-bold text-navy">Prerna 360: start here</h1>
      <p className="mt-1 max-w-3xl text-[14px] text-[#1f2933]">
        From October 2027 the Bijnor and Lucknow warehouses must add transport costs to the price of every Prerna product.
        This app shows which products will then cost more than the market, and what to change so they keep selling and the women keep earning.
      </p>

      <div className="my-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border border-orange/40 bg-orange/5 p-3">
          <div className="text-[11px] font-semibold text-grey uppercase">If nothing changes</div>
          <div className="mt-1 text-[15px]"><b className="text-orange">{num(total - s0.competitiveCount)} of {num(total)}</b> products cost more than the market.</div>
        </div>
        <div className="rounded border border-orange/40 bg-orange/5 p-3">
          <div className="text-[11px] font-semibold text-grey uppercase">Warehouse income at risk</div>
          <div className="mt-1 text-[15px]"><b className="text-orange">{inr(s0.acMarkupAtRisk)}</b> a month of {inr(s0.acMarkupTotal)}.</div>
        </div>
        <div className="rounded border border-orange/40 bg-orange/5 p-3">
          <div className="text-[11px] font-semibold text-grey uppercase">Women&apos;s income at risk</div>
          <div className="mt-1 text-[15px]"><b className="text-orange">{inr(s0.shgIncomeAtRisk)}</b> a month, earned by {num(s0.womenActiveAtRisk)} women.</div>
        </div>
      </div>

      <Section title="Two root causes, two fixes">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded border border-line p-3 text-[13px]">
            <div className="font-semibold text-navy">1. Wrong warehouse → Fix warehouse links</div>
            Many SHGs in central and eastern UP still send goods to Bijnor because they were linked before Lucknow opened. Transport is charged by distance band, so switching them to Lucknow cuts the cost.
          </div>
          <div className="rounded border border-line p-3 text-[13px]">
            <div className="font-semibold text-navy">2. Wrong sales channel → Fix sales channels</div>
            Cheap, heavy staples (atta, jaggery, mustard oil, masala, detergent) pay {inr(m.data.rateCard.onlineFirstKg)}+ courier per online order. Sold in bulk by truck at {inr(m.data.rateCard.bulkPerKg)}/kg, they fit under the market price.
          </div>
        </div>
      </Section>

      <Section title="The four plans" note="Pick a plan with the Plan buttons at the top of any page. Overview, Prices & channels and Compare plans then show that plan.">
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

      <Section title="Can products really move from online to bulk, if orders today are mostly online?">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="space-y-2 text-[13px] leading-relaxed">
            <p>
              <b>Not by flipping a switch.</b> Today&apos;s online customers will not turn into bulk buyers. The point is different: from October 2027 these staples will cost more online than in a local shop,
              so <b>online sales are likely to fall anyway</b>. The question is whether someone else will buy them in bulk at the lower bulk price.
            </p>
            <p><b>Who could buy in bulk:</b> Prerna Saras stores ({num(stores)} across UP), Prerna canteens, government buyers through GeM SARAS, hostels, hotels, and corporate gift boxes (Prerna 365).</p>
            <p>
              <b>Rule in this app:</b> a move to bulk is a <b>target until a buyer commits</b>. Record buyers and their letters of intent or purchase orders under Buyers &amp; gift boxes;
              the app shows how much of the bulk volume is confirmed. The research suggests piloting in a small group of stores first; switch the rest only when the orders are real.
            </p>
            <p className="text-grey">Products that already sell well online (honey, brass, zari, chikankari, sarees, ghee, toys) stay online.</p>
          </div>
          <div className="rounded border border-line p-3 text-[13px]">
            <div className="text-[11px] font-semibold text-grey uppercase">Recommended plan: bulk volume needed vs confirmed</div>
            <div className="mt-1 text-2xl font-bold text-navy">{num(confirmed)} <span className="text-[14px] font-semibold text-grey">of {num(needed)} units a month confirmed</span></div>
            <div className="mt-2 h-2 w-full rounded bg-tint">
              <div className="h-2 rounded bg-navy" style={{ width: `${needed ? Math.min(100, (confirmed / needed) * 100) : 0}%` }} />
            </div>
            <ul className="mt-2 space-y-0.5">
              {bulk.map((b) => (
                <li key={b.shgId} className="flex justify-between gap-2">
                  <span>{b.shgId} {b.product}</span>
                  <span className={clsx("tabular-nums", b.gap > 0 ? "text-orange" : "text-ok")}>{num(Math.min(b.confirmed, b.unitsNeeded))} / {num(b.unitsNeeded)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-grey">
              That is about {num(needed / stores, 1)} units per Prerna Saras store per month. <Link className="text-navy underline" href="/buyers">Record buyers and orders</Link>.
            </p>
          </div>
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
