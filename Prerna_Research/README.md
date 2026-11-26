# Prerna Aggregation Centres: Research Foundation (Stage 1)
GDi Consultant case study, Round 1 · Prepared 26 Nov 2026

This folder is the **research stage** of the Prerna AC case. The final 9-slide deck, the Excel workbook and the Prerna 360 app are **not built yet**. Everything here is designed so that another analyst, or Claude Code, can build them without redoing the research.

## Headline results (all from `analysis/prerna_model.py`, monthly)
| | Today's links & channels, logistics charged (S0) | Recommended Option B (S3) |
|---|---|---|
| Products competitive | **10 / 20** | **20 / 20** |
| AC markup at risk | ₹93,600 (42.7%) | ₹0 |
| Women's income at risk | ₹75,400 (69 earners) | ₹0 |
| Logistics outlay | ₹4.02 lakh | ₹2.51 lakh (−37.5%) |
| Bijnor / Lucknow secure markup | ₹75,900 / ₹49,800 | ₹83,400 / ₹1,35,900 |

**Social baseline:**
- **127 of 213 members earn (59.6%)**;
- median ₹1,050 per earner;
- Gini 0.66 across all members;
- participation and pay are inversely related (r = −0.74).

## Contents
| File | Deliverable | Use it for |
|---|---|---|
| `01_Research_Dossier.md` | **D1:** comprehensive dossier (17 sections) | The narrative, analysis, options, recommendation and roadmap |
| `02_Quantitative_Findings_Register.md` | **D2:** 32 findings with method, implication, confidence, limits | Every number on a slide traces here |
| `03_Strategic_Recommendations_Matrix.md` | **D3:** 16 recommendations (problem → root cause → intervention → impact → owner → KPI) | The recommendation and roadmap slides |
| `04_Research_and_Assumptions_Register.md` | **D4:** case facts, external facts, assumptions, hypotheses, field-data asks | The Excel Assumptions tab; slide footnotes |
| `05_Prerna360_PRD.md` | **D5:** product requirements (modules, schema, calc and optimisation engines, grounded copilot, RBAC, privacy, MVP) | Building the app in Claude Code |
| `06_Source_Register.md` | **D6:** 40 external sources (plus the 3 case files) with URL, date, finding and use | Sources tab; citations |
| `07_Next_Stage_Blueprint.md` | Bridge: slide-by-slide storyline and Excel tab map | Starting Stage 2 |
| `analysis/prerna_model.py` | Deterministic calculation engine (the case rules in code) | Reproduce or extend any number; seed for the Prerna 360 calc library |
| `analysis/outputs/*.csv, *.json` | Engine outputs: baseline, scenarios S0–S5, AC thresholds, social, third-AC test, working capital, inclusion test | Feed the Excel model; golden test values |
| `data/Prerna Data Set (original, unmodified).xlsx` | The case dataset, untouched | Source of truth |

## How to reproduce
```bash
cd analysis
python3 -I prerna_model.py "../data/Prerna Data Set (original, unmodified).xlsx" outputs
```
Requires Python 3.10+ with pandas and openpyxl.

## How the next stage should use this
1. **Excel workbook:** follow the tab map in `07_Next_Stage_Blueprint.md` §3. Rebuild every number with live formulas. Reconcile against `analysis/outputs/` on the Checks tab.
2. **Deck (9 slides):** follow the storyline in `07` §2. Pull headlines from Register 2 and actions from Register 3. Mark assumptions on-slide.
3. **Prerna 360:** start from PRD §13 (MVP). Port `prerna_model.py` into the calc library and make PRD §7's golden tests pass first.

## Ground rules kept throughout
- Facts are tagged **[CASE] / [EXT] / [CALC] / [ASSUMPTION] / [HYPOTHESIS]**.
- No AC opex, market demand or competitor prices were invented. Gaps are listed in Dossier §10.4 and Register 4 §F.
- No SHG is dropped and no SHG price is cut. The trade-offs, especially Bijnor's, are shown explicitly.
- The submission rules conflict ("less than 10" vs "max 10 incl. title"), so **9 slides** is recommended.
