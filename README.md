# Prerna 360

Decision-support prototype for the Prerna Aggregation Centres (Bijnor and Lucknow), built for UPSRLM and GDi.
It answers, every month: where each SHG should ship, how each product should sell, which demand is committed,
whether each AC is viable, and who earns.

Every number on screen is computed by a pure TypeScript engine (`src/lib/engine/`) from the unmodified case dataset
(`context/prerna_dataset.xlsx`) and the analyst levers. The engine reproduces the reference Python model
(`context/prerna_model.py`) exactly: see `npm run parity`.

## Run
```bash
npm install
npm run dev          # http://localhost:3000
npm test             # unit, golden, parity and seed tests
npm run parity       # engine vs context/reference_outputs
npm run seed         # rebuild src/data/case-data.json from the case dataset
npm run build && npm run e2e   # Playwright smoke tests
```

## Deploy
Vercel, framework preset Next.js, no environment variables needed. All pages are static; user inputs are saved in the browser (prototype).

## Layout
- `src/lib/engine/`: calculation engine (no I/O)
- `src/app/`: screens (App Router)
- `src/data/case-data.json`: seeded case data (generated, checksum-guarded)
- `tests/`: golden, parity, seed and e2e tests
- `context/`: case dataset, reference model and outputs, PRD, research (read-only)
- `CLAUDE.md`, `BUILD_PLAN.md`, `PROGRESS.md`: project rules, plan and status
- `archive/`: earlier research copies
