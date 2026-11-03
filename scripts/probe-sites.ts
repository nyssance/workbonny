#!/usr/bin/env bun
// Run from a consumer with local candidate packages installed. Never uses the real Codex home as test state.
import { startTestRuntime } from "@alwith/api/node"
import { Agents } from "@alwith/module-chat/client"
import { resolve, join } from "node:path"

const option = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
const authFrom = option("auth-from")
if (!authFrom) throw new Error("An explicitly authorized live probe requires --auth-from=<directory>")
const root = resolve(import.meta.dirname, "..")
const triple = process.platform === "darwin" ? `${process.arch === "arm64" ? "aarch64" : "x86_64"}-apple-darwin` : null
if (!triple) throw new Error("Pass this probe through a platform-specific Runtime harness outside macOS")
const adapter = option("adapter") ?? join(root, "src-tauri/resources/adapter/codex-acp-v2.mjs")
const codex = option("codex") ?? join(root, "src-tauri/target/debug/codex")
await using runtime = await startTestRuntime({
  authFrom,
  binary: join(root, `src-tauri/binaries/alwith-runtime-${triple}`),
  engines: { codex: { command: join(root, `src-tauri/binaries/bun-${triple}`), args: ["--no-install", adapter], env: { CODEX_PATH: codex } } },
  stderr: "ignore"
})
const agents = new Agents(runtime.client, { info: { name: "sites-probe", version: "0" } })
let timer: ReturnType<typeof setTimeout> | undefined
try {
  await Promise.race([
    (async () => {
      const agent = await agents.start("sites-probe", { engine: "codex", cwd: runtime.workspace })
      const result = await agent.request("_codex/apps_installed", { forceRefresh: true }) as { apps: { id: string; runtimeName: string | null; enabled: boolean; callable: boolean }[] }
      const sites = result.apps.find((app) => app.id === "connector_20205bf7d4e99a89d7154bb849718324")
      console.log(JSON.stringify({ sites: sites ?? null }))
      if (!sites?.enabled || !sites.callable) throw new Error("Sites is not callable for this account")
      // Actual model/tool invocation is opt-in; this default probe only reads effective availability.
    })(),
    new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Sites probe exceeded 60 seconds")), 60_000) })
  ])
} finally {
  clearTimeout(timer)
  await runtime.client.stop("sites-probe").catch(() => {})
}
