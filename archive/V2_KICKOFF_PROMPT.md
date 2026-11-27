Paste this into Claude Code, opened in the `yawningwhaleAI/PRERNA` repo, after copying this pack's `context_v2/` folder and `PRERNA360_V2_BRIEF.md` into the repo root.

---

You're continuing work on Prerna 360 (live at https://prerna360.vercel.app/start). The final GDi Partners case submission now recommends a different plan from the one the app shows. Your job is to bring the app in line with it.

1. Read, in this order: `HANDOFF.md`, `CLAUDE.md`, `PROGRESS.md`, `PRERNA360_V2_BRIEF.md`, `context_v2/golden_v2.json`. Skim `context_v2/final_deck.pdf` to see the story the app must support.
2. Create the branch `claude/v2-hybrid` from `claude/sleepy-cannon-ebzzjh`.
3. Do **P0 only** (sections P0-1 to P0-7 of the brief), in this order:
   - engine plan `SH` with multi-pack pricing and the commitment gate;
   - `tests/golden_v2.test.ts`;
   - demand-scenarios panel;
   - Overview and Start messaging;
   - server-rendered `/start`;
   - GDi Partners branding;
   - hide headroom price-rise;
   - e2e updates.
4. Rules:
   - Every number comes from the engine.
   - Never edit `context/prerna_dataset.xlsx`.
   - Existing golden, parity and e2e tests must stay green.
   - Never show the phone number or email from the workbooks.
   - No invented buyers or costs.
5. After P0:
   - run `npm test`, `npm run parity`, `npm run lint`, `npm run typecheck`, `npm run build` and `npm run e2e`;
   - check the app at 390, 1024 and 1440 px;
   - deploy a **Vercel preview** (not production);
   - update `PROGRESS.md` and `HANDOFF.md`;
   - send me the preview URL and a short list of what changed.
6. **Do not merge to `main` or promote to production** until I say so. The deck's QR code points at production.

If anything in the brief conflicts with the golden values or the existing tests, stop and ask me rather than guessing.
