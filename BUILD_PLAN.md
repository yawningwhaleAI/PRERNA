# Prerna 360: MVP build plan
Build in order. Stop after each milestone, run the tests, update `PROGRESS.md`, and wait for review.

## M0. Scaffold (≈1 hour)
- Next.js + TS strict + Tailwind + shadcn/ui + Prisma (SQLite) + Vitest + Playwright.
- App shell: left nav with **Command Centre · Allocation · Products & Channel · Scenarios · Buyers & Boxes · Inclusion · Data**. Top bar shows a scenario selector (S0–S3) and a "Levers" drawer.
- Apply the GDi palette and table styles from `CLAUDE.md`.

**Done when:** the app runs, the nav renders, and an empty test suite passes.

## M1. Data model + seed (≈2 hours)
- Prisma schema per PRD §6.1. MVP tables:
  - `District`, `Ac`, `Shg`, `Member` (pseudonymous code only), `Product`, `ShgPrice`, `Distance`;
  - `RateCard` (versioned JSON), `Benchmark` (source, observedOn, channelType);
  - `Buyer`, `Box`, `BoxItem`, `BuyerCommitment`;
  - `AcExpense`, `Scenario`, `AuditLog`.
- `npm run seed` reads `context/prerna_dataset.xlsx` (sheet "SHG Data") **without altering values**. It creates 2 ACs, 13 districts, 20 SHGs and their products, distances, prices and benchmarks, and the case rate card as version 1. It also loads analyst attributes (category, group, brand tier, ODOP/GI) into a separate table; take the values from the `Assumptions` sheet of `context/prerna_calculations.xlsx`.

**Done when:** the seed is idempotent, and the DB counts are 20 SHGs, 213 members (as counts per SHG), 2 ACs and 13 districts.

## M2. Calculation engine + golden tests (≈3 hours) ← most important
- Implement the pure functions in `src/lib/engine/` exactly per the rules in `CLAUDE.md`.
- `tests/golden.test.ts` must assert (default levers):

| Check | Expected |
|---|---|
| Honey SHG-02 SP, Bijnor online | 285 (markup 30) |
| Atta SHG-16: Bijnor online / Lucknow bulk | 626 / 426 |
| Online outbound for 2 kg / 5 kg; bulk 0.5 kg | 75 / 150 / 5 |
| Products competitive S0 / S1 / S2 / S3 | 10 / 15 / 19 / 20 |
| S0 AC markup total; at risk | 219,300; 93,600 |
| S0 SHG income at risk; earning women at risk | 75,400; 69 |
| Logistics outlay S0 / S1 / S2 / S3 | 401,900 / 359,500 / 248,800 / 251,000 |
| S3 secure markup Bijnor / Lucknow | 83,400 / 135,900 |
| S0 secure markup Bijnor / Lucknow | 75,900 / 49,800 |
| Re-linked SHGs; inbound saving | 7 (SHG-11…17); 42,400 |
| S3 at +10% / +20% logistics rates: competitive | 17 / 15 |
| Members; earners; median income per earner | 213; 127; 1,050 |
| Gini earners / all members; top-20% share | 0.4239 / 0.6565; 0.4885 (±0.0005) |
| Extra units for 80% participation | 1,679 (±1) |
| Essentials box, packaging ₹40: bulk / courier SP | 596 / 671 |
| Purvanchal box headroom bulk / courier | 8.6% / 3.4% |
| Headroom grid at 100% to profit, 100% volume kept | 29,696 (±1) |
| Band-edge lever off → SHG-14 at Lucknow | uncompetitive (655 vs 650) |

- `npm run parity` compares engine outputs with `context/reference_outputs/01_baseline_product_economics.csv`, `02_scenario_summary.csv` and `13_corporate_box_economics.csv`. It prints any mismatch.

**Done when:** all golden and parity tests pass.

## M3. Allocation + Products & Channel screens (≈3 hours)
- **Allocation:** table of 20 SHGs showing distance to each AC, the band at each, inbound per unit at each, cheapest AC, proposed AC, saving per unit and per month, and a flag for "closer AC, same band". A "Before/after" card per AC shows SHGs, units, kg and % change. Users can drag or override the AC for any SHG (what-if), and the override flows into the scenarios.
- **Products & Channel:** price-build waterfall per product (SHG price → inbound → markup → outbound → SP vs market), the online vs bulk comparison, max markup, courier % of SHG price, the proposed channel, and stockist headroom. Filters: AC, brand tier, competitive or not.

**Done when:** the numbers match the golden tests and a manual override updates the totals.

## M4. Scenarios + Levers + Command Centre (≈3 hours)
- **Levers drawer:** every lever from `CLAUDE.md`, with reset to defaults. Lever values are stored per saved scenario.
- **Scenarios:** an S0–S3 side-by-side summary (the same rows as the Excel "Scenarios" summary) plus stress tests (rates +10/+20%, volume −20%).
- **Command Centre:** KPI header (competitive count, markup at risk, income at risk, logistics outlay, secure markup per AC, participation) for the selected scenario. Alert list:
  - SP > market;
  - headroom < 5%;
  - AC capacity > 85% once capacity is entered;
  - opex missing;
  - band-edge distance (±10 km of 100/300/500).

**Done when:** changing a lever updates every screen consistently.

## M5. Buyers & Boxes: Prerna 365 order book (≈3 hours)
- Buyer register (type: corporate / government-GeM / hotel / Prerna store / canteen; stage: lead → sample → LoI → PO → delivered → repeat).
- **Box builder:** pick SKUs; **block mixed-AC boxes**. Show box SP for bulk vs courier delivery, Σ market, headroom, SHG income and AC markup per box and per order, and months of current output for the binding SKU.
- Commitments (units × delivery month × stage). A **capacity check** warns when committed units exceed output over the lead time.
- Committed volume can replace assumed volume in scenarios (toggle).

**Done when:** the three seeded boxes reproduce the Excel "Corporate Boxes" values and a mixed-AC box is rejected.

## M6. Inclusion + AC P&L inputs (≈2 hours)
- **Inclusion:** participation by SHG; archetype scatter (participation × income per earner); median, Gini and top-20% share; SHGs below 50% participation; inclusion volume test (new earners and extra units at the target participation); headroom-for-inclusion table with the 3×3 sensitivity grid.
- **AC P&L:** the S0 and S3 columns from the Excel "AC P&L". Variable and fixed cost inputs start **empty and marked "to collect"**. Break-even shows "opex needed" until filled in. Working capital at 15/30/45 days.

**Done when:** the numbers match the golden tests, and opex inputs persist and recalculate contribution and break-even.

## M7. Data import + polish + deploy (≈2 hours)
- CSV import for orders, opex and commitments (templates downloadable); validation rules per PRD §11 (active ≤ members, weight > 0, profit < price, benchmark ≤ 120 days old, etc.).
- Export: a monthly review pack (XLSX) of the current scenario.
- Playwright smoke test: open the app, switch S0 → S3, competitive count goes 10 → 20.
- Deploy to Vercel (Postgres via Neon or Vercel Postgres).

## Release 2 (not in MVP)
- Grounded AI copilot (PRD §9): tool-calling only; every number must come from an engine or SQL tool, checked by a numeric-provenance guard.
- Impact Passport QR pages (SHG-level).
- Hindi UI and offline mobile forms.
- LokOS integration.
