# HANDOFF: Prerna 360 (context for the next Claude session)

_Written 26 Nov 2026 at the end of the first build session. Read this first, then `CLAUDE.md` (project rules) and `PROGRESS.md` (status log)._

## 1. What this is
**Prerna 360** is a decision-support web app built for a GDi consulting case (Round 1) about UPSRLM's two Prerna
Aggregation Centres (warehouses) at **Bijnor** and **Lucknow**, Uttar Pradesh. From **October 2027** the warehouses must add
real transport costs to every product's price. The case shows that **10 of 20 products** then cost more than the market.

The app answers five monthly questions:
1. Which warehouse should each SHG ship to?
2. Should each product sell online or in bulk?
3. Which demand is actually committed (buyers, gift-box orders)?
4. Does each warehouse cover its costs?
5. Who earns, and who is left out?

**Submission deadline: 27 Nov 2026, 6 pm.** The user wanted a hosted, working prototype. That is done.

## 2. Where things are
| What | Where |
|---|---|
| Live app | **https://prerna360.vercel.app** (production, Vercel) |
| GitHub repo | `yawningwhaleAI/PRERNA` |
| Working branch | `claude/sleepy-cannon-ebzzjh` (all work is here; **`main` only has the original upload**) |
| Vercel team / project | team `yawningwhaleais-projects` (`team_LrapGCFaytqZ7NwOY2EHMip3`), project `prerna360` (`prj_Ztq4cso3dcfAhrlVUI6VKs0YUDGM`), linked to the GitHub repo, production branch `main` |
| Latest production deploy | commit `469f261`, deployment `dpl_FRuqDg1bo4CTr5aQc9sSEPwGMG7A` (READY) |

Commits on the branch: `22b5ded` engine + tests → `ec34cda` all screens → `adc6c84` UP emblem slot + disclaimer → `469f261` plain-language pass + bulk-buyer check.

## 3. Source material (all in `context/`, read-only)
- `prerna_dataset.xlsx`: **the case dataset, source of truth, never edit**. SHA-256 `389de30f…96e1` is asserted by a test.
  It covers 20 SHGs, 13 districts, 213 members and 127 earning women.
- `prerna_model.py` + `reference_outputs/`: the Python oracle. Re-running it reproduces every reference file byte for byte.
- `prerna_calculations.xlsx`: the user's formula-driven Excel. It contains the user's personal contact details on its Cover sheet; never surface that.
- `PRD.md`: the MVP is §13; Module 7 (Buyers) is MVP; the AI copilot is Release 2.
- `research_dossier.md`, `findings_register.md`, `assumptions_register.md`: the reasoning behind each rule.
- `case_study.pdf`: the original case brief.
- `archive/`: older duplicate copies of the research, kept for history.

