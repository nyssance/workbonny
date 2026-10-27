// The app-wide Codex client and its React bindings. Everything about holding the agent, routing
// updates by session, replaying on open, prompting with a receipt and answering permissions lives in
// `@alwith/api/client` and `@nyssance/codex-acp-v2/client`; this file only names the one instance.
import type { Session } from "@alwith/api"
import { CodexClient, type CodexClientState } from "@nyssance/codex-acp-v2/client"
import { useStore } from "zustand"

import app from "../alwith.app.json"
import { CODEX_AGENT_ID, runtimePort } from "./runtime"

export const client = new CodexClient(() => Promise.resolve(runtimePort()), {
  agentId: CODEX_AGENT_ID,
  launch: { engine: "codex" },
  info: { name: app.name, version: app.version }
})

export function useClient<T>(selector: (state: CodexClientState) => T): T {
  return useStore(client.store, selector)
}

export function useSession(id: string | null): Session | null {
  return useStore(client.store, (state) => (id === null ? null : (state.sessions[id] ?? null)))
}

/** Mirrors the Runtime's run states into the client store for the lifetime of the app. */
export async function watchRunStates(): Promise<() => void> {
  const port = runtimePort()
  let revision = 0
  const stop = await port.onRunStates((sessions) => {
    revision++
    client.applyRunStates(sessions)
  })
  const baseline = revision
  const snapshot = await port.runStates()
  if (revision === baseline) client.applyRunStates(snapshot, "snapshot")
  return stop
}
