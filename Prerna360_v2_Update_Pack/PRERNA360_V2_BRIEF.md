# Prerna 360 v2: align the app with the final GDi Partners submission

**For:** Claude Code, working in the `yawningwhaleAI/PRERNA` repo
**Live app:** https://prerna360.vercel.app/start (the deck's QR code points here)
**Written:** 27 Nov 2026. Submission is due today at 6 pm IST, so do P0 first and stop for review after it.

Read these files first, in this order:
1. `HANDOFF.md`
2. `CLAUDE.md`
3. `PROGRESS.md`
4. This brief
5. `context_v2/golden_v2.json`

---

## 1. Why v2 is needed

The app was built on 26 Nov. Its **recommended plan is "Fix both" (S3)**: re-link 7 SHGs and move all five failing staples to bulk.

The final submission (`context_v2/final_deck.pdf` and `context_v2/final_submission_workbook.xlsx`) recommends a different plan:

> **"Fix the AC links now; move products only when buyers commit."** This is a *demand-backed hybrid*:
> - Re-link 7 SHGs to Lucknow. This is the **floor: 15 of 20** products competitive, and it needs no new buyers.
> - Keep **jaggery** (3 × 1 kg) and **garam masala** (4 × 500 g) **online as multi-packs**.
> - Move **atta, detergent and mustard oil to institutional bulk only after a buyer commits**. That is 1,050 units a month, against 2,250 for blanket bulk.
> - **Ceiling: 20 of 20**, reached only when buyers commit. **17 of 20 is an illustrative base case** (75% of buyers accept packs, 50% of bulk secured).

An evaluator who scans the QR code during review lands on an app that recommends the plan the deck argues *against*. Closing that gap is the main job.

Other gaps:
- the "headroom-for-inclusion" price rise conflicts with "fair prices for buyers";
- the social screens don't separate dataset facts from field hypotheses;
- there is no pilot or gate tracker;
- the KPIs differ from the deck's scorecard;
- the start page renders as "Loading saved inputs…" before the JavaScript runs.

## 2. Guardrails (unchanged from CLAUDE.md, plus three)

**Unchanged from CLAUDE.md:**
- **Never edit `context/prerna_dataset.xlsx`.** The checksum test stays.
- **Every number comes from the engine.** Hardcode nothing in components. The golden values below are **test expectations**, not UI constants.
- **Keep parity:** all existing golden, parity and e2e tests stay green. S0 to S3 values must not change.
- **Privacy:** both workbooks in `context/` and `context_v2/` contain the candidate's phone and email in row 2. **Never surface them in the app.**
- **No invented data:**
  - buyers, AC operating costs and packaging quotes stay as "to collect" inputs;
  - no fake buyers, testimonials or certifications;
  - no fake Prerna packaging claims.

**New:**
- **Branch and deploy:** work on a new branch `claude/v2-hybrid`. Deploy a **Vercel preview** and send me the URL. **Do not merge to `main` or promote to production without my explicit OK**, because production serves the QR link.
- **Company name:** use **"GDi Partners"** everywhere (not just "GDi").
- **Wording:**
  - "Gross markup" is not profit; never call an AC "viable".
  - The −0.74 figure is an "observed association across 20 SHGs, not causation".
  - The 80% participation figure is an "aspiration agreed SHG by SHG, not a mandate". SHGs are autonomous, and UPSRLM cannot assign work.

## 3. Changes, by priority

### P0: before 6 pm today (aim for about 2 hours, then stop for review)

**P0-1. Add the hybrid plan and make it the recommended one**
- Add a plan id `SH` with this label and one-line description:
  - Label: "Fix links + buyer-backed hybrid (recommended)".
  - Description: "Re-link 7 SHGs; jaggery and garam masala online as multi-packs; atta, detergent and mustard oil to bulk only when a buyer commits."
- Rename S3 to **"Fix links + all staples to bulk"** and remove its "recommended" tag. Keep S0, S1 and S2 as they are.
- Rename S1 to **"Fix links (floor)"**.
- Use the hybrid channel map from `golden_v2.json` → `channels.hybrid_channels`. Store it as data or a config, not hardcoded in a component.
- Multi-pack pricing, per unit:
  - Formula: SHG price + inbound + markup + courier(pack kg) ÷ units per pack.
  - The engine already supports `unitsPerParcel` (from the S4 hamper work). Reuse it.
- Add a **commitment gate**:
  - A bulk switch in `SH` counts as competitive only for volume with a buyer commitment at LoI stage or later. `bulkDemandCheck` in `engine/channel.ts` already does part of this.
  - Unsecured volume stays online and is counted at risk.
- Default plan selection is `SH`. Add a migration so a stored `localStorage` plan of S3 is not forced to stay; bump the store key to `prerna360:v2` and migrate the inputs.

