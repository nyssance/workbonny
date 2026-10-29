#!/usr/bin/env bun
// Diagnostic: the app's exact path minus the webview. Spawns the staged alwith-runtime with the same
// engines table the Rust relay uses, then Agents.start -> session/new -> session/prompt, printing
// every notification and agent request. Usage: bun scripts/probe-runtime.ts "<prompt>" [seconds] --auth-from=/explicit/auth/home
import { Agents, AgentRequests } from "@nyssance/codex-acp-v2/client"
import { startTestRuntime } from "@alwith/api/node"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const triple = "aarch64-apple-darwin"
const prompt = process.argv[2] ?? "Reply with exactly one word: pong"
const seconds = Number(process.argv[3] ?? 60)
const started = Date.now()
const stamp = () => `${((Date.now() - started) / 1000).toFixed(1)}s`
const codexDir = process.env.PROBE_CODEX_DIR ?? join(root, "src-tauri/target/debug")

const authFrom = process.argv.find((arg) => arg.startsWith("--auth-from="))?.slice("--auth-from=".length)
if (!authFrom) throw new Error("Live probes require an explicit --auth-from directory")
await using runtime = await startTestRuntime({
  authFrom,
  binary: join(root, `src-tauri/binaries/alwith-runtime-${triple}`),
  engines: {
    codex: {
      command: join(root, `src-tauri/binaries/bun-${triple}`),
      args: ["--no-install", join(root, "src-tauri/resources/adapter/codex-acp-v2.mjs")],
      env: { CODEX_PATH: join(codexDir, "codex") }
    }
  },
  stderr: "inherit"
})
const port = runtime.client
await port.onAcpAgentRequest((request) => console.log(`${stamp()} <- AGENT REQUEST ${request.method} ${JSON.stringify(request.params).slice(0, 300)}`))
await port.onAcpNotification((n) => {
  if (n.method !== "session/update") { console.log(`${stamp()} <- ${n.method}`); return }
  const update = (n.params as { update: Record<string, unknown> }).update
  const text = (update.content as { text?: string } | undefined)?.text ?? (update.title as string | undefined) ?? ""
  if (update.sessionUpdate === "agent_message_chunk") process.stdout.write(String(text))
  else console.log(`\n${stamp()} <- update ${update.sessionUpdate} ${String(text).slice(0, 100)}`)
})
await port.onStderr((line) => console.log(`${stamp()} [agent stderr] ${line.line.slice(0, 200)}`))
const agents = new Agents(port, { info: { name: "probe-runtime", version: "0" } })
console.log(`${stamp()} starting codex via Runtime`)
const agent = await agents.start("codex", { engine: "codex", cwd: runtime.workspace })
const requests = new AgentRequests((id, result, error) => void agent.respond(id, result, error))
agent.onAgentRequest((request) => { console.log(`${stamp()} <- pending request ${request.method}`); requests.receive(request) })
requests.onChange((pending) => console.log(`${stamp()} pending requests: ${pending.map((p) => p.kind).join(",") || "none"}`))
const created = (await agent.request("session/new", { cwd: runtime.workspace, mcpServers: [] })) as { sessionId: string }
console.log(`${stamp()} session ${created.sessionId}`)
const response = agent.request("session/prompt", { sessionId: created.sessionId, prompt: [{ type: "text", text: prompt }] } as never)
response.then((r) => console.log(`\n${stamp()} prompt done ${JSON.stringify(r).slice(0, 200)}`), (e) => console.log(`\n${stamp()} prompt failed ${e}`))
let timer: ReturnType<typeof setTimeout> | undefined
try {
  await Promise.race([
    response,
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`Probe timed out after ${seconds}s`)), seconds * 1000)
    })
  ])
} finally {
  clearTimeout(timer)
  await port.stop("codex").catch(() => {})
}
