/**
 * Parity checks: engine outputs vs context/reference_outputs (the Python oracle).
 * Used by `npm run parity` and tests/parity.test.ts. Node-only (reads CSV files).
 */
import { readFileSync } from "node:fs";
import {
  DEFAULT_LEVERS,
  baseline,
  buildPlan,
  priceBox,
  runOptions,
  runScenario,
  summarise,
  type CaseData,
  type Plan,
} from "./engine";

export function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]!;
    if (q) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [head, ...body] = rows;
  return body.filter((r) => r.length > 1).map((r) => Object.fromEntries(head!.map((h, i) => [h, r[i] ?? ""])));
}

export interface Mismatch {
  file: string;
  key: string;
  column: string;
  expected: string;
  actual: string;
}

const TOL = 1e-6;

function compare(file: string, key: string, col: string, expected: string, actual: unknown, out: Mismatch[]) {
  const e = expected.trim();
  let ok: boolean;
  if (typeof actual === "boolean") ok = (e === "True") === actual;
  else if (typeof actual === "number") {
    const en = Number(e);
    ok = Number.isFinite(en) && Math.abs(en - actual) <= TOL * Math.max(1, Math.abs(en));
  } else ok = e === String(actual);
  if (!ok) out.push({ file, key, column: col, expected: e, actual: String(actual) });
}

const pyList = (xs: string[]) => `[${xs.map((x) => `'${x}'`).join(", ")}]`;

const BASELINE_MAP: Record<string, string> = {
  shg_id: "shgId", district: "district", product: "product", linked_ac: "linkedAc", channel: "channel", weight: "weight",
  units: "units", shg_price: "shgPrice", market: "market", value_density: "valueDensity", km_linked: "kmLinked",
  band_rate_linked: "bandRateLinked", band_rate_bijnor: "bandRateBijnor", band_rate_lucknow: "bandRateLucknow",
  inbound: "inbound", markup: "markup", outbound: "outbound", sp: "sp", gap: "gap", headroom_pct: "headroomPct",
  competitive: "competitive", logistics_share_of_sp: "logisticsShareOfSp", logistics_pct_of_shg_price: "logisticsPctOfShgPrice",
  ac_markup_month: "acMarkupMonth", ac_inbound_spend_month: "acInboundSpendMonth", ac_outbound_spend_month: "acOutboundSpendMonth",
  gmv_month: "gmvMonth", kg_month: "kgMonth", inbound_bijnor: "inboundBijnor", inbound_lucknow: "inboundLucknow",
  cheapest_ac: "cheapestAc", closer_ac: "closerAc", realloc_saving_unit: "reallocSavingUnit", realloc_saving_month: "reallocSavingMonth",
  mislinked: "mislinked", best_ac: "bestAc", sp_B_Online: "spBOnline", sp_B_Bulk: "spBBulk", sp_L_Online: "spLOnline",
  sp_L_Bulk: "spLBulk", online_minus_bulk_outbound: "onlineMinusBulkOutbound", max_markup_pct_Online: "maxMarkupPctOnline",
  max_markup_pct_Bulk: "maxMarkupPctBulk", members: "members", active: "active", participation: "participation",
  inactive: "inactive", shg_income_month: "shgIncomeMonth", income_per_active_month: "incomePerActiveMonth",
  income_per_member_month_if_shared: "incomePerMemberMonthIfShared", shg_profit_unit: "shgProfitUnit",
};
/** `category` is a text label; the app uses the workbook's classification (BUILD_PLAN M1), so it is not compared. */
const BASELINE_SKIP = new Set(["category"]);

/** The nine scenario rows of 02_scenario_summary.csv, rebuilt from the engine. */
export function referenceScenarios(data: CaseData): { name: string; plan: Plan; o: ReturnType<typeof runOptions> }[] {
  const L = DEFAULT_LEVERS;
  const base = runOptions(L);
  const s3 = buildPlan("S3", data, L);
  const hamperIds = new Set(
    data.shgs
      .filter((s) => s.weight === 0.5 && (data.attributes.find((a) => a.shgId === s.id)?.category ?? "").startsWith("Food"))
      .map((s) => s.id),
  );
  const s4: Plan = Object.fromEntries(
    Object.entries(s3).map(([id, a]) => [id, { ...a, unitsPerParcel: hamperIds.has(id) ? 2 : 1 }]),
  );
  return [
    { name: "S0 Baseline (current links & channels, logistics now charged)", plan: buildPlan("S0", data, L), o: base },
    { name: "S1 Reallocate mis-linked SHGs only", plan: buildPlan("S1", data, L), o: base },
    { name: "S2 Channel shift only (bulk for heavy/low-value)", plan: buildPlan("S2", data, L), o: base },
    { name: "S3 Reallocate + channel shift (recommended core)", plan: s3, o: base },
    { name: "S3a S3 + 20% volume decline", plan: s3, o: { ...base, volMult: 0.8 } },
    { name: "S3b S3 + 10% logistics rate inflation", plan: s3, o: { ...base, inMult: 1.1, outMult: 1.1 } },
    { name: "S3c S3 + 20% logistics rate inflation", plan: s3, o: { ...base, inMult: 1.2, outMult: 1.2 } },
    { name: "S3d S0 + 20% logistics rate inflation", plan: buildPlan("S0", data, L), o: { ...base, inMult: 1.2, outMult: 1.2 } },
    { name: "S4 S3 + 2-item hamper parcels for 0.5 kg food (assumption)", plan: s4, o: base },
  ];
}