**P0-2. Demand scenarios panel** (on Compare plans and Overview)
- Two inputs, both badged `assumption`:
  - **Pack acceptance**, default 75%;
  - **Bulk secured**, default 0%, rising automatically from the committed volume in the buyers order book.
- Outputs:
  - products competitive;
  - AC markup secured;
  - income at risk (bulk still overpriced);
  - income lost (pack decliners);
  - women still exposed.
- Rule: a product counts as competitive **only if all its volume** sells at or below market.
- Presets: "No bulk buyer yet", "Base case (illustrative)" and "All buyers commit". Expected values are in `demand_scenarios_hybrid`.
- Next to it, a blanket-bulk comparison table at 0, 25, 50, 75 and 100% bulk secured (`demand_scenarios_blanket_bulk`).

**P0-3. Overview and Start messaging**
- Lead with three cards:
  - **Floor 15 / 20** (after re-linking, no buyers needed);
  - **₹42,400 a month freight saved**, with the label "passed to buyers as lower prices, not AC income";
  - **Ceiling 20 / 20** (only when buyers commit).
- Show the exposure as an **upper bound split by severity**:
  - ₹93,600 markup = ₹42,900 (more than 5% above market) + ₹50,700 (0–5% above);
  - ₹75,400 income = ₹35,500 + ₹39,900.
- Show the line "3 products stay above market even at zero markup" (garam masala, detergent, atta: courier is 47–63% of the SHG price).
- Replace the "Fix both moves 2,250 units / about 4.1 per store" callout with a comparison: hybrid 1,050 (1.9 per store) vs blanket bulk 2,250 (4.1 per store).

**P0-4. Render `/start` without waiting for the browser store**
- Today the server HTML shows only "Loading saved inputs…".
- Render the default-scenario numbers on the server or at build time (static data plus the engine at defaults), then hydrate the user's inputs.
- A phone scanning the QR code should see real numbers on first paint.

**P0-5. GDi Partners branding pass**
- Header and footer: "Prototype by Aryan Singh for the GDi Partners Consultant case, Round 1 · not an official Government of Uttar Pradesh website".
- Use the deck palette: navy `#204B75`, accent `#CB3500`, warm off-white `#F7F5F0`, slate `#4A5568`.
- Contact details: show the case email at most, never the phone.

**P0-6. Retire headroom-for-inclusion from the default experience**
- Move the price-rise grid behind an "Advanced analysis" toggle, off by default, labelled "not part of the recommendation".
- Keep its engine code and tests.

**P0-7. Tests**
- Add `tests/golden_v2.test.ts`, asserting every value in `golden_v2.json` from the engine:
  - plan SH at the three presets;
  - multi-pack prices (158.33 / 162.67 / 115.75 / 118.13);
  - reseller margins;
  - the 1,050 and 2,250 units;
  - the AC impact numbers;
  - working capital;
  - the gift box;
  - the social numbers.
- Extend e2e: on load, the default plan is SH and shows 15 → 20; moving the bulk-secured input to 100% shows 20 of 20.

### P1: today if P0 lands early, otherwise after submission

**P1-1. Warehouse finances (`/ac-pnl`)**
- A transfer bridge: Bijnor ₹1,57,500 → ₹83,400, Lucknow ₹61,800 → ₹1,35,900, so **₹74,100 moves**. Show units and kg alongside.
- A **break-even yardstick**: units needed per ₹1 lakh of monthly fixed cost (Bijnor 3,417, Lucknow 2,391), labelled "yardstick, not a cost estimate".
- A **working capital** panel:
  - inputs: online payment days (15) and institutional days (30, 60 or 90);
  - expected values: ₹10.3 / 13.7 / 17.0 lakh;
  - formula as given in the golden file;
  - a banner: "Unresolved: who funds it".
- An **operating-cost audit** form (rent, salaries, utilities, handling and packaging, losses and returns, marketplace fees), empty and marked "to collect monthly from Dec 2026".
- A **Bijnor transition plan** card with three items: west-UP onboarding, institutional demand, and support only if costs justify it.

**P1-2. Pilot tracker** (new page `/pilot`)
- Five strands from `golden_v2.json`, each with:
  - owner;
  - Gantt bar (Dec 2026 to Oct 2027);
  - "proceed if" and "if not" criteria;
  - a status (not started, on track, at risk, passed, failed).
- Three gates: end-Apr, end-Jul and end-Sep 2027. At each gate, show the criteria and a pass/fail input stored locally.
- Pilot scope: 11 SHGs, 118 members, 71 earning.
- The three UPSRLM decisions, with decision 3 flagged "Unresolved: working capital funding".

