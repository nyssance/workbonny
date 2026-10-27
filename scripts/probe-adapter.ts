#!/usr/bin/env bun
// Diagnostic: drive the staged Codex ACP adapter directly over stdio, outside the app and Runtime.
// Usage: bun scripts/probe-adapter.ts "<prompt>" [seconds]
import { spawn } from "node:child_process"
import { createInterface } from "node:readline"
import { join, resolve } from "node:path"

const root = resolve(import.meta.dirname, "..")
const triple = "aarch64-apple-darwin"
const bun = join(root, `src-tauri/binaries/bun-${triple}`)
const adapter = join(root, "src-tauri/resources/adapter/codex-acp-v2.mjs")
const codex = process.env.PROBE_CODEX ?? join(root, `src-tauri/binaries/codex-${triple}`)
const prompt = process.argv[2] ?? "Reply with exactly one word: pong"
const seconds = Number(process.argv[3] ?? 45)

const child = spawn(bun, ["--no-install", adapter], { env: { ...process.env, CODEX_PATH: codex }, stdio: ["pipe", "pipe", "pipe"] })
child.stderr.on("data", (chunk) => process.stderr.write(`[stderr] ${chunk}`))
const started = Date.now()
const stamp = () => `${((Date.now() - started) / 1000).toFixed(1)}s`
let nextId = 1
function send(method: string, params: unknown, id?: number) {
  const line = JSON.stringify(id === undefined ? { jsonrpc: "2.0", method, params } : { jsonrpc: "2.0", id, method, params })
  child.stdin.write(line + "\n")
  console.log(`${stamp()} -> ${method}${id === undefined ? "" : ` #${id}`}`)
}
let sessionId: string | null = null
createInterface({ input: child.stdout }).on("line", (line) => {
  let message: Record<string, unknown>
  try { message = JSON.parse(line) } catch { console.log(`${stamp()} <- (raw) ${line.slice(0, 200)}`); return }
  if (message.id !== undefined && message.method === undefined) {
    const result = message.result as Record<string, unknown> | undefined
    console.log(`${stamp()} <- response #${message.id} ${message.error ? "ERROR " + JSON.stringify(message.error).slice(0, 300) : JSON.stringify(result).slice(0, 200)}`)
    if (message.id === 2 && result?.sessionId) {
      sessionId = result.sessionId as string
      send("session/prompt", { sessionId, prompt: [{ type: "text", text: prompt }] }, ++nextId)
    }
    return
  }
  if (message.method === "session/update") {
    const update = (message.params as { update: Record<string, unknown> }).update
    const kind = update.sessionUpdate as string
    const text = (update.content as { text?: string } | undefined)?.text ?? (update.title as string | undefined) ?? ""
    console.log(`${stamp()} <- update ${kind} ${String(text).replace(/\n/g, " ").slice(0, 120)}`)
    return
  }
  if (message.id !== undefined) {
    console.log(`${stamp()} <- AGENT REQUEST #${message.id} ${message.method} ${JSON.stringify(message.params).slice(0, 300)}`)
    return
  }
  console.log(`${stamp()} <- notification ${message.method}`)
})
send("initialize", { protocolVersion: 2, capabilities: {}, info: { name: "probe", version: "0" } }, nextId)
setTimeout(() => send("session/new", { cwd: process.env.HOME, mcpServers: [] }, ++nextId), 1500)
setTimeout(() => { console.log(`${stamp()} timeout, killing`); child.kill() }, seconds * 1000)