export function runParity(data: CaseData, dir = "context/reference_outputs"): { checked: number; mismatches: Mismatch[] } {
  const out: Mismatch[] = [];
  let checked = 0;
  const read = (f: string) => parseCsv(readFileSync(`${dir}/${f}`, "utf8"));

  // 01 baseline product economics
  const f1 = "01_baseline_product_economics.csv";
  const base = baseline(data);
  read(f1).forEach((ref, i) => {
    const row = base[i] as unknown as Record<string, unknown>;
    for (const col of Object.keys(ref)) {
      if (BASELINE_SKIP.has(col)) continue;
      const k = BASELINE_MAP[col];
      if (!k) {
        out.push({ file: f1, key: ref.shg_id ?? String(i), column: col, expected: "mapped column", actual: "unmapped" });
        continue;
      }
      compare(f1, ref.shg_id ?? String(i), col, ref[col]!, row[k], out);
      checked++;
    }
  });

  // 02 scenario summary
  const f2 = "02_scenario_summary.csv";
  const scen = referenceScenarios(data);
  read(f2).forEach((ref, i) => {
    const sc = scen[i]!;
    const s = summarise(runScenario(data, sc.plan, sc.o), 0.05);
    const actual: Record<string, unknown> = {
      scenario: sc.name,
      competitive_count: s.competitiveCount,
      uncompetitive: pyList(s.uncompetitive),
      thin_headroom_lt5pct: pyList(s.thinHeadroom),
      ac_markup_total: s.acMarkupTotal,
      ac_markup_at_risk: s.acMarkupAtRisk,
      ac_markup_secure: s.acMarkupSecure,
      bijnor_markup: s.byAc.Bijnor.markup,
      lucknow_markup: s.byAc.Lucknow.markup,
      bijnor_markup_secure: s.byAc.Bijnor.markupSecure,
      lucknow_markup_secure: s.byAc.Lucknow.markupSecure,
      bijnor_shgs: s.byAc.Bijnor.shgs,
      lucknow_shgs: s.byAc.Lucknow.shgs,
      logistics_outlay_total: s.logisticsOutlay,
      bijnor_logistics_outlay: s.byAc.Bijnor.logistics,
      lucknow_logistics_outlay: s.byAc.Lucknow.logistics,
      shg_income_total: s.shgIncomeTotal,
      shg_income_at_risk: s.shgIncomeAtRisk,
      women_active_at_risk: s.womenActiveAtRisk,
      members_in_at_risk_shgs: s.membersInAtRiskShgs,
    };
    for (const col of Object.keys(ref)) {
      // The reference rounds money to 2 dp in this file.
      const a = actual[col];
      compare(f2, sc.name.split(" ")[0]!, col, ref[col]!, typeof a === "number" ? Math.round(a * 100) / 100 : a, out);
      checked++;
    }
  });

  // 13 corporate box economics
  const f3 = "13_corporate_box_economics.csv";
  const boxes: Record<string, string[]> = {
    "Essentials Festive Box (Bijnor)": ["SHG-01", "SHG-02", "SHG-04", "SHG-05"],
    "Signature Craft Box (Bijnor)": ["SHG-02", "SHG-03", "SHG-07"],
    "Signature Purvanchal Box (Lucknow)": ["SHG-14", "SHG-17", "SHG-20"],
  };
  const s3 = buildPlan("S3", data, DEFAULT_LEVERS);
  for (const ref of read(f3)) {
    const ids = boxes[ref.box!];
    if (!ids) {
      out.push({ file: f3, key: ref.box!, column: "box", expected: ref.box!, actual: "unknown box" });
      continue;
    }
    const b = priceBox(data, ids.map((shgId) => ({ shgId, qty: 1 })), s3, { ...DEFAULT_LEVERS, packagingPerBox: Number(ref.packaging) });
    if (!b.ok) {
      out.push({ file: f3, key: ref.box!, column: "box", expected: "priced", actual: b.message });
      continue;
    }
    const courier = ref.delivery!.startsWith("Courier");
    const sp = courier ? b.spCourier : b.spBulk;
    const actual: Record<string, unknown> = {
      box: ref.box,
      ac: b.ac,
      contents: b.lines.map((l) => l.product).join(", "),
      kg: b.kg,
      packaging: b.packaging,
      delivery: ref.delivery,
      box_sp: sp,
      sum_market: b.sumMarket,
      headroom_pct: Math.round(((b.sumMarket - sp) / b.sumMarket) * 1e4) / 1e4,
      shg_profit_per_box: b.shgIncomePerBox,
      ac_markup_per_box: b.acMarkupPerBox,
      per_1000_boxes_shg_income: b.shgIncomePerOrder,
      per_1000_boxes_ac_markup: b.acMarkupPerOrder,
      months_of_current_output_for_1000: Math.round(b.monthsOfOutput * 100) / 100,
    };
    for (const col of Object.keys(ref)) {
      compare(f3, `${ref.box} / ₹${ref.packaging} / ${ref.delivery}`, col, ref[col]!, actual[col], out);
      checked++;
    }
  }
  return { checked, mismatches: out };
}
