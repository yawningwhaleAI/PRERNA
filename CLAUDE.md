# CLAUDE.md: Prerna 360

## What this project is
Prerna 360 is a decision-support web app for UPSRLM and GDi. It runs the recommended operating model for the two Prerna Aggregation Centres (ACs), Bijnor and Lucknow, in Uttar Pradesh. It answers five questions every month:
1. Where should each SHG ship (which AC)?
2. How should each product sell (online or bulk)?
3. Which demand is actually committed (buyer and box order book)?
4. Is each AC viable?
5. Who earns, and who is left behind?

The source of truth for the problem is **`context/prerna_dataset.xlsx`** (the case dataset) plus the rules stated in this file. These come from the case PDF. Everything else in `context/` is supporting analysis.

## Non-negotiable rules
1. **Deterministic numbers only.** Every number shown in the UI comes from the calculation engine (`src/lib/engine/`) or a database query. No number is hardcoded in components. No LLM generates a number.
2. **Parity with the reference model.** `context/prerna_model.py` and `context/prerna_calculations.xlsx` are the oracles. The engine must reproduce `context/reference_outputs/` exactly at default settings, and the golden tests in `tests/golden.test.ts` must pass before any feature is "done".
3. **Never edit the case dataset.** Seed it into the database as-is. Analyst classifications (category, brand tier, ODOP/GI) live in a separate table.
4. **Label provenance.** Any assumption-driven value carries an `assumption` badge (packaging cost, box order size, headroom target, volume kept). Case facts and calculated values are visually distinct from assumptions.
5. **No invented data.** AC operating costs, buyer demand and packaging quotes are *not* in the case. Show them as empty "to collect" inputs, never as made-up defaults. Exceptions are the labelled analyst levers listed below.
6. **Privacy by design.** Members are stored by pseudonymous code only. No names, phone, Aadhaar or bank fields in the analytics schema. Impact pages show SHG-level data, never individual women. (DPDP core duties apply from 13 May 2027.)
7. **Small, reviewable steps.** Build in the milestone order in `BUILD_PLAN.md`. After each milestone run the tests, update `PROGRESS.md`, and stop for review.

## Business rules (from the case: implement exactly)
- Selling price (SP) = SHG price + inbound + AC markup + outbound.
- **AC markup** = 15% of SHG price per unit. This is the AC's only income; logistics is a pass-through.
- **Inbound** (SHG to its linked AC) = weight (kg) × band rate:
  - ₹10/kg for 0–100 km;
  - ₹20/kg for 101–300 km;
  - ₹30/kg for 301–500 km;
  - ₹40/kg for >500 km.

  0 km uses the first band. Band edges (100, 300, 500) belong to the **lower** band by default (lever `edgeInclusive = true`).
- **Outbound online** = ₹50 for the first kg per order + ₹25 per extra kg **or part** (`ceil(max(0, w-1))`). One unit = one order.
- **Outbound bulk** = ₹10 per kg.
- **Competitive** if SP ≤ market price of a similar product. Otherwise the product "struggles to sell", and its markup and SHG income count as *at risk*.
- **SHG income** = SHG profit per unit × units, shared only among actively earning women (equal split assumed).
- **Worked check:** honey (0.5 kg, SHG price ₹200, Bijnor, 0 km, online) = 200 + 5 + 30 + 50 = **₹285**; the AC earns ₹30.

## Recommended-model rules (from the research)
- **Hub rule:** link each SHG to the AC with the lower inbound *band*. On a tie, keep the current link.
- **Channel rule** at the proposed AC:
  - keep bulk if already bulk;
  - otherwise online if online SP ≤ market;
  - else bulk if bulk SP ≤ market;
  - else online, flagged for premium positioning or turnaround.
- **Scenarios:**
  - S0 = current links and channels;
  - S1 = hub rule only;
  - S2 = channel switch at current AC only (online → bulk if online fails and bulk passes);
  - S3 = hub + channel rule.
- **Corporate boxes (Prerna 365):** contents from **one AC only** (validation must block mixed boxes). Box SP = Σ(SHG price + inbound + markup) + packaging + delivery. Delivery is either bulk (₹10 × box kg) or courier (online formula on box kg). Benchmark = Σ market prices of the contents. Capacity check: boxes ÷ monthly units per SKU (months of output).
- **Headroom-for-inclusion:** eligible if the S3 channel is online and headroom > 10%. New SHG price = (0.9 × market − inbound − outbound) ÷ 1.15. The gain is shown with a pass-through × volume-kept sensitivity grid.

## Analyst levers (defaults reproduce the reference outputs)
| Lever | Default |
|---|---|
| `edgeInclusive` | true |
| `inboundRateChange` | 0% |
| `outboundRateChange` | 0% |
| `volumeChange` | 0% |
| `packagingPerBox` | ₹40 |
| `boxesPerOrder` | 1000 |
| `headroomTrigger` | 10% |
| `headroomTargetSpPctMarket` | 90% |
| `thinHeadroom` | 5% |
| `participationTarget` | 80% |
| `prernaStores` | 543 |
| `minWageYardstick` | ₹13,190 |
| `lakhpatiMonthly` | ₹10,000 |

## Tech stack (decided; do not change without asking)
- **Next.js 14+ (App Router) + TypeScript (strict)**, Tailwind CSS, shadcn/ui, Recharts.
- **Prisma** with SQLite in dev (Postgres-ready schema for production).
- **Vitest** for unit and golden tests. Playwright for one end-to-end smoke test.
- Engine in `src/lib/engine/`: pure, framework-free TypeScript functions (`rates.ts`, `pricing.ts`, `allocation.ts`, `channel.ts`, `scenarios.ts`, `boxes.ts`, `inclusion.ts`, `social.ts`, `pnl.ts`). There is no I/O in the engine.
- Money is stored as integer paise in the DB and displayed as ₹ with Indian grouping (2,19,300).
- The deploy target is Vercel. Keep secrets in env vars only.

## Visual style
- Palette: **GDi navy `#204B75`** (primary, headers), **orange `#CB3500`** (accent, alerts and "above market"), light navy tint `#E9EEF4`, grey `#595959`, white background.
- Typeface: Inter or Arial. Dense, consultant-style tables with no decorative gradients or emoji.
- "Above market" values in orange, bold. Assumption-driven values get a small grey "assumption" tag.

## Prototype note (Nov 2026)
For the Vercel prototype there is no database at runtime (SQLite cannot persist on Vercel). The seed writes
`src/data/case-data.json` from the case dataset; user inputs live in the browser (`localStorage`, money in paise).
Prisma + Postgres is the first post-prototype task. Lever semantics: levers re-derive hub and channel decisions;
stress tests keep the S3 plan fixed and shock it. See `PROGRESS.md`.

## Commands (keep this section updated)
- `npm run dev`
- `npm test`: Vitest including golden, parity and seed tests
- `npm run seed`: loads `context/prerna_dataset.xlsx` (and analyst attributes) into `src/data/case-data.json`
- `npm run parity`: compares engine outputs with `context/reference_outputs/*.csv`
- `npm run lint`, `npm run typecheck`, `npm run build`
- `npm run e2e`: Playwright smoke tests (needs a build; starts `next start` on port 3100)

## Definition of done (every milestone)
- `npm test` is green, including golden and parity tests.
- No TypeScript errors; lint clean.
- `PROGRESS.md` updated with what was built, what's next and open questions.
- Screens checked in the browser at 1440 px and 1024 px widths.
