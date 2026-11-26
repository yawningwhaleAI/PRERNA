/**
 * `npm run seed`: loads the case dataset into the app's data store
 * (src/data/case-data.json). Idempotent: the same input always writes the same file.
 */
import { writeFileSync } from "node:fs";
import { readCaseData, DATASET_SHA256 } from "./case-reader";

async function main() {
  const data = await readCaseData();
  if (DATASET_SHA256 && data.source.datasetSha256 !== DATASET_SHA256) {
    throw new Error("context/prerna_dataset.xlsx has changed. The case dataset must never be edited.");
  }
  const districts = new Set(data.shgs.map((s) => s.district));
  writeFileSync("src/data/case-data.json", JSON.stringify(data, null, 2) + "\n");
  console.log(
    `Seeded ${data.shgs.length} SHGs, ${data.shgs.reduce((a, s) => a + s.members, 0)} members, ` +
      `${districts.size} districts, 2 ACs, rate card v${data.rateCard.version}, ${data.attributes.length} attribute rows.`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
