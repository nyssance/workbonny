#!/usr/bin/env bun
import { mkdtemp, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

// Validate the actual generator against this customer's brand. Never overwrite this checkout.
const cli = process.argv[2];
if (!cli) throw new Error("Usage: bun scripts/check-create.ts /path/to/create-alwith/src/cli.ts");
const root = resolve(import.meta.dirname, "..");
const output = join(await mkdtemp(join(tmpdir(), "workbonny-create-")), "app");
async function run(cwd: string, args: string[]) {
  const child = Bun.spawn(args, {cwd, stdout: "inherit", stderr: "inherit", env: {...process.env, CARGO_NET_RETRY: "0"}});
  const code = await child.exited;
  if (code !== 0) throw new Error(`Failed (${code}): ${args.join(" ")}\nGenerated application retained: ${output}`);
}
await run(root, [process.execPath, resolve(cli), output, "--config", join(root, "alwith.app.json"), "--yes", "--json"]);
const expected = JSON.parse(await readFile(join(root, "alwith.app.json"), "utf8"));
const actual = JSON.parse(await readFile(join(output, "alwith.app.json"), "utf8"));
for (const key of Object.keys(expected).filter(key => key !== "$schema" && key !== "template")) {
  if (JSON.stringify(expected[key]) !== JSON.stringify(actual[key])) throw new Error(`Brand drift: ${key}`);
}
await run(output, [process.execPath, "install", "--frozen-lockfile"]);
await run(output, [process.execPath, "run", "app-config"]);
await run(output, [process.execPath, "run", "check"]);
await run(output, [process.execPath, "run", "check:independence"]);
await run(output, [process.execPath, "run", "stage"]);
await run(output, [process.execPath, "tauri", "build", "--bundles", "app", "--", "--locked"]);
const target = process.env.CARGO_TARGET_DIR ? resolve(output, process.env.CARGO_TARGET_DIR) : join(output, "src-tauri/target");
console.log(`PASS: generated brand, frozen public dependencies and native application\n${target}/release/bundle/macos/${actual.productName}.app`);
console.log("The application was built, not launched. Account and model interactions require a separate explicit live acceptance run.");
