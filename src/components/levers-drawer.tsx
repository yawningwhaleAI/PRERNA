"use client";

import { LEVER_META, DEFAULT_LEVERS } from "@/lib/engine";
import { useStore } from "@/lib/store";
import { AssumptionTag } from "./ui";

function display(v: number | boolean, unit: string) {
  if (unit === "pct") return Math.round((v as number) * 1000) / 10;
  return v as number;
}

export function LeversDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state, setLever, resetLevers } = useStore();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/25" onClick={onClose}>
      <aside
        className="h-full w-full max-w-md overflow-y-auto bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        aria-label="Analyst levers"
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy">Analyst levers</h2>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <p className="mb-4 text-xs text-grey">
          Defaults reproduce the reference model. Changing a lever re-derives hub and channel decisions on every screen.
          Stress tests on the Scenarios page keep the S3 plan fixed and shock it.
        </p>
        <div className="space-y-3">
          {LEVER_META.map((m) => {
            const v = state.levers[m.key];
            const def = DEFAULT_LEVERS[m.key];
            const changed = v !== def;
            return (
              <div key={m.key} className="rounded border border-line p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <label htmlFor={`lever-${m.key}`} className="text-[13px] font-semibold text-navy">
                    {m.label}
                    {m.assumption && <AssumptionTag />}
                  </label>
                  {m.unit === "flag" ? (
                    <input
                      id={`lever-${m.key}`}
                      type="checkbox"
                      checked={v as boolean}
                      onChange={(e) => setLever(m.key, e.target.checked as never)}
                      className="mt-1 h-4 w-4 accent-[#204B75]"
                    />
                  ) : (
                    <div className="flex items-center gap-1">
                      {m.unit === "inr" && <span className="text-xs text-grey">₹</span>}
                      <input
                        id={`lever-${m.key}`}
                        data-testid={`lever-${m.key}`}
                        type="number"
                        step={m.unit === "pct" ? 1 : 1}
                        value={display(v, m.unit)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          if (!Number.isFinite(n)) return;
                          setLever(m.key, (m.unit === "pct" ? n / 100 : n) as never);
                        }}
                        className={`field w-24 text-right ${changed ? "border-orange font-semibold text-orange" : ""}`}
                      />
                      {m.unit === "pct" && <span className="text-xs text-grey">%</span>}
                    </div>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-grey">
                  {m.note} Default: {m.unit === "pct" ? `${(def as number) * 100}%` : m.unit === "flag" ? (def ? "on" : "off") : String(def)}.
                </p>
              </div>
            );
          })}
        </div>
        <button className="btn btn-primary mt-4 w-full" onClick={resetLevers}>
          Reset all levers to defaults
        </button>
      </aside>
    </div>
  );
}