## 4. Stack and architecture (as built)
- **Next.js 15.5 (App Router) + React 19 + TypeScript strict** (`noUncheckedIndexedAccess`), **Tailwind v4**, **Recharts 3**, **Vitest 3**, **Playwright 1.63.0** (pinned to the sandbox's pre-installed browser).
- No shadcn CLI was used. There are small hand-written components in `src/components/ui.tsx`.
- **Engine** in `src/lib/engine/`:
  - pure TypeScript, no I/O;
  - files: `rates`, `pricing`, `allocation`, `channel`, `scenarios`, `baseline`, `boxes`, `inclusion`, `social`, `pnl`, `alerts`, `quality`, `levers`, `types`;
  - a port of `prerna_model.py` that keeps the same order of arithmetic, so floating-point results match exactly.
- **Data:** `npm run seed` (`scripts/seed.ts` and `scripts/case-reader.ts`):
  - reads the dataset plus the analyst attributes (Assumptions sheet, section C, of the calculations workbook);
  - writes them to `src/data/case-data.json`;
  - the headers are validated, and the checksum is guarded.
- **No database at runtime (prototype deviation from CLAUDE.md, approved by the user).** SQLite can't persist on Vercel.
  - User inputs live in the browser (`src/lib/store.tsx`, `localStorage` key `prerna360:v1`): assumptions/levers, warehouse overrides, opex, capacity, buyers, boxes, commitments and the committed-volume toggle.
  - Money inputs are stored in integer **paise**.
  - Prisma + Postgres is the first post-submission task.
- `src/lib/model.ts` (`useModel`): the single hook that runs the engine for the current state. **Every number on screen comes from here.** Never hardcode figures in components; take rates and levers from data/state.
- All pages are static client components, so the deploy needs no environment variables.

## 5. Business rules (from CLAUDE.md; implemented exactly)
- **Selling price (SP)** = SHG price + inbound + 15% markup + outbound.
- **Inbound** = kg × ₹10/20/30/40 by band (≤100 / 101–300 / 301–500 / >500 km). 0 km uses the first band; band edges go to the lower band (lever `edgeInclusive`).
- **Online outbound** = ₹50 for the first kg + ₹25 per extra kg or part (`ceil`). **Bulk** = ₹10/kg.
- **Competitive** means SP ≤ market. Otherwise the product's markup and SHG income count as "at risk".
- **Hub rule:** lower band wins; on a tie, keep the current link.
- **Channel rule:**
  - keep bulk if already bulk;
  - else online if it works;
  - else bulk if it works;
  - else online, flagged.
- **Boxes:** contents from one AC only (mixed boxes are blocked). Box SP = Σ(price + inbound + markup) + packaging + delivery.
- **Headroom-for-inclusion:** online products with headroom > 10%. New price = (0.9 × market − inbound − outbound) / 1.15, plus a 3×3 pass-through grid.

## 6. Decisions taken (the user said "do what you think is best")
| Topic | Decision |
|---|---|
| Repo layout | Pack contents moved to the repo root; old copies to `archive/` |
| **Lever semantics** | Levers **re-derive** hub and channel decisions (as the Excel main tables do). **Stress tests freeze the S3 plan** and shock rates or volume (as the Excel stress block does). This is why the golden values S3 at +10% / +20% = 17 / 15 hold |
| Band-edge golden test | Asserts SHG-14 at Lucknow online = ₹655 > ₹650 (uncompetitive in S1 with the lever off). With the lever off, the S3 channel rule moves SHG-14 to bulk instead |
| Members | Stored as **counts per SHG** only. No member rows are fabricated; no personal fields anywhere (a test checks the keys) |
| AC P&L | Its own page ("Warehouse finances"). Contribution starts from *secure* markup (as the Excel does). Opex starts **empty, "to collect"** |
| Channel buffers | Not added (the CLAUDE.md rule as written); stockist headroom shown as information |
| Scenarios | UI shows S0–S3 plus stress tests. The engine supports `unitsPerParcel` so parity covers the S4 hamper row |
| Category labels | The workbook's labels are used; the text `category` column is excluded from parity |
| Box AC basis | Boxes use S3 links, including any what-if overrides |
| UP Government emblem | User asked for it. A header slot shows `public/up-emblem.png` **if the file exists (checked at build time)**. A visible line, "Prototype · not an official Government of Uttar Pradesh website", was added. **The file is not in the repo yet**: the user must upload it, then redeploy |

## 7. UI language (plain-language pass, latest commit)
The user asked for the app to be simple enough for Prerna staff. The mapping:

**Plans** (internal IDs unchanged):

| ID | Shown as |
|---|---|
| S0 | Today |
| S1 | Fix links |
| S2 | Fix channels |
| S3 | Fix both (recommended) |

Names and one-line descriptions live in `SCENARIOS` in `engine/scenarios.ts`.

**Pages / routes:**

| Page | Route |
|---|---|
| Start here (landing) | `/start` |
| Overview | `/command-centre` |
| Warehouse links | `/allocation` |
| Prices & channels | `/products` |
| Compare plans | `/scenarios` |
| Buyers & gift boxes | `/buyers` |
| Women's income | `/inclusion` |
| Warehouse finances | `/ac-pnl` |
| Data & sources | `/data` |

**Terms:**

| Term in code / analysis | Shown as |
|---|---|
| markup | warehouse margin / income |
| secure markup | safe income |
| headroom | below market by |
| inbound / outbound | transport in / delivery |
| levers | **Assumptions** (drawer) |
| AC | warehouse |

**Help on screen:**
- Every page has a "How to use this page" box (`HowTo` in `ui.tsx`).
- A banner shows the active plan on plan-driven pages.
- The **Overview action list** shows which SHGs move warehouse and which products change channel, and why.

**Bulk needs buyers.** The user asked how products can move to bulk when orders today are online. The answer built in:
- A switch is a *target until a buyer commits*. `bulkDemandCheck` (in `engine/channel.ts`) compares the volume a plan moves online → bulk with commitments at LoI stage or later.
- Fix both moves **2,250 units/month** (SHG-01, 05, 06, 09, 16), about 4.1 per Prerna Saras store.
- It is shown on Start, Overview and Prices & channels.

## 8. Verification status (all green at `469f261`)
- `npm test`: **28 tests**, covering golden (every BUILD_PLAN value), parity, seed and bulk-demand.
- `npm run parity`: **1,452 values** match `reference_outputs` 01, 02 and 13.
- `npm run lint`, `npm run typecheck`, `npm run build`: clean.
- `npm run e2e`: 2 Playwright tests. S0 → S3 takes competitive products from 10 to 20; a mixed-AC box is rejected.
- Screens checked at 1440 px and 1024 px with no page-level horizontal scroll.

**Key golden values:**
- Honey SP ₹285.
- Competitive count S0/S1/S2/S3 = 10/15/19/20.
- S0 markup ₹2,19,300, of which ₹93,600 is at risk. S0 income at risk ₹75,400, affecting 69 women.
- Logistics outlay S0/S1/S2/S3 = 4,01,900 / 3,59,500 / 2,48,800 / 2,51,000.
- S3 secure markup: Bijnor ₹83,400, Lucknow ₹1,35,900.
- Re-link: 7 SHGs, saving ₹42,400.
- Social: median ₹1,050; Gini 0.4239 (earners) and 0.6565 (all members); top-20% share 0.4885.
- 1,679 extra units for 80% participation.
- Essentials box: ₹596 bulk / ₹671 courier.
- Headroom grid at 100% / 100% = ₹29,696.

## 9. How to run / deploy
```bash
npm install
npm run seed      # only if the dataset or attributes change
npm test && npm run parity
npm run build && npm run e2e
npm run dev
```
**Deploy** (from a Claude session with the Vercel connector): call `create_deployment` with
`{project: "prerna360", target: "production", gitSource: {type: "github", org: "yawningwhaleAI", repo: "PRERNA", ref: "claude/sleepy-cannon-ebzzjh", sha: "<commit>"}}`
on team `team_LrapGCFaytqZ7NwOY2EHMip3`.
- Pushes to the branch do **not** update production on their own, because the production branch is `main`.
- Once the branch is merged into `main`, pushes deploy automatically.

## 10. Gotchas learned
- The sandbox **cannot reach `*.vercel.app` or Wikimedia** (proxy 403 / DNS). Check deployments with the Vercel connector (`get_deployment`, `web_fetch_vercel_url`).
- Project protection is `ssoProtection: all_except_custom_domains` (standard). `prerna360.vercel.app` *should* be public; the user was asked to confirm in a private window.
- Table CSS (`.tbl`, `.btn`, `.field`) lives in `@layer components` in `globals.css`. If it moves out of the layer, Tailwind utilities like `whitespace-normal` stop working.
- When re-running e2e or screenshots, kill stale servers first (`pkill -f next-server`). An old server serves an old build and produces chunk 400s.
- Pasted images in chat are **not** saved to disk. Ask for file attachments, or have the user commit the file to the repo.
- Keep Playwright pinned at `1.63.0` to match `/opt/pw-browsers`.

## 11. Open items / next steps
1. **UP emblem:** the user must add `public/up-emblem.png` to the branch; then redeploy.
2. **Merge to `main`** (ask the user; a PR has not been created) so Vercel auto-deploys.
3. Post-submission:
   - Prisma + Postgres (Neon / Vercel Postgres) for shared, persistent inputs, plus an audit log and roles;
   - CSV import (orders, opex, commitments) with the PRD §11 validation rules;
   - an XLSX monthly review pack;
   - an allocation optimiser with capacity constraints;
   - Release 2: the grounded copilot, Impact Passport and Hindi UI.
4. Field data to collect (the app shows these as "to collect"):
   - AC opex and capacity;
   - benchmark source and date;
   - road distances at band edges;
   - packaging quotes;
   - real buyer commitments.

## 12. Working rules for the next session
- Follow `CLAUDE.md`. Its non-negotiables:
  - every number comes from the engine;
  - never edit the case dataset;
  - never edit expected test values (fix the engine instead);
  - tag assumptions;
  - leave missing data as "to collect";
  - no personal identifiers anywhere.
- Commit on `claude/sleepy-cannon-ebzzjh` and push. Don't push to `main` or open a PR without asking.
- After changes, run test, parity, lint, typecheck, build and e2e, then update `PROGRESS.md`.
