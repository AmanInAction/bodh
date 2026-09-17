import { readdir } from "node:fs/promises";

async function main() {
  const entries = await readdir("content/seed", { withFileTypes: true }).catch(
    () => [],
  );
  console.log(`Found ${entries.length} seed topic folders.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
