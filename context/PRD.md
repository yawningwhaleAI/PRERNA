# Deliverable 5: Prerna 360 Product Requirements Document
**Product:** PRERNA 360, an SHG Aggregation & Livelihood Intelligence Platform
**Version:** 0.9 (discovery) · **Date:** 26 Nov 2026 · **Owner:** GDi product lead · **Build target:** Claude Code
**Status:** Requirements only. Nothing is built yet. **v0.9.1 (26 Nov 2026):** MVP narrowed to the operating-model decision flow, a Buyer & Commitments module added, copilot moved to Release 2, DPDP timeline added.

> **Positioning:** Prerna 360 is the *operating system* for the recommended model, not the innovation itself. The innovation is the operating model: band-based hubs, channel rules, pre-booked Prerna 365 demand and inclusion compacts. The MVP must prove that decision flow first.

---

## 1. Product vision
> *Every decision about where an SHG ships, how a product is sold and what price it carries should be made in minutes, on verified numbers, with each woman's income visible.*

Prerna 360 turns the October-2027 transition from a spreadsheet exercise into a monthly operating rhythm. It combines one source of truth (SHGs, members, products, orders, costs), a **deterministic calculation engine** that encodes the Prerna pricing rules, optimisers for hub and channel, and a **grounded AI copilot** that explains results and never invents numbers.

**Design principles**
1. **Deterministic first.** Every number comes from a versioned function and versioned inputs. The LLM only selects tools and explains their outputs.
2. **Trace to source.** Every KPI drills down to transactions or to a labelled assumption.
3. **Inclusion is a first-class metric**, not a footnote: member-level income sits beside AC P&L.
4. **Built for low bandwidth and Hindi.** Mobile-first data entry for SHG and AC staff; desktop analytics for state and GDi.
5. **Use what exists.** Integrate with LokOS/DAR and marketplace order exports rather than duplicating them.

## 2. Problems solved
| Problem today | Prerna 360 answer |
|---|---|
| Nobody sees post-Oct-2027 prices before they happen | Shadow pricing for every SKU, channel and AC (Module 3/4) |
| SHG–AC links are legacy | Band-aware allocation optimiser with capacity and viability constraints (Module 2) |
| AC viability unknown | AC P&L from orders, rate cards and opex entries; break-even (Module 1/4) |
| Channel chosen by habit | Online vs bulk decision rule per SKU (Module 3) |
| Women's income invisible below SHG level | Member-level payouts, participation, distribution KPIs (Module 5) |
| Questions take days of Excel work | A grounded copilot answers in plain language with citations to calculations (Module 6) |

## 3. Target users and personas
| Persona | Context | Primary jobs | Key screens | Device / language |
|---|---|---|---|---|
| **P1 State Mission leadership** (MD / Marketing head, UPSRLM) | Monthly review, policy calls | Approve re-links, channel shifts, grants; track Lakhpati contribution | Command Centre, Scenario Simulator, Copilot | Desktop; English/Hindi |
| **P2 GDi analyst / consultant** | Builds analysis, prepares reviews | Run scenarios, export packs, validate data | All modules; data QA | Desktop; English |
| **P3 AC Manager** (Bijnor/Lucknow) | Daily operations | Inbound and outbound logs, opex entry, capacity, payout status | AC view, Alerts, Data entry | Tablet/desktop; Hindi |
| **P4 District Mission Manager** | Field coordination across SHGs | SHG scorecards, inclusion cohorts, store sell-through | Inclusion dashboard, SHG scorecard | Mobile; Hindi |
| **P5 CLF accountant / SHG book-keeper** | Records | Enter member payouts, training, production participation | Mobile forms | Android, offline-capable; Hindi |
| **P6 Read-only partner** (marketplace, buyer, auditor) | Periodic | View agreed reports | Report pages | Web |

## 4. Core modules and functional requirements
IDs: **FR-x.y**. Priority: **M** = MVP, **N** = next release, **L** = later.