**P1-3. Women's income (`/inclusion`)**
- A ranked horizontal bar chart of the 10 lowest-participation SHGs, with an 80% reference line and income per earner.
- A 127 / 86 split bar as the hero.
- Two clearly separate blocks:
  - **"From the dataset"** (solid): top-20% share 48.9%; −0.74 labelled as an association, not causation; craft SHGs 34.7% vs other SHGs 72.3% of members earning;
  - **"To test in the field"** (dashed): skills held by a few, tools, too few orders, household time, group rules.
- An **SHG-agreed work plan** explainer: new tasks are offered first to members who earned nothing in the last 3 months; this is decided by the SHG and its village organisation.
- KPI scorecard exactly as in `golden_v2.json` → `kpis`. Gini and top-20% share are "monitor" only, with no target.
- The aspiration strip: +50 women needs +1,679 units a month (+27.5%), at today's output per woman.

**P1-4. Buyers & gift boxes (`/buyers`)**
- Default order size of 100 boxes.
- Box 2 preset: ₹2,615 by truck vs ₹2,705 as three online orders vs ₹3,150 at market (17% below market); ₹275 SHG profit and ₹330 markup per box.
- A capacity warning when the order is more than one month of brass diya or zari output.
- Advance-payment field (30–50%), and a pre-booking status per order.
- Label every buyer "target, not secured" until a commitment stage is set.

**P1-5. Data & sources (`/data`)**
- Add a "Submission workbook" section mapping each screen metric to its sheet in `final_submission_workbook.xlsx`:
  - Q1 Pricing;
  - Q2 Hub & Channel;
  - Q3 Scenarios & Viability;
  - Q3 Hybrid Plan;
  - Q4 Social Impact.
- Show the parity status: "48 of 48 deck figures reproduced".

### P2: after submission (roadmap, don't start without asking)
- Prisma + Postgres persistence (the first post-submission task in HANDOFF), with role-based access for State Mission, AC manager, DMM and federation users.
- Order book with buyer CRM stages (lead → LoI → PO → delivered → paid) feeding the commitment gate.
- Per-woman pay-record capture, using pseudonymous member codes only, in line with DPDP core duties from 13 May 2027.
- Monthly price check: market price inputs per product, with alerts when a selling price crosses the market price.
- An AI copilot (PRD Release 2) that explains numbers but never generates them.
- Hindi language toggle for AC and federation staff.
- Mobile-first Overview for the QR path.

## 4. Engine specification for plan SH

```
For each SHG at its re-linked AC (hub rule, unchanged):
  channel = hybrid_map[shg]   // "online", "online_pack(n)", "bulk_existing", "bulk_needs_buyer"
  inbound = kg * band_rate(distance to proposed AC)
  markup  = 0.15 * shg_price
  outbound:
    online           -> courier(kg)
    online_pack(n)   -> courier(n * kg) / n          // courier(w) = 50 + 25 * ceil(max(0, w - 1))
    bulk_*           -> 10 * kg
  sp = shg_price + inbound + markup + outbound
  competitive = sp <= market

Demand gate (inputs: packAcceptance r, bulkSecured c, both 0..1):
  base       = products not in pack set and not in needs-buyer set (all competitive after re-link: 15)
  competitive_count = base + (r > 0 ? #pack products : 0) + (c >= 1 ? #needs-buyer products : 0)
  markup_secured    = markup(base) + r * markup(pack) + c * markup(needs_buyer)
  income_at_risk    = (1 - c) * income(needs_buyer)
  income_lost_packs = (1 - r) * income(pack)
  women_exposed     = c < 1 ? earners(needs_buyer) : 0
  // c = min(1, committed_units_LoI_or_later / units(needs_buyer)) once the order book holds commitments

Working capital:
  payouts = sum(shg_price * units); logistics = sum((inbound + outbound) * units)   // hybrid channels
  b = sum over bulk SHGs (shg_price * units) / payouts                              // 0.193
  wc(days) = (payouts + logistics) * ((1 - b) * onlineDays + b * days) / 30
```

Expected values are all in `context_v2/golden_v2.json`. `context_v2/recompute_oracle.py` is an independent Python check; run it with `python3 -I context_v2/recompute_oracle.py context/prerna_dataset.xlsx`.

## 5. Definition of done (P0)
- [ ] The default plan is SH. Overview shows Floor 15 / 20, ₹42,400 (not AC income) and Ceiling 20 / 20.
- [ ] The demand panel reproduces all three presets exactly.
- [ ] `/start` server HTML contains real numbers (check with `curl`).
- [ ] GDi Partners naming everywhere; no phone number in the UI.
- [ ] Headroom price-rise is hidden by default.
- [ ] `npm test`, `npm run parity`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run e2e` all pass, with the new golden_v2 tests included.
- [ ] Screens checked at 390 px (phone, the QR path), 1024 px and 1440 px.
- [ ] A Vercel **preview** URL is shared. `PROGRESS.md` and `HANDOFF.md` are updated. Stop and wait for approval before production.
