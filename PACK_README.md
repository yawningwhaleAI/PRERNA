# Prerna 360: Claude Code build pack

## How to use
1. Unzip this folder somewhere on your laptop, e.g. `~/projects/prerna360`.
2. Open a terminal in that folder and run `claude` (Claude Code). Node 18+ is needed for the app.
3. Paste the contents of **`00_KICKOFF_PROMPT.md`** as your first message.
4. Review Claude Code's plan, approve, and let it build milestone by milestone (`BUILD_PLAN.md`). Check `PROGRESS.md` after each stop.

## What's inside
| File | Purpose |
|---|---|
| `00_KICKOFF_PROMPT.md` | First message to paste into Claude Code |
| `CLAUDE.md` | Project memory Claude Code reads automatically: rules, formulas, levers, stack, style |
| `BUILD_PLAN.md` | Milestones M0–M7 with acceptance criteria and golden test values |
| `context/prerna_dataset.xlsx` | Case dataset (unmodified), the source of truth |
| `context/prerna_calculations.xlsx` | Final formula-driven Excel (same as the submission), used as the screen spec |
| `context/prerna_model.py` | Reference Python model (oracle) |
| `context/reference_outputs/` | Model outputs used for parity tests |
| `context/PRD.md` | Product requirements (v0.9.1, lean MVP) |
| `context/research_dossier.md`, `findings_register.md`, `assumptions_register.md` | Reasoning behind every rule |

## Tips
- Keep sessions focused on one milestone. If the context gets long, start a new Claude Code session; `CLAUDE.md` and `PROGRESS.md` carry the state.
- Don't let it skip M2. Once the engine matches the Excel exactly, every screen built on it can be trusted.
- For the demo: Command Centre (S0 → S3 shows 10 → 20 competitive), the Allocation what-if, then the box builder blocking a mixed-AC box. That sequence tells the whole case story in three minutes.