### Module 1: Command Centre
| ID | Requirement | Pri |
|---|---|---|
| FR-1.1 | KPI header for each AC and for the state: GMV, units, markup, *secure* markup, logistics outlay, products competitive (#, %), income at risk, participation | M |
| FR-1.2 | AC comparison (Bijnor vs Lucknow): volume, kg, markup, opex coverage, capacity utilisation | M |
| FR-1.3 | Product leaderboard: headroom %, gap ₹, trend | M |
| FR-1.4 | **Alerts & exceptions** engine: headroom < 5%; SP > market; capacity > 85%; payout delay > N days; participation drop > 10 pp; data stale > 30 days; band-edge distance (±10 km of 100/300/500) | M |
| FR-1.5 | Monthly business-review pack export (PDF/PPT/XLSX) | N |
| FR-1.6 | Drill-down from any KPI to the SHG, SKU and transactions | M |

### Module 2: Logistics Optimiser
| ID | Requirement | Pri |
|---|---|---|
| FR-2.1 | Per-SHG inbound cost to each AC by **band** (not km); show cheapest, closest and tie flags | M |
| FR-2.2 | Allocation optimiser (see §8) with constraints: AC capacity (kg/month), product-infrastructure compatibility, viability floor per AC, max re-links per period, tie = keep current | M |
| FR-2.3 | Scenario compare: current vs optimised, plus user-defined "what if" (drag an SHG to another AC) | M |
| FR-2.4 | Savings view: ₹ per unit, ₹ per month; phasing suggestions ranked by saving | M |
| FR-2.5 | Rate-card manager: versioned inbound bands, online and bulk rules, effective dates; supports a future PTL/FTL route-based card | M |
| FR-2.6 | New-hub test: enter a candidate hub location and its opex; get the upper-bound saving and payback | N |
| FR-2.7 | Pickup route planner (milk-run) once real routes and rates exist | L |

### Module 3: Product Intelligence
| ID | Requirement | Pri |
|---|---|---|
| FR-3.1 | Price build-up waterfall per SKU × AC × channel (SHG price, inbound, markup, outbound, SP vs market) | M |
| FR-3.2 | Benchmark manager: market price with **source, date, channel (retail/wholesale), quality tier**; staleness flag | M |
| FR-3.3 | Online vs bulk decision rule (Dossier §9.2) with configurable buffer and resale headroom per channel | M |
| FR-3.4 | Portfolio classification (Protect/Scale, Re-link, Channel-shift, Premium, Turnaround, Validate), computed from rules | M |
| FR-3.5 | Max-markup calculator; hamper/bundle calculator (units per parcel) | M |
| FR-3.6 | Attributes: ODOP/GI flags, perishability, fragility, shelf life → channel suggestions | N |
| FR-3.7 | Price-test tracker (A/B tests on marketplaces; volume response) | L |

### Module 4: Financial Scenario Simulator
| ID | Requirement | Pri |
|---|---|---|
| FR-4.1 | Preset scenarios S0–S5 (baseline, re-link, channel, combined, hamper, headroom-sharing) | M |
| FR-4.2 | Sliders: volume ±%, inbound/outbound rate inflation %, markup %, hamper units per parcel, headroom target %, payment cycle days | M |
| FR-4.3 | AC P&L: markup, variable costs, contribution, fixed opex, operating profit; break-even units; opex-coverage ratio | M |
| FR-4.4 | Working capital: payouts + logistics × cycle days | M |
| FR-4.5 | Side-by-side scenario comparison with difference columns; save and name scenarios; audit log | M |
| FR-4.6 | Monte-Carlo or tornado sensitivity on volume and rates | N |

### Module 5: SHG Inclusion Dashboard
| ID | Requirement | Pri |
|---|---|---|
| FR-5.1 | Members, earners, participation by SHG, district, AC and category | M |
| FR-5.2 | Member-level income: monthly payouts (actual, not equal split), median, P10/P90, Gini, top-20% share | M (actual data) |
| FR-5.3 | SHG archetype quadrant (participation × income per earner) | M |
| FR-5.4 | Training → production funnel: trained, first payout ≤ 90 days, sustained ≥ 5 of 6 months (**trained is never counted as earning**) | M |
| FR-5.5 | Inclusion compact tracker (headroom price change ↔ participation target) | N |
| FR-5.6 | Household income link to Lakhpati status via LokOS/DAR (read-only) | N |
| FR-5.7 | Intervention list: SHGs needing action (zero sales, participation < 50%, income at risk) | M |

### Module 7: Buyer & Commitments (Prerna 365 order book): **MVP**
| ID | Requirement | Pri |
|---|---|---|
| FR-7.1 | Buyer register (corporate, government/GeM, hotel, Prerna store, canteen), with contact owner and stage (lead → sample → LoI → PO → delivered → repeat) | M |
| FR-7.2 | Box/catalogue builder: choose SKUs **from one AC only** (validation blocks cross-AC boxes); computes box SP for bulk vs courier delivery, packaging parameter, Σ market benchmark, headroom, SHG income and AC markup per box | M |
| FR-7.3 | **Capacity check before accepting a PO:** units required vs monthly output per SHG over the lead time; flags the binding SKU and the extra women needed | M |
| FR-7.4 | Commitment tracker: committed units by SKU and month, feeding production plans and the Scenario Simulator (validated bulk volume replaces assumed volume) | M |
| FR-7.5 | Advance and payment tracking (advance %, due dates) for working capital | N |
| FR-7.6 | Impact Passport generator: static QR page per box or SKU from order and payout records (SHG-level only); quarterly buyer statement | N |

### Module 6: AI Copilot (grounded): **Release 2, not MVP**
| ID | Requirement | Pri |
|---|---|---|
| FR-6.1 | Natural-language Q&A in English and Hindi over programme data | M |
| FR-6.2 | **Tool-only numerics:** every number in an answer comes from a tool call (calculation engine or SQL view). The answer shows a "source chip" (tool, inputs, data version) | M |
| FR-6.3 | Refuse or flag when data are missing ("opex not entered for Bijnor; cannot compute break-even") | M |
| FR-6.4 | Distinguish **facts**, **calculations**, **assumptions** and **recommendations** in every answer | M |
| FR-6.5 | Suggested questions per persona; follow-up drill-downs open the relevant module | N |
| FR-6.6 | Conversation log with decisions recorded (who approved what) | N |

**Example question → tool plan**
| Question | Tools invoked | Answer shape |
|---|---|---|
| "Which SHGs should be reassigned?" | `optimise_allocation(constraints)` | Table: SHG, from→to, ₹ saved, constraints binding; caveat on capacity |
| "Why is SHG-16's atta uncompetitive?" | `price_build(SHG-16, ac, channel)` ×4 | Waterfall; root cause: inbound ₹200 + courier ₹150 = 56% of SP; fix: re-link + bulk = ₹426 vs ₹440 |
| "Which products should move to bulk?" | `channel_rule(all)` | List + headroom + bulk demand flag |
| "Lowest participation SHGs?" | `sql: v_participation ORDER BY rate` | Top 5 + archetype + suggested intervention |
| "What if volumes fall 20%?" | `run_scenario(S3, vol=-20%)` | Competitive count, markup change, opex coverage |
| "What should UPSRLM prioritise?" | `rank_interventions()` (rules: ₹ impact × women affected × feasibility) | Ranked list labelled **recommendation**, with evidence chips |

## 5. User workflows
1. **Monthly close (AC Manager → State).** Import orders (CSV/API) → enter opex and capacity → system computes AC P&L and alerts → manager comments → state review pack.
2. **Quarterly re-optimisation (GDi analyst).** Refresh benchmarks and rate cards → run optimiser → review constraint report → propose re-links → leadership approves in-app (logged) → DMMs notify SHGs.
3. **Channel switch (State + AC).** Product flagged "channel-shift" → pilot plan (stores, buyers) → track sell-through for 3 months → gate decision.
4. **Inclusion cohort (DMM).** Select SHGs from the intervention list → register trainees → track first payout → monthly funnel.
5. **Copilot query (any role).** Ask → tool plan → grounded answer → open module for detail.

## 6. Data architecture

### 6.1 Core entities (relational; PostgreSQL)
```
district(id, name, region)
ac(id, name, district_id, capacity_kg_month, capacity_units_month, active_from)
shg(id, code, district_id, linked_ac_id, federation_id, created_at)
member(id, shg_id, pseudonymous_code, joined_on, status)            -- no names/Aadhaar in analytics schema
product(id, shg_id, name, category, weight_kg, odop_flag, gi_flag, perishability, fragility, shelf_life_days)
shg_price(id, product_id, price, profit_per_unit, effective_from, effective_to)
distance(id, shg_id, ac_id, km, source, verified_on)
rate_card(id, version, effective_from, type{inbound_band|online|bulk|route}, params_json)
channel(id, name{online|bulk}, sub_channel{amazon|flipkart|meesho|ondc|esaras|prerna_mart|prerna_store|gem|b2b|canteen})
benchmark(id, product_id, price, channel_type{retail|wholesale}, quality_tier, source, observed_on)
order(id, ac_id, channel_id, buyer_id, order_date, status, payment_mode, settled_on)
order_line(id, order_id, product_id, units, sp_charged, inbound_alloc, outbound_actual, markup)
consignment_inbound(id, shg_id, ac_id, dispatch_date, kg, cost_actual, invoice_ref)
shipment_outbound(id, order_id, kg, cost_actual, carrier, rto_flag)
buyer(id, type{consumer|retailer|institution|prerna_store|govt}, name, district_id, payment_terms_days)
ac_expense(id, ac_id, month, category{rent|salary|utilities|packaging|commission|it|other}, amount, fixed_flag)
payout(id, shg_id, month, amount_total)
member_payout(id, member_id, month, amount, basis{patronage|equal|wage})
training(id, member_id, programme, start, end, completed)
participation(id, member_id, month, produced_units, hours_optional)
scenario(id, name, params_json, created_by, created_at, data_version)
scenario_result(id, scenario_id, metric, scope, value)
intervention(id, shg_id, type, start, status, owner)
alert(id, type, scope, severity, raised_at, resolved_at)
audit_log(id, actor, action, entity, before_json, after_json, at)
box(id, name, ac_id, tier{essentials|signature}, packaging_cost, active)             -- all box_items must share box.ac_id
box_item(id, box_id, product_id, qty)
buyer_commitment(id, buyer_id, box_id|product_id, units, delivery_month, stage{lead|sample|loi|po|delivered}, advance_pct, price_agreed)
```

### 6.2 Key relationships
- An SHG belongs to one district and one linked AC (historised through `shg_link_history`).
- An SHG has many members and (in the case) one product. The schema allows many products.
- Product prices and benchmarks are time-versioned. Every calculation stores the `data_version` it used.
- Orders → order lines → product. Shipments are actual-cost records that reconcile against the rate card.
- Member payouts roll up to SHG payouts (validation: Σ member = SHG payout ± tolerance).

### 6.3 Analytical views (semantic layer)
`v_price_build`, `v_competitiveness`, `v_ac_pnl_month`, `v_secure_markup`, `v_allocation_cost`, `v_participation`, `v_income_distribution`, `v_alerts_open`. The copilot reads only these views and the calculation API.

### 6.4 Required operational inputs
| Input | Who | Frequency | Format |
|---|---|---|---|
| Orders & returns | AC / marketplace export | Daily–weekly | CSV/API |
| Inbound consignments & invoices | AC | Per dispatch | Mobile form / CSV |
| AC opex | AC accountant | Monthly | Form |
| Capacity | AC manager | Quarterly | Form |
| Benchmarks | GDi / UPSRLM | Quarterly | Form with source and date |
| SHG price & profit | SHG via DMM | On change | Form (maker-checker) |
| Member payouts, participation, training | CLF / SHG book-keeper | Monthly | Offline-capable mobile form; LokOS import later |
| Rate cards | UPSRLM procurement | On change | Admin console |

## 7. Calculation engine
- **Library:** a pure-function module (port of `analysis/prerna_model.py`) exposing: `inbound_rate(km, card)`, `inbound_cost(w, km, card)`, `outbound_cost(w, channel, card, units_per_parcel)`, `selling_price(product, ac, channel, markup, card)`, `competitiveness(sp, benchmark, buffer)`, `ac_pnl(month, ac)`, `working_capital(cycle_days)`, `income_distribution(month, scope)`, `inclusion_volume_test(target_rate)`.
- **Golden tests** (must pass in CI):
  - Honey (SHG-02) online from Bijnor = **₹285**; AC earns **₹30** (case example).
  - Atta (SHG-16) at Bijnor online = **₹626**; at Lucknow bulk = **₹426**.
  - Detergent 2 kg online outbound = **₹75**; atta 5 kg = **₹150** (case examples).
  - S0 totals: markup **₹2,19,300**; at risk **₹93,600**; logistics **₹4,01,900**; S3 logistics **₹2,51,000**.
  - Social: 213 members, 127 earners, Gini (all members) **0.6565**.
  - Essentials Festive Box (Bijnor), packaging ₹40, bulk delivery = **₹596** vs Σ market ₹730; courier = **₹671**.
  - Headroom pass-through grid at 100% / 100% = **+₹29,696**.
- **Versioning:** every result stores the rate-card version, benchmark snapshot date and data version.
- **Units:** ₹ (paise integer storage), kg (3 dp), months as `YYYY-MM`.

## 8. Optimisation engine
- **Allocation (MVP):** binary assignment `x[shg, ac]`.
  - **Objective:** minimise Σ landed inbound cost + λ × transition penalty.
  - **Constraints:**
    - one AC per SHG;
    - Σ kg per AC ≤ capacity;
    - product–AC compatibility (e.g., food-safe storage);
    - Σ secure markup per AC ≥ opex floor (when opex known);
    - re-links ≤ k per quarter;
    - tie → keep current.
  - **Solver:** OR-Tools CP-SAT or PuLP/CBC. At 20–2,000 SHGs this solves in seconds.
  - **Output:** a constraint report showing which constraints bind.
- **Channel choice:** a rules engine (Dossier §9.2), not an optimiser, because demand limits are external. Bulk volume is capped by validated commitments.
- **Intervention ranking:** a transparent scoring formula (₹ impact × women affected × feasibility weight), with weights configurable by leadership and shown on screen.

## 9. AI copilot architecture
```
User (EN/HI) ─► Orchestrator LLM (Claude via API)
                 │  system prompt: role, guardrails, glossary (bands, secure markup, earners vs trained)
                 │  tools (function calling):
                 │    query_view(view, filters)        → read-only SQL on semantic views (row limits)
                 │    price_build(sku, ac, channel)    → calc engine
                 │    run_scenario(params)             → calc engine
                 │    optimise_allocation(constraints) → optimiser
                 │    explain_metric(name)             → metric dictionary
                 │    list_data_gaps(scope)            → data-quality service
                 ▼
             Answer composer: inserts only tool-returned numbers; tags [FACT]/[CALC]/[ASSUMPTION]/[RECOMMENDATION];
             adds source chips; refuses if required inputs are missing.
```
**Guardrails**
- a **numeric-provenance check**: every number in the final text must match a tool output, or the answer is regenerated or blocked;
- no write actions from the copilot in the MVP;
- PII never sent to the model, only pseudonymous codes;
- prompt-injection hardening, since free text in records is treated as data;
- every Q&A logged for evaluation.

**Evaluation set:** 50 golden questions (including the six above) with expected tool calls and numbers; regression-tested on every release.

## 10. Permissions (RBAC)
| Role | Read | Write | Approve |
|---|---|---|---|
| State leadership | All | Comments | Re-links, channel switches, price compacts, grants |
| GDi analyst | All (pseudonymised members) | Benchmarks, rate cards (draft), scenarios | – |
| AC manager | Own AC + linked SHGs | Orders, consignments, opex, capacity | – |
| DMM | Own district | Inclusion cohorts, SHG price updates (maker) | SHG price (checker) |
| CLF / SHG book-keeper | Own SHG | Member payouts, participation, training | – |
| Partner / auditor | Agreed reports | – | – |

## 11. Security, privacy and data quality
- **Regulatory timeline:** DPDP Rules were notified in Nov 2025 with 18-month phasing. **Core duties (notice, consent, security safeguards, breach notification, retention) apply from 13 May 2027**, before the Oct 2027 go-live [EXT-S42]. This section is a design requirement **subject to legal review**, including how the Act applies to a state-mission data controller.
- **Privacy:** the analytics schema holds a pseudonymous member code only. Names and phone numbers sit in a separate encrypted identity store with restricted access. Aadhaar and bank numbers are never stored. The design follows the *Digital Personal Data Protection Act, 2023* and its rules: purpose limitation, consent notices in Hindi, data-principal rights workflow, retention schedule, breach procedure. *Legal review required.*
- **Security:**
  - SSO/OTP login and MFA for state and GDi roles;
  - TLS in transit and encryption at rest;
  - row-level security by AC and district;
  - audit log on every write;
  - quarterly access review;
  - hosting in India (state data centre or MeitY-empanelled cloud) [confirm with UPSRLM IT].
- **Data-quality rules (blocking or warning):**
  - active ≤ members;
  - weight > 0;
  - SHG profit < SHG price;
  - distance present for both ACs;
  - band-edge warning;
  - benchmark ≤ 120 days old;
  - Σ member payouts = SHG payout ± 1%;
  - duplicate order IDs;
  - outlier SP (more than 3σ from history);
  - opex month missing.
- **Data-quality score** per AC and per month is shown on the Command Centre.

## 12. Deployment requirements (practical)
- **MVP stack (fast for Claude Code):** Python (FastAPI) calc and optimiser service + PostgreSQL + a React/Next.js front end (or Streamlit for a 4-week MVP), Docker, GitHub Actions CI running the golden tests.
- **Offline mobile forms:** a PWA with a sync queue for SHG book-keepers. LokOS integration later, via an official API or CSV export, subject to MoRD approval.
- **Imports:** marketplace CSV templates (Amazon, Flipkart, Meesho, ONDC seller app, eSARAS, Prerna Mart).
- **Environments:** dev / staging / prod; nightly backups; a 99.5% uptime target during business hours.
- **Training and support:** Hindi video guides per persona; a 2-day AC onboarding; a helpdesk WhatsApp line [HYPOTHESIS: preferred channel].

## 13. MVP scope (target: 6 weeks build + 4 weeks pilot)
**MVP = prove the operating-model decision flow:** *Where should each SHG ship → how should each SKU sell → which demand is actually committed → is each AC viable → who earns?*

**In:**
1. **Landed-cost & allocation** (Module 2 core: FR-2.1–2.5). Band-aware SHG→AC cost, optimiser with capacity and tie rule, savings view, versioned rate card.
2. **Price build & channel rule** (Module 3 core: FR-3.1–3.5).
3. **Scenario simulator** (Module 4 core: FR-4.1–4.5), including S6 box economics and the S5b pass-through grid.
4. **Buyer & Commitments** (Module 7: FR-7.1–7.4). Committed volume overrides assumed volume in scenarios.
5. **Command Centre lite** (FR-1.1, 1.2, 1.4, 1.6): KPI header, AC comparison, alerts.
6. **Inclusion basics** (FR-5.1, 5.3, 5.4, 5.7): SHG-level participation, archetype quadrant, training → earning funnel; member-payout form for 2 pilot SHGs.
7. Calc library with **golden tests** (§7); CSV import for orders, opex and commitments; 3 roles (state/GDi, AC manager, DMM); English UI with Hindi labels on data-entry forms.

**Out (Release 2+):**
- AI copilot (FR-6.x; build it once pilot users show which questions they actually ask);
- full bilingual UI;
- LokOS integration;
- Impact Passport generator;
- route planner;
- Monte-Carlo;
- price-test tracker;
- partner portal.

**MVP success metrics:**
- reproduces every number in `02_Quantitative_Findings_Register.md` exactly;
- the monthly review pack is produced in under 30 minutes;
- both AC managers enter opex for 2 consecutive months;
- **at least 3 buyer commitments logged and capacity-checked during the pilot**;
- every re-link or channel decision in the pilot is recorded with the scenario it was based on.

## 14. Future roadmap
| Release | Window | Scope |
|---|---|---|
| R1 (MVP) | Q1 2027 | As §13; supports Phase 1 pilots and the Prerna 365 pitch |
| R2 | Q2 2027 | **Grounded copilot** (Module 6) scoped from pilot questions; Impact Passport; member-level ledger at scale; alerts by SMS/WhatsApp; 3PL rate-card comparison; DPDP compliance pack before 13 May 2027 |
| R3 | Q3 2027 | Shadow P&L for the Oct-2027 dress rehearsal; marketplace API pulls; benchmark scraping with human verification |
| R4 | 2028 | LokOS/DAR integration; multi-AC (new hub test); price-test tracker; demand forecasting per SKU and channel; other SRLMs as tenants |

## 15. Open questions
1. Does UPSRLM allow hosting outside the state data centre?
2. Which marketplace data can be exported, and how often?
3. Is LokOS data-sharing possible for Prerna SHGs (MoU)?
4. Who owns benchmark collection after GDi exits?
5. Will ACs register for GST? This changes the P&L presentation.
