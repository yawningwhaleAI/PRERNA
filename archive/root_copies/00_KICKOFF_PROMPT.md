# Paste this into Claude Code as your first message
(Open Claude Code in an empty folder that contains this whole pack: `CLAUDE.md`, `BUILD_PLAN.md`, `context/`.)

---

You're building **Prerna 360**, a decision-support web app for UPSRLM (Uttar Pradesh State Rural Livelihoods Mission) and GDi. It helps them run two Aggregation Centres (Bijnor and Lucknow) that collect products from women's Self-Help Groups (SHGs) and sell them online or in bulk under the Prerna brand.

**Context you have in this folder**
- `CLAUDE.md`: project rules, exact business formulas, levers, tech stack, style. **Read it fully first and follow it on every step.**
- `BUILD_PLAN.md`: milestones M0–M7 with acceptance criteria and golden test values.
- `context/prerna_dataset.xlsx`: the case dataset (20 SHGs). **Source of truth; never modify it.**
- `context/prerna_model.py` + `context/reference_outputs/`: the reference Python model and its outputs. The engine must match them.
- `context/prerna_calculations.xlsx`: the formula-driven Excel model (same numbers). Use its sheets as the spec for screens: Scenarios, Corporate Boxes, AC P&L, Social Impact.
- `context/PRD.md`: product requirements. The MVP scope is §13; Module 7 (Buyers & Commitments) is in the MVP; the AI copilot is Release 2.
- `context/research_dossier.md`, `findings_register.md`, `assumptions_register.md`: why each rule exists. Read them when a rule is unclear.

**What I want from you now**
1. Read `CLAUDE.md`, `BUILD_PLAN.md` and `context/PRD.md` (§1–§8, §13). Skim the Excel sheet names and `prerna_model.py`.
2. Reply with:
   - a short summary of the product in your own words;
   - the folder structure you will create;
   - any contradictions or ambiguities you found between the files (do not guess; ask);
   - the plan for **M0 and M1 only**.
3. After I approve, build **M0 → M1 → M2** in that order. M2 (engine + golden tests + parity) is the most important milestone: do not start any UI beyond the shell until every golden test passes.
4. After each milestone: run `npm test`, update `PROGRESS.md`, and stop for my review.

**Ground rules**
- Every number in the UI comes from the engine or the DB. No hardcoded figures, no LLM-generated numbers.
- AC costs, buyer demand and packaging quotes are not in the case data. Show them as empty "to collect" inputs, never invented defaults.
- Store members by pseudonymous code only.
- Use the GDi palette (navy `#204B75`, orange `#CB3500`) and keep the UI clean and consultant-style.
- If a test fails against the reference outputs, fix the engine. Never edit the expected values.
