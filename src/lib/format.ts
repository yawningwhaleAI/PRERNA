/** Display formatting only. Never used inside the engine. */
const inrFmt = (dp: number) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: dp, maximumFractionDigits: dp });

export function inr(x: number | null | undefined, dp = 0): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "–";
  const s = inrFmt(dp).format(Math.abs(x));
  return `${x < 0 ? "−" : ""}₹${s}`;
}

export function num(x: number | null | undefined, dp = 0): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "–";
  const s = inrFmt(dp).format(Math.abs(x));
  return `${x < 0 ? "−" : ""}${s}`;
}

export function pct(x: number | null | undefined, dp = 1): string {
  if (x === null || x === undefined || !Number.isFinite(x)) return "–";
  return `${x < 0 ? "−" : ""}${(Math.abs(x) * 100).toFixed(dp)}%`;
}

export function signedInr(x: number, dp = 0): string {
  return `${x > 0 ? "+" : ""}${inr(x, dp)}`;
}

/** Paise ↔ rupees for persisted money inputs. */
export const toPaise = (rupees: number) => Math.round(rupees * 100);
export const fromPaise = (paise: number) => paise / 100;
