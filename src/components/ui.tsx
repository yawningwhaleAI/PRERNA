"use client";

import clsx from "clsx";
import type { ReactNode } from "react";

export function PageHeader({ title, question, children }: { title: string; question?: string; children?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
      <div>
        <h1 className="text-xl font-bold text-navy">{title}</h1>
        {question && <p className="mt-0.5 text-sm text-grey">{question}</p>}
      </div>
      {children}
    </div>
  );
}

export function Section({ title, note, children, right }: { title: string; note?: ReactNode; children: ReactNode; right?: ReactNode }) {
  return (
    <section className="mb-7">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-[15px] font-bold text-navy">{title}</h2>
        {right}
      </div>
      {note && <p className="mb-2 max-w-4xl text-xs text-grey">{note}</p>}
      {children}
    </section>
  );
}

export function Kpi({ label, value, sub, alert, tag }: { label: string; value: ReactNode; sub?: ReactNode; alert?: boolean; tag?: ReactNode }) {
  return (
    <div className="rounded border border-line bg-white px-3 py-2.5">
      <div className="flex items-start justify-between gap-1 text-[11px] font-semibold tracking-wide text-grey uppercase">
        <span>{label}</span>
        {tag}
      </div>
      <div className={clsx("mt-1 text-xl font-bold tabular-nums", alert ? "text-orange" : "text-navy")}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-grey">{sub}</div>}
    </div>
  );
}

/** Small grey tag for assumption-driven values (CLAUDE.md rule 4). */
export function AssumptionTag({ title, onDark }: { title?: string; onDark?: boolean }) {
  return (
    <span
      title={title ?? "Assumption-driven value"}
      className={clsx(
        "ml-1 inline-block rounded-sm border px-1 align-middle text-[9px] font-semibold tracking-wide uppercase",
        onDark ? "border-white/60 text-white" : "border-grey/40 text-grey",
      )}
    >
      assumption
    </span>
  );
}

/** Data not in the case that UPSRLM must collect. */
export function ToCollect({ children = "to collect" }: { children?: ReactNode }) {
  return <span className="inline-block rounded-sm bg-orange/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-orange uppercase">{children}</span>;
}

export function Pill({ children, tone = "navy" }: { children: ReactNode; tone?: "navy" | "orange" | "grey" | "ok" }) {
  const c = {
    navy: "bg-tint text-navy",
    orange: "bg-orange/10 text-orange",
    grey: "bg-gray-100 text-grey",
    ok: "bg-green-50 text-ok",
  }[tone];
  return <span className={clsx("inline-block rounded-sm px-1.5 py-0.5 text-[11px] font-semibold", c)}>{children}</span>;
}

export function TableWrap({ children, maxH }: { children: ReactNode; maxH?: number }) {
  return (
    <div className="overflow-auto rounded border border-line" style={maxH ? { maxHeight: maxH } : undefined}>
      {children}
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p className="mt-2 max-w-4xl text-[11.5px] leading-relaxed text-grey">{children}</p>;
}

export function Loading() {
  return <div className="p-8 text-sm text-grey">Loading saved inputs…</div>;
}

/** "How to use this page" box: plain steps for staff. */
export function HowTo({ steps, children }: { steps: ReactNode[]; children?: ReactNode }) {
  return (
    <details open className="mb-5 rounded border border-line bg-[#f7f9fb] px-3 py-2 text-[12.5px]">
      <summary className="cursor-pointer font-semibold text-navy">How to use this page</summary>
      <ol className="mt-1.5 list-decimal space-y-0.5 pl-5 text-[#1f2933]">
        {steps.map((s, i) => (
          <li key={i}>{s}</li>
        ))}
      </ol>
      {children && <div className="mt-1.5 text-grey">{children}</div>}
    </details>
  );
}
