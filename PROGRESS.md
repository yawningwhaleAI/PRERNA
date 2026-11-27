# PROGRESS: Prerna 360

_Last updated: 27 Nov 2026_

## Status
Working prototype covering the MVP decision flow (M0–M6 plus parts of M7), built for the submission deadline.
`npm test` (28 unit, golden, parity and seed tests), `npm run parity` (1,452 values), `npm run lint`, `npm run typecheck`,
`npm run build` and `npm run e2e` (2 Playwright smoke tests) all pass. Screens checked at 1440 px and 1024 px with no page-level horizontal scroll.

## Decisions taken (answers to the kickoff questions)
| # | Question | Decision |
|---|---|---|
| Q1 | Repo layout | Pack contents moved to the repo root; older copies kept in `archive/` (root duplicates, `Prerna_Research/`). Case PDF at `context/case_study.pdf`. |
| Q2 | Lever semantics | Levers **re-derive** hub and channel decisions (as the Excel main tables do). **Stress tests** keep the S3 plan fixed and shock rates or volume (as the Excel stress block and the golden 17/15 do). The band-edge golden test asserts SHG-14's Lucknow online SP of ₹655 > ₹650 (uncompetitive in S1 with the lever off). |
| Q3 | Members | Stored as counts per SHG (213 members, 127 earning). No member rows are fabricated; no personal fields exist anywhere. |
| Q4 | AC P&L | Added as its own nav item. |
| Q5 | Channel buffers | Not added; the CLAUDE.md rule is implemented as written. Stockist headroom is shown as information. |
| Q6 | Scenarios | UI shows S0–S3 plus stress tests. The engine supports units-per-parcel so parity covers all nine rows of `02_scenario_summary.csv` (incl. S4 hampers). |
| Q7 | Category labels | Workbook labels used (BUILD_PLAN M1); the text-only `category` column is excluded from parity. |

**Prototype deviation from the stack in CLAUDE.md (deadline + Vercel):** no Prisma/SQLite at runtime. SQLite cannot persist on
Vercel's serverless file system. Instead:
- `npm run seed` reads `context/prerna_dataset.xlsx` (checksum-guarded) and the workbook's analyst attributes into `src/data/case-data.json`; a test re-reads the workbook and asserts equality.
- User inputs (opex, capacity, buyers, boxes, commitments, what-if overrides, levers) are kept in the browser (`localStorage`). Money inputs are stored in integer paise.
- Moving these to Postgres (Neon / Vercel Postgres) with Prisma is the first post-submission task; the engine is unaffected.

## v2: aligned with the final GDi Partners submission (branch `claude/v2-hybrid`, P0 done)
Brief: `PRERNA360_V2_BRIEF.md`; expected values: `context_v2/golden_v2.json`.
- **New recommended plan `SH`, "Fix links + buyer-backed hybrid"**:
  - re-link 7 SHGs;
  - jaggery 3-pack and garam masala 4-pack stay online;
  - atta, detergent and mustard oil move to bulk **only when a buyer commits**.
  - The config is in `src/data/hybrid-plan.json`; the engine is in `src/lib/engine/hybrid.ts`.
- **Commitment gate:** volume is split into segments.
  - Bulk volume without a buyer stays online, priced above market and at risk.
  - Multi-pack decliners are lost volume.
  - A product counts as competitive only if all its sold volume is at or below market.
  - Inputs: `packAcceptance` (default 75%) and `bulkSecured` (default 0%, raised automatically by LoI-or-later orders).
- **Plan names:** S1 is now "Fix links (floor)" and S3 is "Fix links + all staples to bulk" (no longer recommended). The default plan is SH. The store key is now `prerna360:v2`; v1 inputs are migrated, and a stored S3 view becomes SH.
- **Demand panel** (Overview and Compare plans): three presets (17 / 17 / 20) and the blanket-bulk comparison at 0–100% secured.
- **Overview and Start** lead with Floor 15/20, ₹42,400 freight (passed to buyers, not AC income) and Ceiling 20/20. They also show:
  - exposure as an upper bound split >5% vs 0–5% above market;
  - the "3 products above market even at zero markup" line;
  - hybrid 1,050 (1.9 per store) vs blanket 2,250 (4.1 per store).
- **`/start` and every page render on the server with default numbers;** user inputs hydrate after.
- **Branding:**
  - GDi Partners naming, with the credit line in the header and footer;
  - deck palette: off-white `#F7F5F0` and slate `#4A5568`;
  - no contact details shown.
