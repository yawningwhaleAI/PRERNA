"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useEffect, useState, type ReactNode } from "react";
import { DEFAULT_LEVERS, SCENARIOS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { LeversDrawer } from "./levers-drawer";

export const NAV = [
  { href: "/command-centre", label: "Command Centre" },
  { href: "/allocation", label: "Allocation" },
  { href: "/products", label: "Products & Channel" },
  { href: "/scenarios", label: "Scenarios" },
  { href: "/buyers", label: "Buyers & Boxes" },
  { href: "/inclusion", label: "Inclusion" },
  { href: "/ac-pnl", label: "AC P&L" },
  { href: "/data", label: "Data" },
];

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { state, set } = useStore();
  const [open, setOpen] = useState(false);
  const leversChanged = JSON.stringify(state.levers) !== JSON.stringify(DEFAULT_LEVERS);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-white px-4 py-2">
        <div className="flex items-center gap-2.5">
          <UpEmblem />
          <Image src="/gdi.png" alt="GDi" width={40} height={40} priority />
          <div className="leading-tight">
            <div className="text-[15px] font-bold text-navy">Prerna 360</div>
            <div className="text-[10.5px] text-grey">Aggregation Centre decision support · UPSRLM × GDi</div>
            <div className="text-[9.5px] font-semibold text-orange">Prototype · not an official Government of Uttar Pradesh website</div>
          </div>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5" role="group" aria-label="Scenario">
            <span className="text-[11px] font-semibold text-grey uppercase">Scenario</span>
            <div className="flex overflow-hidden rounded border border-navy">
              {SCENARIOS.map((s) => (
                <button
                  key={s.id}
                  data-testid={`scenario-${s.id}`}
                  title={s.label}
                  onClick={() => set("scenario", s.id)}
                  className={clsx(
                    "px-2.5 py-1 text-xs font-semibold",
                    state.scenario === s.id ? "bg-navy text-white" : "bg-white text-navy hover:bg-tint",
                  )}
                >
                  {s.short}
                </button>
              ))}
            </div>
          </div>
          <button className="btn relative" onClick={() => setOpen(true)} data-testid="open-levers">
            Levers
            {leversChanged && <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-orange" title="Levers changed from defaults" />}
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col md:flex-row">
        <nav className="flex shrink-0 gap-1 overflow-x-auto border-b border-line bg-tint px-2 py-2 md:w-52 md:flex-col md:border-r md:border-b-0 md:py-4">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={clsx(
                "rounded px-3 py-2 text-[13px] font-semibold whitespace-nowrap",
                path.startsWith(n.href) ? "bg-navy text-white" : "text-navy hover:bg-white",
              )}
            >
              {n.label}
            </Link>
          ))}
          <div className="mt-auto hidden px-3 pt-6 text-[10.5px] leading-snug text-grey md:block">
            All figures ₹ per month unless stated. Case data are illustrative. Every number is computed by the engine from the case dataset and the levers.
          </div>
        </nav>
        <main className="min-w-0 flex-1 px-4 py-5 md:px-6">{children}</main>
      </div>
      <LeversDrawer open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

/**
 * Government of Uttar Pradesh emblem, shown when /public/up-emblem.png is present.
 * Hidden (no broken image) until the file is added.
 */
function UpEmblem() {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    const probe = new window.Image();
    probe.onload = () => setOk(true);
    probe.src = "/up-emblem.png";
  }, []);
  if (!ok) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/up-emblem.png" alt="Government of Uttar Pradesh" width={40} height={40} className="h-10 w-10 object-contain" />
  );
}
