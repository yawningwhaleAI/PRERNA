"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, type ReactNode } from "react";
import { DEFAULT_LEVERS, SCENARIOS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { LeversDrawer } from "./levers-drawer";

/** Credit line (P0-5). Contact details are deliberately not shown. */
export const CREDIT = "Prototype by Aryan Singh for the GDi Partners Consultant case, Round 1 · not an official Government of Uttar Pradesh website";

export const NAV = [
  { href: "/start", label: "Start here", hint: "What this app does and how to use it" },
  { href: "/command-centre", label: "Overview", hint: "Is the plan working? What needs attention?" },
  { href: "/allocation", label: "Warehouse links", hint: "Which warehouse should each SHG send to?" },
  { href: "/products", label: "Prices & channels", hint: "Is each product priced right? Online or bulk?" },
  { href: "/scenarios", label: "Compare plans", hint: "All plans side by side; demand scenarios" },
  { href: "/pilot", label: "Pilot & gates", hint: "Six-month buyer-gated pilot, Dec 2026 – Oct 2027" },
  { href: "/buyers", label: "Buyers & gift boxes", hint: "Orders, gift boxes and capacity checks" },
  { href: "/inclusion", label: "Women's income", hint: "Who earns, who is left out" },
  { href: "/ac-pnl", label: "Warehouse finances", hint: "Does each warehouse cover its costs?" },
  { href: "/data", label: "Data & sources", hint: "Where every number comes from" },
];

/** Pages whose numbers change with the selected plan. */
const PLAN_PAGES = ["/command-centre", "/products", "/scenarios"];

export function Shell({ children, hasUpEmblem = false }: { children: ReactNode; hasUpEmblem?: boolean }) {
  const path = usePathname();
  const { state, set } = useStore();
  const [open, setOpen] = useState(false);
  const leversChanged = JSON.stringify(state.levers) !== JSON.stringify(DEFAULT_LEVERS);
  const plan = SCENARIOS.find((s) => s.id === state.scenario)!;
  const showPlan = PLAN_PAGES.some((p) => path.startsWith(p));
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-line bg-white">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
          <Link href="/start" className="flex items-center gap-2.5">
            {hasUpEmblem && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src="/up-emblem.png" alt="Government of Uttar Pradesh" width={40} height={40} className="h-10 w-10 object-contain" />
            )}
            <Image src="/gdi.png" alt="GDi Partners" width={40} height={40} priority />
            <div className="leading-tight">
              <div className="text-[15px] font-bold text-navy">Prerna 360</div>
              <div className="text-[10.5px] text-grey">Helps UPSRLM run the Bijnor and Lucknow aggregation centres</div>
              <div className="text-[9.5px] font-semibold text-orange">{CREDIT}</div>
            </div>
          </Link>
          <div className="flex min-w-0 flex-wrap items-center gap-3 md:ml-auto">
            <div className="flex min-w-0 items-center gap-1.5" role="group" aria-label="Plan">
              <span className="text-[11px] font-semibold text-grey uppercase">Plan</span>
              <div className="flex min-w-0 flex-wrap gap-px overflow-hidden rounded border border-navy bg-navy">
                {SCENARIOS.map((s) => (
                  <button
                    key={s.id}
                    data-testid={`scenario-${s.id}`}
                    title={s.what}
                    onClick={() => set("scenario", s.id)}
                    className={clsx(
                      "px-2.5 py-1 text-xs font-semibold",
                      state.scenario === s.id ? "bg-navy text-white" : "bg-white text-navy hover:bg-tint",
                    )}
                  >
                    {s.short}
                    {s.recommended && <span className={clsx("ml-1 text-[9px] uppercase", state.scenario === s.id ? "text-white/80" : "text-orange")}>recommended</span>}
                  </button>
                ))}
              </div>
            </div>
            <button className="btn relative" onClick={() => setOpen(true)} data-testid="open-levers" title="Change the assumptions behind the numbers">
              Assumptions
              {leversChanged && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange" title="Assumptions changed from defaults" />}
            </button>
          </div>
        </div>
        {showPlan && (
          <div className="border-t border-line bg-tint px-4 py-1.5 text-[12px] text-navy">
            <b>Showing plan: {plan.name}.</b> {plan.what}
          </div>
        )}
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-tint px-2 py-2 md:w-56 md:flex-col md:border-r md:border-b-0 md:py-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              title={n.hint}
              className={clsx(
                "rounded px-3 py-2 whitespace-nowrap md:whitespace-normal",
                path.startsWith(n.href) ? "bg-navy text-white" : "text-navy hover:bg-white",
              )}
            >
              <div className="text-[13px] font-semibold">{n.label}</div>
              <div className={clsx("hidden text-[10.5px] leading-snug md:block", path.startsWith(n.href) ? "text-white/80" : "text-grey")}>{n.hint}</div>
            </Link>
          ))}
          <div className="mt-auto hidden px-3 pt-6 text-[10.5px] leading-snug text-grey md:block">
            All money is ₹ per month unless stated. Case data are illustrative. Every number is calculated from the case data and the assumptions.
          </div>
        </nav>
        <main className="flex min-w-0 flex-1 flex-col px-4 py-5 md:px-6">
          <div className="flex-1">{children}</div>
          <footer className="mt-8 border-t border-line pt-3 text-[11px] text-grey">
            {CREDIT}. Case data are illustrative; every number is calculated from the case dataset and the stated assumptions.
          </footer>
        </main>
      </div>
      <LeversDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
