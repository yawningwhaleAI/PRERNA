"use client";

/**
 * Charts. Palettes validated with the dataviz validator (light surface):
 * polarity pair #2F74C0 / #CB3500 (all pass); price components #257de0,#00b894,#f2a600,#6a4ce2
 * (pass; contrast WARN relieved by direct value labels and the adjacent table); groups #2F74C0 / #f2a600.
 */
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { inr, pct } from "@/lib/format";

export const C = {
  good: "#2F74C0",
  bad: "#CB3500",
  axis: "#595959",
  grid: "#e3e8ee",
  text: "#1f2933",
  comp: ["#257de0", "#00b894", "#f2a600", "#6a4ce2"],
  groups: { "Food & other": "#2F74C0", "Craft & textile": "#f2a600" } as Record<string, string>,
};

const tipStyle = { fontSize: 12, borderRadius: 4, border: "1px solid #d5dde6" };

/** Headroom (% of market) per SKU. Negative = above market (orange). */
export function HeadroomChart({ rows }: { rows: { label: string; headroom: number; sp: number; market: number }[] }) {
  const data = [...rows].sort((a, b) => a.headroom - b.headroom);
  const minH = Math.min(...data.map((d) => d.headroom));
  const lo = minH < 0 ? Math.floor(minH * 20) / 20 - 0.05 : 0;
  const hi = Math.max(0.05, Math.ceil(Math.max(...data.map((d) => d.headroom)) * 20) / 20);
  const ticks: number[] = [];
  for (let t = lo; t <= hi + 1e-9; t += 0.05) ticks.push(Math.round(t * 100) / 100);
  return (
    <div className="w-full" style={{ height: 40 + data.length * 24 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }} barCategoryGap={3}>
          <CartesianGrid horizontal={false} stroke={C.grid} />
          <XAxis type="number" domain={[lo, hi]} ticks={ticks} tickFormatter={(v) => pct(v, 0)} tick={{ fontSize: 11, fill: C.axis }} stroke={C.grid} />
          <YAxis type="category" dataKey="label" width={180} tick={{ fontSize: 11, fill: C.text }} stroke={C.grid} interval={0} />
          <ReferenceLine x={0} stroke={C.axis} />
          <Tooltip
            contentStyle={tipStyle}
            cursor={{ fill: "#E9EEF4" }}
            formatter={(_v, _n, p) => {
              const d = p.payload as (typeof data)[number];
              return [`${pct(d.headroom)} · SP ${inr(d.sp)} vs market ${inr(d.market)}`, d.headroom < 0 ? "Above market" : "Headroom"];
            }}
          />
          <Bar dataKey="headroom" radius={2} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.label} fill={d.headroom < 0 ? C.bad : C.good} />
            ))}
            <LabelList dataKey="headroom" position="right" formatter={(v: unknown) => pct(Number(v), 1)} style={{ fontSize: 10.5, fill: C.text }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Price build-up waterfall: SHG price → inbound → markup → outbound → SP, compared with market. */
export function Waterfall({ shgPrice, inbound, markup, outbound, sp, market }: { shgPrice: number; inbound: number; markup: number; outbound: number; sp: number; market: number }) {
  const steps = [
    { name: "SHG price", base: 0, value: shgPrice, color: C.comp[0] },
    { name: "Inbound", base: shgPrice, value: inbound, color: C.comp[1] },
    { name: "AC markup", base: shgPrice + inbound, value: markup, color: C.comp[2] },
    { name: "Outbound", base: shgPrice + inbound + markup, value: outbound, color: C.comp[3] },
    { name: "Selling price", base: 0, value: sp, color: sp > market ? C.bad : C.good },
    { name: "Market", base: 0, value: market, color: C.axis },
  ];
  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer>
        <BarChart data={steps} margin={{ top: 22, right: 8, left: 8, bottom: 4 }} barCategoryGap="22%">
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.text }} stroke={C.grid} interval={0} />
          <YAxis tickFormatter={(v) => inr(v)} tick={{ fontSize: 11, fill: C.axis }} stroke={C.grid} width={64} />
          <Tooltip contentStyle={tipStyle} cursor={{ fill: "#E9EEF4" }} formatter={(v, n) => (n === "base" ? [null, null] : [inr(Number(v), 2), "₹ per unit"])} />
          <ReferenceLine y={market} stroke={C.axis} strokeDasharray="4 3" />
          <Bar dataKey="base" stackId="a" fill="transparent" isAnimationActive={false} />
          <Bar dataKey="value" stackId="a" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {steps.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
            <LabelList dataKey="value" position="top" formatter={(v: unknown) => inr(Number(v), Number(v) % 1 ? 1 : 0)} style={{ fontSize: 11, fill: C.text, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** SHG archetypes: participation × income per earning woman, coloured by product group. */
export function ArchetypeScatter({ rows, medianIncome }: { rows: { shgId: string; product: string; group: string; participation: number; incomePerEarner: number; members: number }[]; medianIncome: number }) {
  const groups = [...new Set(rows.map((r) => r.group))];
  return (
    <div className="h-[340px] w-full">
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 24, left: 8 }}>
          <CartesianGrid stroke={C.grid} />
          <XAxis type="number" dataKey="participation" domain={[0, 1]} tickFormatter={(v) => pct(v, 0)} tick={{ fontSize: 11, fill: C.axis }} label={{ value: "Participation (earning ÷ members)", position: "insideBottom", offset: -12, fontSize: 11, fill: C.axis }} />
          <YAxis type="number" dataKey="incomePerEarner" tickFormatter={(v) => inr(v)} tick={{ fontSize: 11, fill: C.axis }} width={64} />
          <ZAxis range={[90, 90]} />
          <ReferenceLine x={0.5} stroke={C.axis} strokeDasharray="4 3" />
          <ReferenceLine y={medianIncome} stroke={C.axis} strokeDasharray="4 3" />
          <Tooltip
            content={({ active, payload }) => {
              const d = active && payload?.[0] ? (payload[0].payload as (typeof rows)[number]) : null;
              if (!d) return null;
              return (
                <div className="rounded border border-line bg-white px-2 py-1.5 text-xs shadow-sm">
                  <div className="font-semibold">{d.shgId} {d.product}</div>
                  <div>{d.group}</div>
                  <div>Participation {pct(d.participation)} · {inr(d.incomePerEarner)} per earner</div>
                </div>
              );
            }}
          />
          <Legend verticalAlign="top" height={24} iconSize={10} wrapperStyle={{ fontSize: 12 }} />
          {groups.map((g) => (
            <Scatter key={g} name={g} data={rows.filter((r) => r.group === g)} fill={C.groups[g] ?? C.good} stroke="#fff" strokeWidth={2} isAnimationActive={false}>
              <LabelList dataKey="shgId" position="right" style={{ fontSize: 9.5, fill: C.axis }} formatter={(v: unknown) => String(v).replace("SHG-", "")} />
            </Scatter>
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
