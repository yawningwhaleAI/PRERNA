/** `npm run parity`: compares engine outputs with context/reference_outputs and prints any mismatch. */
import data from "../src/data/case-data.json";
import { runParity } from "../src/lib/parity";
import type { CaseData } from "../src/lib/engine";

const { checked, mismatches } = runParity(data as CaseData);
if (mismatches.length) {
  console.table(mismatches.slice(0, 50));
  console.error(`Parity FAILED: ${mismatches.length} mismatches out of ${checked} values checked.`);
  process.exit(1);
}
console.log(`Parity OK: ${checked} values match context/reference_outputs (01, 02, 13).`);