- **Wording:** "gross markup (not profit)"; −0.74 as an association, not causation; 80% as an aspiration agreed SHG by SHG.
- **Headroom price-rise** sits behind "Advanced analysis", closed by default and labelled "not part of the recommendation". The engine code and tests are kept.
- **Stress tests** now run on the hybrid at full commitment. The S3 golden values are still asserted in the tests.
- **Tests:**
  - `tests/golden_v2.test.ts` (29 tests read `golden_v2.json`);
  - e2e: the default plan is SH, 15 → 20, 100% bulk secured gives 20/20, server-rendered `/start`, advanced analysis hidden.
  - Totals: **57 unit, golden and parity tests and 5 e2e tests.**
- **Known gap between the pack's files:** `recompute_oracle.py` gives a different working capital (₹10.6–17.8 lakh on a value basis) and units per ₹1 lakh (3,418 / 2,392, rounded up) from `golden_v2.json` (₹10.3 / 13.7 / 17.0 lakh; 3,417 / 2,391). The app follows the golden file and the brief §4 formula, which match the deck.
- **P1 not started:**
  - working-capital panel and transfer bridge on `/ac-pnl`;
  - `/pilot` tracker;
  - inclusion chart and KPI scorecard;
  - gift-box presets;
  - workbook mapping on `/data`.

## Plain-language pass (for Prerna staff)
- Plans renamed: Today (S0) · Fix links (S1) · Fix channels (S2) · Fix both, recommended (S3); a banner on plan-driven pages says which plan is shown and what it changes.
- Pages renamed: Start here (new) · Overview · Warehouse links · Prices & channels · Compare plans · Buyers & gift boxes · Women's income · Warehouse finances · Data & sources.
- Jargon replaced across the UI (markup → warehouse margin/income; secure markup → safe income; headroom → below market by; inbound/outbound → transport in/delivery; levers → Assumptions).
- Every page has a "How to use this page" box. Start here explains the problem, the four plans, monthly routines by role and a glossary.
- **Bulk needs buyers:** new engine check `bulkDemandCheck` compares the volume a plan moves from online to bulk (2,250 units/month in Fix both) with buyer orders confirmed at LoI or later. Shown on Start, Overview and Prices & channels. Tested.
- Overview has an action list: which SHGs move warehouse and which products change channel in the selected plan.

## What was built
- **Engine** (`src/lib/engine/`, pure TypeScript, no I/O): rates, pricing, allocation (hub rule), channel rule, scenarios S0–S3 + stress tests, baseline product economics, corporate boxes (mixed-AC boxes rejected) and capacity check, headroom-for-inclusion + pass-through grid, inclusion volume test, social distribution (median, Gini, top-20%, correlation, archetypes), AC P&L + working capital, alerts, data-quality rules.
- **Tests**: `tests/golden.test.ts` (every BUILD_PLAN golden value), `tests/parity.test.ts` + `npm run parity` (01, 02, 13 reference outputs), `tests/seed.test.ts` (checksum, idempotency, counts, rate card, no PII fields, ODOP/GI), `tests/e2e/smoke.spec.ts` (S0 → S3 = 10 → 20; mixed-AC box blocked).
- **Screens**: Command Centre (KPIs, headroom chart, AC comparison, alerts) · Allocation (band table, what-if AC override feeding S1/S3, before/after volumes) · Products & Channel (price waterfall, online vs bulk at proposed AC, max markup, courier %, stockist headroom, filters) · Scenarios (S0–S3 summary, stress tests, product detail) · Buyers & Boxes (box builder, catalogue, buyer register, commitments with capacity check, committed-volume toggle) · Inclusion (KPIs, archetype scatter, participation + volume test, headroom-for-inclusion + 3×3 grid) · AC P&L (S0/S3 per AC, empty "to collect" opex and capacity inputs, break-even, working capital) · Data (provenance, quality checks, rate card, dataset, analyst attributes, CSV export, reset).
- **Levers drawer**: every CLAUDE.md lever with defaults, reset, and assumption tags.

## Next
1. Persist inputs server-side (Prisma + Postgres) with an audit log; RBAC for state/GDi, AC manager, DMM.
2. CSV import for orders, opex and commitments with PRD §11 validation; XLSX monthly review pack.
3. Allocation optimiser with capacity constraints once AC capacity is collected.
4. Release 2: grounded copilot, Impact Passport, Hindi UI.

## Open questions for UPSRLM / GDi
- Actual AC opex, capacity and staffing (all shown as "to collect").
- Benchmark source, date, channel and quality tier for each SKU (case benchmarks are undated).
- Road distances for band-edge cases (Varanasi–Lucknow 300 km; Jhansi–Bijnor 500 km).
- Packaging quotes and real buyer commitments for Prerna 365 boxes.
