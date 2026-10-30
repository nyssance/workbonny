import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

// Compare against a fresh create output before applying customer customization.
const generated = process.argv[2];
if (!generated) throw new Error("Usage: bun scripts/check-template-baseline.ts <generated-project>");
const root = resolve(import.meta.dirname, "..");
async function files(directory: string, prefix = ""): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map(async entry => {
    const path = join(prefix, entry.name);
    return entry.isDirectory() ? files(join(directory, entry.name), path) : [path];
  }))).flat();
}
const expected = (await files(join(generated, "src"))).sort();
const actual = (await files(join(root, "src"))).sort();
if (JSON.stringify(expected) !== JSON.stringify(actual)) throw new Error("Source file inventory differs from create output");
for (const path of expected) {
  const [left, right] = await Promise.all([
    readFile(join(generated, "src", path)), readFile(join(root, "src", path))
  ]);
  if (!left.equals(right)) throw new Error(`Template presentation drift: src/${path}`);
}
console.log(`PASS: ${expected.length} source files match fresh create output byte-for-byte`);
