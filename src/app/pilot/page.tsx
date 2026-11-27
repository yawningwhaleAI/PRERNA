"use client";

import clsx from "clsx";
import pilot from "@/data/pilot.json";
import hybridPlan from "@/data/hybrid-plan.json";
import { HowTo, Note, PageHeader, Pill, Section, TableWrap } from "@/components/ui";
import { workingCapitalHybrid } from "@/lib/engine";
import { inr, num } from "@/lib/format";
import { SHG, useModel } from "@/lib/model";
import { PILOT_STATUSES, useStore, type GateResult, type PilotStatus } from "@/lib/store";

const MONTHS = pilot.months;
const GATES = pilot.gates as { name: string; when: string; strands: string[]; criteria?: string }[];
const SHORT = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct"];

/** "Feb-Jul" → [startIndex, endIndex] on the Dec 2026 – Oct 2027 axis. */
function span(months: string): [number, number] {
  const [a, b] = months.split("-").map((x) => SHORT.indexOf(x.trim().slice(0, 3)));
  return [a ?? 0, b ?? a ?? 0];
}

/** Gate month index: "end-Apr 2027" → index of Apr. */
const gateIndex = (when: string) => SHORT.indexOf(when.replace("end-", "").slice(0, 3));

const statusTone = (s: PilotStatus) => (s === "Passed" ? "ok" : s === "Failed" ? "orange" : s === "At risk" ? "orange" : s === "On track" ? "navy" : "grey");

