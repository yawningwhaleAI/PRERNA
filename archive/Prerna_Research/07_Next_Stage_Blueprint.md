# Next-stage blueprint: submission deck and Excel workbook
This file is the bridge to Stage 2. It maps the research onto GDi's submission rules and assessment parameters.

## 1. Submission constraint check
- The case PDF asks for a deck of **"less than 10 slides"**. The submission note says **"maximum 10 slides, including the title slide"**.
- → **Build 9 slides.** That satisfies both. Use a backup appendix only if allowed.
- Excel is submitted **separately** and must contain all calculations, assumptions, product-level pricing and financial analysis, formula-driven.

## 2. Nine-slide storyline (each slide: one headline, one number, one visual)
| # | Slide headline (action title) | Core evidence (Register 2) | Visual | Assessment parameter served |
|---|---|---|---|---|
| 1 | **Title:** Prerna ACs: right hub, right channel, every didi earning | – | Clean title + candidate details | Communication |
| 2 | Exec summary: half the portfolio fails cost-reflective pricing; two fixes recover all 20 products without touching women's pay | F1, F2, F4, F11, F12 | 3 numbers + 4 recommendations | Strategic thinking |
| 3 | From Oct 2027, 10 of 20 products sit above market; 43% of AC markup and 42% of women's income are at risk | F1–F5 | Gap bar chart (SP − market) by SKU, coloured by AC | Strategic thinking |
| 4 | Two root causes: legacy Bijnor links (distance) and courier economics (value density × channel) | F5, F6, F9, F10 | 2×2: value density vs band; or waterfall for atta | Strategic thinking |
| 5 | Re-link 7 SHGs on *tariff bands*, not km: ₹42,400 a month saved, proximity ≠ savings (Jhansi) | F6–F8, F14, F15, F19 | Map-style table of 20 SHGs, from→to; savings bar | Feasibility · Innovation |
| 6 | Right channel: staples to Prerna stores (~4 units/store/month), premium/GI online, hampers | F9–F12, F20, F28, F31 | Channel decision tree + before/after competitiveness 10→15→20 | Innovation · Feasibility |
| 7 | Both ACs gain *secure* revenue, but viability depends on opex we must collect now | F13, F16, F17, F18, F29, F30 | AC table S0 vs S3 + break-even yardstick + data-ask list | Feasibility (financial) |
| 8 | 40% of members earn nothing; pay and participation trade off (r = −0.74) | F22–F27 | Quadrant: participation × income per earner; Gini | Social impact |
| 9 | Roadmap to Oct 2027 + KPIs + governance (pilot-first; Prerna 360 as operating system) | R1–R16, KPI table | Gantt (5 phases) + 6 KPIs + RACI strip | Feasibility · Communication |

**Rules for writing slides:**
- every headline carries a number;
- tag assumptions on-slide with a small "A" marker that links to the Excel Assumptions tab;
- trade-offs are shown explicitly (Bijnor gross vs secure markup; inclusion dilution).

## 3. Excel workbook map (formula-driven; build with the xlsx skill)
| Tab | Contents | Key formulas / checks |
|---|---|---|
| 0_Cover | Candidate details, navigation, colour legend (inputs blue, formulas black, assumptions orange) | – |
| 1_Inputs | SHG Data copied **verbatim** from the case (locked) | – |
| 2_RateCards | Inbound bands, online, bulk, markup as named ranges | `=LOOKUP` band table; rate-inflation multiplier cells |
| 3_Assumptions | A1–A15 with toggle cells (band-edge rule, hamper units per parcel, headroom target, payment days) | Data validation lists |
| 4_PriceBuild_S0 | Per SHG: inbound, markup, outbound (CEILING), SP, market, gap, headroom %, competitive flag | Golden check: honey = 285 |
| 5_Allocation | Inbound at Bijnor and Lucknow, cheapest AC, tie flag, saving per unit and per month, proposed AC | Σ saving = 42,400 |
| 6_Channel | Online vs bulk SP at the proposed AC; max markup %; decision rule output | – |
| 7_Scenarios | S0–S5 selector (CHOOSE/INDEX); volume, rate and markup sliders | Competitive count: 10/15/19/20 |
| 8_AC_PnL | Per AC: gross and secure markup, logistics outlay, variable/fixed opex placeholders (blank = "to collect"), contribution, break-even, staff-equivalent yardstick | Opex blanks highlighted |
| 9_WorkingCapital | Payouts + logistics × days | 15/30/45-day table |
| 10_Social | Members, earners, participation, income per earner, woman-level vector, median, Gini, top-20% share, inclusion volume test | Gini (all) = 0.6565 |
| 11_KPIs | KPI framework with baseline formulas and targets | – |
| 12_Options | Weighted evaluation with editable weights | A 3.50, B 4.05, C 3.00 |
| 13_Sources | Source register (IDs match the deck footnotes) | – |
| 14_Checks | Reconciliation: totals vs Python engine outputs (`analysis/outputs/*.csv`) | All TRUE |

## 4. Hand-off checklist for Stage 2
- [ ] Re-run `analysis/prerna_model.py` and confirm the totals before building.
- [ ] Every slide number has a matching Excel cell reference.
- [ ] Assumptions are visible on-slide wherever used (A2 band edge, A6 bulk demand, A10 headroom).
- [ ] No invented opex, demand or competitor prices. Benchmarks are the case's.
- [ ] No SHG dropped; no SHG price cut; Bijnor's trade-off shown honestly.
