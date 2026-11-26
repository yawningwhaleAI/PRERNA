# PROGRESS: Prerna 360

_Last updated: 26 Nov 2026_

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