export default function Pilot() {
  const { state, set } = useStore();
  const m = useModel();
  const shgs = hybridPlan.pilotShgs.map((id) => SHG.get(id)!);
  const members = shgs.reduce((t, s) => t + s.members, 0);
  const earning = shgs.reduce((t, s) => t + s.active, 0);
  const wc = workingCapitalHybrid(m.data, state.levers, state.acOverrides);
  const status = (name: string): PilotStatus => state.pilotStatus[name] ?? "Not started";
  const gate = (name: string): GateResult => state.gateResult[name] ?? "Not decided";
  const strandRole = (id: string) =>
    hybridPlan.packs[id as keyof typeof hybridPlan.packs]
      ? "Multi-pack test"
      : hybridPlan.needsBuyer.includes(id)
        ? "Institutional buyers"
        : id === "SHG-16" || id === "SHG-17"
          ? "Re-link to Lucknow"
          : "Gift-box pre-booking";

  return (
    <div>
      <PageHeader title="Pilot & gates" question={`A six-month, buyer-gated pilot before the October 2027 transition (${pilot.window}).`} />

      <HowTo
        steps={[
          <>Each strand has an owner, a window, and a <b>proceed if</b> test. If the test fails, follow the <b>if not</b> column instead.</>,
          <>Update each strand&apos;s <b>status</b> as the pilot runs. At each gate, record <b>pass</b> or <b>fail</b>. Entries are saved in this browser.</>,
          <>Targets are proposed by the submission, not official UPSRLM targets.</>,
        ]}
      />

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Pilot scope</div>
          <div className="mt-0.5 text-2xl font-bold text-navy">{num(shgs.length)} SHGs</div>
          <div className="text-[12.5px]">{num(members)} members, {num(earning)} earning today</div>
        </div>
        <div className="rounded border border-line bg-white p-3">
          <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Gates</div>
          <div className="mt-0.5 text-2xl font-bold text-navy">{GATES.map((g) => g.when.replace(" 2027", "")).join(" · ")}</div>
          <div className="text-[12.5px]">2027; go-live October 2027</div>
        </div>
        <div className="rounded border border-orange/40 bg-orange/5 p-3">
          <div className="text-[11px] font-semibold tracking-wide text-grey uppercase">Unresolved</div>
          <div className="mt-0.5 text-2xl font-bold text-orange">Who funds working capital</div>
          <div className="text-[12.5px]">{inr(wc.wc(30))}–{inr(wc.wc(90))} if institutions pay in 30–90 days</div>
        </div>
      </div>

      <Section title="Timeline, Dec 2026 – Oct 2027">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr>
                <th>Strand · owner</th>
                {SHORT.map((mo, i) => (
                  <th key={mo} className="!px-1 text-center" title={MONTHS[i]}>{mo}</th>
                ))}
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pilot.strands.map((st) => {
                const [a, b] = span(st.months);
                return (
                  <tr key={st.name}>
                    <td className="whitespace-normal">
                      <div className="font-semibold">{st.name}</div>
                      <div className="text-[11px] text-grey">{st.owner}</div>
                    </td>
                    {SHORT.map((mo, i) => {
                      const g = GATES.find((x) => gateIndex(x.when) === i);
                      return (
                        <td key={mo} className={clsx("relative !px-0.5", g && "border-r-2 border-r-orange")}>
                          {i >= a && i <= b && <div className={clsx("h-3 rounded-sm", status(st.name) === "Failed" ? "bg-orange" : "bg-navy")} />}
                        </td>
                      );
                    })}
                    <td>
                      <select
                        className="field py-0.5"
                        aria-label={`Status of ${st.name}`}
                        value={status(st.name)}
                        onChange={(e) => set("pilotStatus", (p) => ({ ...p, [st.name]: e.target.value as PilotStatus }))}
                      >
                        {PILOT_STATUSES.map((x) => <option key={x}>{x}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {pilot.phases.map((ph) => {
                const [a, b] = span(ph.months);
                return (
                  <tr key={ph.name}>
                    <td className="text-grey italic">{ph.name}</td>
                    {SHORT.map((mo, i) => (
                      <td key={mo} className="!px-0.5">{i >= a && i <= b && <div className="h-3 rounded-sm bg-grey/40" />}</td>
                    ))}
                    <td />
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
        <Note>Orange lines mark the three gates. Grey rows come from the plan: AC cost reporting in Dec–Jan, a dry run on full costs in Aug–Sep, go-live in October.</Note>
      </Section>

      <Section title="Proceed if / if not">
        <TableWrap>
          <table className="tbl">
            <thead>
              <tr><th>Strand</th><th>Window</th><th>Proceed if</th><th>If not</th><th>Status</th></tr>
            </thead>
            <tbody>
              {pilot.strands.map((st) => (
                <tr key={st.name}>
                  <td className="font-semibold">{st.name}</td>
                  <td>{st.months.replace("-", "–")}</td>
                  <td className="min-w-[220px] whitespace-normal">{st.proceed_if.replace("INR ", "₹")}</td>
                  <td className="min-w-[200px] whitespace-normal">{st.if_not}</td>
                  <td><Pill tone={statusTone(status(st.name))}>{status(st.name)}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Section>

      <Section title="Gates">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {GATES.map((g) => {
            const strands = pilot.strands.filter((s) => g.strands.includes(s.name));
            const res = gate(g.name);
            return (
              <div key={g.name} className={clsx("rounded border bg-white p-3", res === "Pass" ? "border-ok" : res === "Fail" ? "border-orange" : "border-line")}>
                <div className="flex items-center justify-between">
                  <div className="text-[14px] font-bold text-navy">{g.name} · {g.when}</div>
                  <select
                    className="field py-0.5"
                    aria-label={`${g.name} result`}
                    value={res}
                    onChange={(e) => set("gateResult", (p) => ({ ...p, [g.name]: e.target.value as GateResult }))}
                  >
                    {(["Not decided", "Pass", "Fail"] as const).map((x) => <option key={x}>{x}</option>)}
                  </select>
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-[12.5px]">
                  {strands.map((s) => (
                    <li key={s.name}><b>{s.name}:</b> {s.proceed_if.replace("INR ", "₹")} <span className="text-grey">(if not: {s.if_not})</span></li>
                  ))}
                  {g.criteria && <li>{g.criteria.replace("-", "–")}</li>}
                </ul>
              </div>
            );
          })}
        </div>
      </Section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Pilot SHGs">
          <TableWrap>
            <table className="tbl">
              <thead><tr><th>SHG</th><th>Product</th><th>District</th><th>Pilot strand</th><th className="r">Members</th><th className="r">Earning</th></tr></thead>
              <tbody>
                {shgs.map((s) => (
                  <tr key={s.id}><td className="font-semibold">{s.id}</td><td>{s.product}</td><td>{s.district}</td><td>{strandRole(s.id)}</td><td className="r">{num(s.members)}</td><td className="r">{num(s.active)}</td></tr>
                ))}
              </tbody>
              <tfoot><tr><td colSpan={4}>Total</td><td className="r">{num(members)}</td><td className="r">{num(earning)}</td></tr></tfoot>
            </table>
          </TableWrap>
        </Section>
        <Section title="Three decisions for UPSRLM">
          <ol className="space-y-2">
            {pilot.decisions.map((d, i) => (
              <li key={i} className={clsx("rounded border bg-white p-3 text-[13px]", i === 2 ? "border-orange/50" : "border-line")}>
                <span className="mr-2 inline-block h-6 w-6 rounded-full bg-navy text-center text-[13px] leading-6 font-bold text-white">{i + 1}</span>
                {i === 2 ? (
                  <>
                    Approve the six-month pilot. <Pill tone="orange">Unresolved: working capital funding</Pill>{" "}
                    <span className="text-grey">({inr(wc.wc(30))}–{inr(wc.wc(90))} tied up if institutions pay in 30–90 days)</span>
                  </>
                ) : (
                  d
                )}
              </li>
            ))}
          </ol>
        </Section>
      </div>
    </div>
  );
}
