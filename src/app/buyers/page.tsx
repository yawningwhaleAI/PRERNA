"use client";

import clsx from "clsx";
import { useState } from "react";
import { AssumptionTag, HowTo, Note, PageHeader, Pill, Section, TableWrap, ToCollect } from "@/components/ui";
import { capacityCheck, priceBox, type BoxItemInput } from "@/lib/engine";
import { inr, num, pct } from "@/lib/format";
import { SHG, useModel } from "@/lib/model";
import { BUYER_TYPES, STAGES, newId, useStore, type Box, type Buyer, type BuyerType, type Commitment, type Stage } from "@/lib/store";

export default function BuyersAndBoxes() {
  const { state, set } = useStore();
  const m = useModel();
  const [draft, setDraft] = useState<{ id: string | null; name: string; tier: Box["tier"]; items: Record<string, number> }>({
    id: null,
    name: "",
    tier: "Essentials",
    items: {},
  });
  const [buyer, setBuyer] = useState<Omit<Buyer, "id">>({ name: "", type: "Corporate", owner: "", stage: "Lead" });
  const [com, setCom] = useState<Omit<Commitment, "id">>({ buyerId: "", kind: "box", refId: "", quantity: 0, deliveryMonth: "", stage: "LoI", leadTimeMonths: null });

  const plan = m.results.SH.plan; // boxes use the recommended plan's AC links (re-linked), including what-if overrides
  const L = state.levers;
  const draftItems: BoxItemInput[] = Object.entries(draft.items).filter(([, q]) => q > 0).map(([shgId, qty]) => ({ shgId, qty }));
  const draftPriced = priceBox(m.data, draftItems, plan, L);
  const priced = state.boxes.map((b) => ({ box: b, p: priceBox(m.data, b.items, plan, L) }));

  const saveBox = () => {
    if (!draftPriced.ok || !draft.name.trim()) return;
    const box: Box = { id: draft.id ?? newId("box"), name: draft.name.trim(), tier: draft.tier, items: draftItems };
    set("boxes", (bs) => (draft.id ? bs.map((b) => (b.id === draft.id ? box : b)) : [...bs, box]));
    setDraft({ id: null, name: "", tier: "Essentials", items: {} });
  };

  const commitmentNeeds = (c: Commitment) =>
    c.kind === "sku"
      ? [{ shgId: c.refId, units: c.quantity }]
      : (state.boxes.find((b) => b.id === c.refId)?.items ?? []).map((it) => ({ shgId: it.shgId, units: it.qty * c.quantity }));

  return (
    <div>
      <PageHeader title="Buyers & gift boxes" question="Which demand is actually confirmed? Bulk buyers, Prerna 365 gift boxes and whether SHGs can make the order in time." />

      <HowTo
        steps={[
          <><b>Build a gift box</b> by entering how many of each product go in. Products must come from one warehouse (the app blocks mixed boxes); it prices the box and shows what the women and the warehouse earn.</>,
          <><b>Add buyers</b>: Prerna stores, canteens, government (GeM), hotels, companies. Move them along the stages as talks progress.</>,
          <><b>Record orders</b> (a box or a single product, quantity, delivery month, lead time). The capacity check tells you if the SHGs can make it in time and how many more women it would take.</>,
          <>Orders at <b>LoI</b> (letter of intent) or later count as confirmed. They show up as &quot;bulk buyers confirmed&quot; on the Overview and Prices pages.</>,
        ]}
      >
        Stages: Lead (first contact) → Sample (sample sent) → LoI (letter of intent) → PO (purchase order) → Delivered → Repeat.
      </HowTo>

      <Section
        title="Step 1: Build a gift box"
        note={
          <>
            All products must come from one warehouse (as linked in the recommended plan). Box price = each product&apos;s price at the warehouse + packaging + delivery.
            Packaging of {inr(L.packagingPerBox)} per box and an order of {num(L.boxesPerOrder)} boxes are assumptions<AssumptionTag /> (change them under Assumptions).
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded border border-line p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              <input className="field flex-1" placeholder="Box name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} aria-label="Box name" />
              <select className="field" value={draft.tier} onChange={(e) => setDraft({ ...draft, tier: e.target.value as Box["tier"] })} aria-label="Tier">
                <option>Essentials</option>
                <option>Signature</option>
              </select>
            </div>
            {(["Bijnor", "Lucknow"] as const).map((ac) => (
              <div key={ac} className="mb-2">
                <div className="mb-1 text-[11px] font-semibold text-grey uppercase">From {ac} warehouse</div>
                <div className="grid grid-cols-1 gap-x-3 gap-y-1 sm:grid-cols-2">
                  {m.data.shgs.filter((s) => plan[s.id]!.ac === ac).map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-[12.5px]">
                      <input
                        type="number"
                        min={0}
                        className="field w-14 py-0.5 text-right"
                        value={draft.items[s.id] ?? 0}
                        onChange={(e) => setDraft({ ...draft, items: { ...draft.items, [s.id]: Math.max(0, Math.floor(Number(e.target.value) || 0)) } })}
                        aria-label={`Quantity of ${s.id}`}
                        data-testid={`qty-${s.id}`}
                      />
                      <span>{s.id} {s.product}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <div className="mt-3 flex gap-2">
              <button className="btn btn-primary" disabled={!draftPriced.ok || !draft.name.trim()} onClick={saveBox}>
                {draft.id ? "Update box" : "Save box"}
              </button>
              <button className="btn" onClick={() => setDraft({ id: null, name: "", tier: "Essentials", items: {} })}>Clear</button>
            </div>
          </div>
          <div>
            {draftPriced.ok ? (
              <BoxCard p={draftPriced} />
            ) : (
              <div className={clsx("rounded border p-3 text-sm", draftPriced.reason === "mixed-ac" ? "border-orange bg-orange/5" : "border-line")} data-testid="box-status">
                <div className={clsx("font-semibold", draftPriced.reason === "mixed-ac" ? "text-orange" : "text-grey")}>{draftPriced.message}</div>
                {draftPriced.acs && (
                  <ul className="mt-2 text-[12.5px]">
                    {draftPriced.acs.map((a) => (
                      <li key={a.shgId}>{a.shgId} {SHG.get(a.shgId)?.product}: ships from <b>{a.ac}</b></li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section title="Saved gift boxes">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Box</th>
                <th>Warehouse</th>
                <th className="r">kg</th>
                <th className="r">Price, truck delivery</th>
                <th className="r">Price, courier</th>
                <th className="r">Market price of contents</th>
                <th className="r">Below market (truck)</th>
                <th className="r">Below market (courier)</th>
                <th className="r">Women earn / box</th>
                <th className="r">Warehouse earns / box</th>
                <th className="r">Women earn / order</th>
                <th className="r">Warehouse earns / order</th>
                <th className="r">Months to make one order</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {priced.map(({ box, p }) => (
                <tr key={box.id}>
                  <td className="font-semibold">
                    {box.name} {box.illustrative && <AssumptionTag title="Illustrative box from the analysis, not an order" />}
                  </td>
                  {p.ok ? (
                    <>
                      <td>{p.ac}</td>
                      <td className="r tabular-nums">{num(p.kg, 1)}</td>
                      <td className={clsx("r tabular-nums", p.spBulk > p.sumMarket && "above-market")}>{inr(p.spBulk)}</td>
                      <td className={clsx("r tabular-nums", p.spCourier > p.sumMarket && "above-market")}>{inr(p.spCourier)}</td>
                      <td className="r tabular-nums">{inr(p.sumMarket)}</td>
                      <td className={clsx("r tabular-nums", p.headroomBulk < 0 && "above-market")}>{pct(p.headroomBulk)}</td>
                      <td className={clsx("r tabular-nums", p.headroomCourier < 0 && "above-market")}>{pct(p.headroomCourier)}</td>
                      <td className="r tabular-nums">{inr(p.shgIncomePerBox)}</td>
                      <td className="r tabular-nums">{inr(p.acMarkupPerBox)}</td>
                      <td className="r tabular-nums">{inr(p.shgIncomePerOrder)}</td>
                      <td className="r tabular-nums">{inr(p.acMarkupPerOrder)}</td>
                      <td className="r tabular-nums">{num(p.monthsOfOutput, 1)} ({p.bindingSku})</td>
                    </>
                  ) : (
                    <td colSpan={12} className="above-market whitespace-normal">{p.message} Re-check this box after the what-if change.</td>
                  )}
                  <td className="space-x-1">
                    <button
                      className="text-xs text-navy underline"
                      onClick={() => setDraft({ id: box.id, name: box.name, tier: box.tier, items: Object.fromEntries(box.items.map((i) => [i.shgId, i.qty])) })}
                    >
                      Edit
                    </button>
                    <button className="text-xs text-orange underline" onClick={() => set("boxes", (bs) => bs.filter((b) => b.id !== box.id))}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <Note>
          Truck delivery sends the whole order to the buyer in one go at the bulk rate; courier sends each box as a separate parcel. &quot;Months to make one order&quot; uses the slowest product (shown in brackets) at today&apos;s monthly output.
          Gift purchases are normal procurement, not CSR spend.
        </Note>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Section title="Step 2: Add buyers" note="Organisations only (no personal details). Buyer demand is not in the case, so this list starts empty.">
          <div className="mb-2 flex flex-wrap gap-2">
            <input className="field flex-1" placeholder="Organisation" value={buyer.name} onChange={(e) => setBuyer({ ...buyer, name: e.target.value })} aria-label="Buyer organisation" />
            <select className="field" value={buyer.type} onChange={(e) => setBuyer({ ...buyer, type: e.target.value as BuyerType })} aria-label="Buyer type">
              {BUYER_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <input className="field w-36" placeholder="Owner (team/role)" value={buyer.owner} onChange={(e) => setBuyer({ ...buyer, owner: e.target.value })} aria-label="Owner" />
            <select className="field" value={buyer.stage} onChange={(e) => setBuyer({ ...buyer, stage: e.target.value as Stage })} aria-label="Stage">
              {STAGES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button
              className="btn btn-primary"
              disabled={!buyer.name.trim()}
              onClick={() => {
                set("buyers", (bs) => [...bs, { ...buyer, id: newId("buyer"), name: buyer.name.trim() }]);
                setBuyer({ name: "", type: "Corporate", owner: "", stage: "Lead" });
              }}
            >
              Add buyer
            </button>
          </div>
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>Buyer</th><th>Type</th><th>Owner</th><th>Stage</th><th /></tr>
              </thead>
              <tbody>
                {state.buyers.length === 0 && (
                  <tr><td colSpan={5}><ToCollect>no buyers yet</ToCollect></td></tr>
                )}
                {state.buyers.map((b) => (
                  <tr key={b.id}>
                    <td className="font-semibold">{b.name}</td>
                    <td>{b.type}</td>
                    <td>{b.owner || "–"}</td>
                    <td>
                      <select className="field py-0.5" value={b.stage} onChange={(e) => set("buyers", (bs) => bs.map((x) => (x.id === b.id ? { ...x, stage: e.target.value as Stage } : x)))} aria-label={`Stage of ${b.name}`}>
                        {STAGES.map((t) => <option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td><button className="text-xs text-orange underline" onClick={() => set("buyers", (bs) => bs.filter((x) => x.id !== b.id))}>Delete</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        </Section>

        <Section title="Step 3: Record orders and check capacity" note="Compares the units ordered with what the SHGs make in the lead time at today's pace, and shows how many more earning women it would take.">
          <div className="mb-2 flex flex-wrap gap-2">
            <select className="field" value={com.buyerId} onChange={(e) => setCom({ ...com, buyerId: e.target.value })} aria-label="Commitment buyer">
              <option value="">Buyer…</option>
              {state.buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="field" value={`${com.kind}:${com.refId}`} onChange={(e) => { const [kind, refId] = e.target.value.split(":"); setCom({ ...com, kind: kind as "box" | "sku", refId: refId ?? "" }); }} aria-label="Box or SKU">
              <option value="box:">Gift box or product…</option>
              <optgroup label="Boxes">{state.boxes.map((b) => <option key={b.id} value={`box:${b.id}`}>{b.name}</option>)}</optgroup>
              <optgroup label="Single products">{m.data.shgs.map((s) => <option key={s.id} value={`sku:${s.id}`}>{s.id} {s.product}</option>)}</optgroup>
            </select>
            <input className="field w-24 text-right" type="number" min={0} placeholder={com.kind === "box" ? "Boxes" : "Units"} value={com.quantity || ""} onChange={(e) => setCom({ ...com, quantity: Math.max(0, Math.floor(Number(e.target.value) || 0)) })} aria-label="Quantity" />
            <input className="field" type="month" value={com.deliveryMonth} onChange={(e) => setCom({ ...com, deliveryMonth: e.target.value })} aria-label="Delivery month" />
            <input className="field w-28 text-right" type="number" min={0} step={0.5} placeholder="Lead (months)" value={com.leadTimeMonths ?? ""} onChange={(e) => setCom({ ...com, leadTimeMonths: e.target.value === "" ? null : Math.max(0, Number(e.target.value)) })} aria-label="Lead time in months" />
            <select className="field" value={com.stage} onChange={(e) => setCom({ ...com, stage: e.target.value as Stage })} aria-label="Commitment stage">
              {STAGES.map((t) => <option key={t}>{t}</option>)}
            </select>
            <button
              className="btn btn-primary"
              disabled={!com.buyerId || !com.refId || com.quantity <= 0 || !com.deliveryMonth}
              onClick={() => {
                set("commitments", (cs) => [...cs, { ...com, id: newId("com") }]);
                setCom({ ...com, quantity: 0 });
              }}
            >
              Add
            </button>
          </div>
          <TableWrap>
            <table className="tbl">
              <thead>
                <tr><th>Buyer</th><th>Gift box / product</th><th className="r">Quantity</th><th>Delivery month</th><th>Stage</th><th>Can SHGs make it in time?</th><th /></tr>
              </thead>
              <tbody>
                {state.commitments.length === 0 && <tr><td colSpan={7}><ToCollect>no orders yet</ToCollect></td></tr>}
                {state.commitments.map((c) => {
                  const b = state.buyers.find((x) => x.id === c.buyerId);
                  const ref = c.kind === "box" ? state.boxes.find((x) => x.id === c.refId)?.name : `${c.refId} ${SHG.get(c.refId)?.product ?? ""}`;
                  const cap = c.leadTimeMonths ? capacityCheck(m.data, commitmentNeeds(c), c.leadTimeMonths) : null;
                  return (
                    <tr key={c.id}>
                      <td>{b?.name ?? "–"}</td>
                      <td>{ref ?? "deleted"}</td>
                      <td className="r tabular-nums">{num(c.quantity)}</td>
                      <td>{c.deliveryMonth}</td>
                      <td>{c.stage}</td>
                      <td className="whitespace-normal">
                        {!cap ? (
                          <ToCollect>enter lead time</ToCollect>
                        ) : cap.ok ? (
                          <Pill tone="ok">Yes · slowest: {cap.binding?.shgId}, {num(cap.binding?.monthsOfOutput ?? 0, 1)} months of output</Pill>
                        ) : (
                          <span className="text-[12px]">
                            <Pill tone="orange">Not in time</Pill>{" "}
                            {cap.lines.filter((l) => !l.ok).map((l) => `${l.shgId}: needs ${num(l.unitsRequired)}, can make ${num(l.outputOverLeadTime)} (needs ${num(l.extraWomenNeeded)} more women)`).join("; ")}
                          </span>
                        )}
                      </td>
                      <td><button className="text-xs text-orange underline" onClick={() => set("commitments", (cs) => cs.filter((x) => x.id !== c.id))}>Delete</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
          <label className="mt-3 flex items-start gap-2 text-[12.5px]">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-[#204B75]" checked={state.useCommitted} onChange={(e) => set("useCommitted", e.target.checked)} />
            <span>
              Use confirmed orders as the monthly volume in all plans (orders at LoI or later replace the case&apos;s monthly units for those products).
              {m.committed.size > 0 ? ` Confirmed: ${[...m.committed.entries()].map(([k, v]) => `${k} ${num(v)} units`).join(", ")}.` : " No confirmed orders yet."}
            </span>
          </label>
        </Section>
      </div>
    </div>
  );
}

function BoxCard({ p }: { p: Extract<ReturnType<typeof priceBox>, { ok: true }> }) {
  const line = (label: string, v: string, cls?: string) => (
    <tr><td>{label}</td><td className={clsx("r tabular-nums", cls)}>{v}</td></tr>
  );
  return (
    <TableWrap>
      <table className="tbl" data-testid="box-status">
        <thead><tr><th>Box from {p.ac} · {num(p.kg, 1)} kg</th><th className="r">₹ per box</th></tr></thead>
        <tbody>
          {line("Products at warehouse price", inr(p.contentsLanded))}
          {line("Packaging (assumption)", inr(p.packaging))}
          {line("Delivery by truck (whole order together)", inr(p.deliveryBulk, 1))}
          {line("Delivery by courier (each box separately)", inr(p.deliveryCourier, 1))}
          {line("Box price, truck delivery", inr(p.spBulk), p.spBulk > p.sumMarket ? "above-market" : "font-semibold")}
          {line("Box price, courier", inr(p.spCourier), p.spCourier > p.sumMarket ? "above-market" : "")}
          {line("Market price of the same products", inr(p.sumMarket))}
          {line("Cheaper than market: truck / courier", `${pct(p.headroomBulk)} / ${pct(p.headroomCourier)}`)}
          {line("Women earn / warehouse earns per box", `${inr(p.shgIncomePerBox)} / ${inr(p.acMarkupPerBox)}`)}
          {line(`Per order of ${num(p.boxesPerOrder)} boxes`, `${inr(p.shgIncomePerOrder)} / ${inr(p.acMarkupPerOrder)}`)}
          {line("Months to make one order (slowest product)", `${num(p.monthsOfOutput, 1)} (${p.bindingSku})`)}
        </tbody>
      </table>
    </TableWrap>
  );
}
