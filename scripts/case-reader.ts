/**
 * Reads the case dataset (never modified) and the analyst attributes from the
 * calculations workbook. Shared by `npm run seed` and the seed tests.
 */
import ExcelJS from "exceljs";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { CaseData, ShgRecord, ProductAttribute, RateCard } from "../src/lib/engine/types";

export const DATASET_PATH = "context/prerna_dataset.xlsx";
export const CALC_PATH = "context/prerna_calculations.xlsx";
/** SHA-256 of the case dataset as delivered. A mismatch means someone edited the source of truth. */
export const DATASET_SHA256 = "389de30f5476ede4a1d3d73146cda83e41398326d60c5c6a34def348188b96e1";

export const EXPECTED_HEADERS = [
  "SHG ID",
  "District",
  "Women members",
  "Women actively earning from this product",
  "Distance to Bijnor AC (km)",
  "Distance to Lucknow AC (km)",
  "Linked AC (current)",
  "Product",
  "Weight per unit (kg)",
  "SHG price per unit (₹, incl. SHG profit)",
  "SHG profit per unit (₹)",
  "Units sold per month",
  "Sales channel (current)",
  "Market price of a similar product (₹)",
];

export function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

function cellText(v: ExcelJS.CellValue): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "richText" in v) return v.richText.map((r) => r.text).join("");
  if (typeof v === "object" && "result" in v) return String(v.result ?? "");
  return String(v);
}

function num(v: ExcelJS.CellValue, where: string): number {
  const n = typeof v === "number" ? v : Number(cellText(v).replace(/[₹,\s]/g, ""));
  if (!Number.isFinite(n)) throw new Error(`Expected a number at ${where}, got ${cellText(v)}`);
  return n;
}

function oneOf<T extends string>(v: ExcelJS.CellValue, allowed: readonly T[], where: string): T {
  const s = cellText(v).trim();
  if (!(allowed as readonly string[]).includes(s)) throw new Error(`Unexpected value '${s}' at ${where}`);
  return s as T;
}

export async function readShgData(path = DATASET_PATH): Promise<ShgRecord[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("SHG Data");
  if (!ws) throw new Error("Sheet 'SHG Data' not found");
  const header = (ws.getRow(1).values as ExcelJS.CellValue[]).slice(1).map((c) => cellText(c).trim());
  EXPECTED_HEADERS.forEach((h, i) => {
    if (header[i] !== h) throw new Error(`Header ${i + 1} is '${header[i]}', expected '${h}'`);
  });
  const rows: ShgRecord[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const v = (c: number) => ws.getRow(r).getCell(c).value;
    if (!cellText(v(1))) continue;
    const at = (c: number) => `SHG Data!R${r}C${c}`;
    rows.push({
      id: cellText(v(1)).trim(),
      district: cellText(v(2)).trim(),
      members: num(v(3), at(3)),
      active: num(v(4), at(4)),
      distBijnor: num(v(5), at(5)),
      distLucknow: num(v(6), at(6)),
      linkedAc: oneOf(v(7), ["Bijnor", "Lucknow"] as const, at(7)),
      product: cellText(v(8)).trim(),
      weight: num(v(9), at(9)),
      shgPrice: num(v(10), at(10)),
      shgProfit: num(v(11), at(11)),
      units: num(v(12), at(12)),
      channel: oneOf(v(13), ["Online", "Bulk"] as const, at(13)),
      market: num(v(14), at(14)),
    });
  }
  return rows;
}

/** Rate card v1 from the 'Pricing & Costs' sheet. */
export async function readRateCard(path = DATASET_PATH): Promise<RateCard> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Pricing & Costs");
  if (!ws) throw new Error("Sheet 'Pricing & Costs' not found");
  const byLabel = new Map<string, ExcelJS.CellValue>();
  ws.eachRow((row) => byLabel.set(cellText(row.getCell(1).value).trim(), row.getCell(2).value));
  const get = (label: string) => {
    if (!byLabel.has(label)) throw new Error(`Rate card row '${label}' not found`);
    return num(byLabel.get(label) ?? null, `Pricing & Costs!${label}`);
  };
  return {
    version: 1,
    label: "Case rate card (Pricing & Costs sheet)",
    bands: [
      { upToKm: 100, ratePerKg: get("Distance up to 100 km") },
      { upToKm: 300, ratePerKg: get("Distance 101–300 km") },
      { upToKm: 500, ratePerKg: get("Distance 301–500 km") },
      { upToKm: null, ratePerKg: get("Distance above 500 km") },
    ],
    onlineFirstKg: get("Online (courier): first 1 kg"),
    onlineExtraKg: get("Online (courier): each additional kg or part"),
    bulkPerKg: get("Bulk (shared truck)"),
    markup: get("(+) AC markup"),
  };
}

/** Analyst attributes: section C of the Assumptions sheet in the calculations workbook. */
export async function readAttributes(path = CALC_PATH): Promise<ProductAttribute[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Assumptions");
  if (!ws) throw new Error("Sheet 'Assumptions' not found");
  let headerRow = -1;
  const col: Record<string, number> = {};
  ws.eachRow((row, n) => {
    if (headerRow > 0) return;
    const labels = new Map<string, number>();
    row.eachCell((cell, c) => labels.set(cellText(cell.value).trim(), c));
    if (labels.has("Product") && labels.has("SHG ID") && labels.has("Group") && labels.has("Brand tier")) {
      headerRow = n;
      for (const [label, c] of labels) col[label.startsWith("ODOP") ? "ODOP" : label] = c;
    }
  });
  if (headerRow < 0 || !col.ODOP || !col.Category) throw new Error("Product attribute table not found on Assumptions sheet");
  const c = (k: string) => col[k]!;
  const out: ProductAttribute[] = [];
  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const shgId = cellText(row.getCell(c("SHG ID")).value).trim();
    if (!/^SHG-\d+$/.test(shgId)) break;
    out.push({
      shgId,
      product: cellText(row.getCell(c("Product")).value).trim(),
      group: oneOf(row.getCell(c("Group")).value, ["Food & other", "Craft & textile"] as const, `Assumptions!R${r}`),
      brandTier: oneOf(row.getCell(c("Brand tier")).value, ["Essentials", "Signature"] as const, `Assumptions!R${r}`),
      category: cellText(row.getCell(c("Category")).value).trim(),
      odopGi: cellText(row.getCell(c("ODOP")).value).trim(),
    });
  }
  return out;
}

export async function readCaseData(): Promise<CaseData> {
  const [shgs, rateCard, attributes] = await Promise.all([readShgData(), readRateCard(), readAttributes()]);
  return {
    source: {
      dataset: DATASET_PATH,
      datasetSha256: sha256(DATASET_PATH),
      attributes: `${CALC_PATH} (Assumptions sheet, section C: analyst classification)`,
      note: "Illustrative case figures, copied without changes. Benchmarks carry no source date in the case.",
    },
    shgs,
    rateCard,
    attributes,
  };
}
