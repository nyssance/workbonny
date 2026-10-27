import { AgentRequests, Agents, type Agent, type PendingRequest } from "@alwith/api/agent"
import { createSession, SessionStore, type Session, type Turn, type TurnEntry } from "@alwith/api/session"
import { homeDir } from "@tauri-apps/api/path"
import { useEffect, useRef, useState } from "react"

import { CODEX_AGENT_ID, runtimePort } from "./runtime"

type ContentBlock = { type: string; text?: string }

function textOf(content: ContentBlock[]): string {
  return content.map((block) => (block.type === "text" ? (block.text ?? "") : `[${block.type}]`)).join("")
}

function Entry({ entry }: { entry: TurnEntry }) {
  if (entry.kind === "assistant" || entry.kind === "thought" || entry.kind === "user") {
    return <div className={`entry ${entry.kind}`}>{textOf(entry.content as ContentBlock[])}</div>
  }
  if (entry.kind === "tool") {
    return (
      <div className="entry tool">
        {entry.status ?? "pending"} · {entry.title ?? entry.name ?? "tool"}
        {entry.children.length > 0 && entry.children.map((child) => <Entry key={child.id} entry={child} />)}
      </div>
    )
  }
  if (entry.kind === "plan") {
    const items = (entry.plan as { entries?: Array<{ content: string; status: string }> }).entries ?? []
    return <div className="entry tool">plan: {items.map((item) => `${item.status} ${item.content}`).join(" / ")}</div>
  }
  if (entry.kind === "compaction") return <div className="entry tool">compaction: {entry.status}</div>
  return null
}

// One Runtime connection per webview, shared across React StrictMode re-runs and HMR reloads.
// The Runtime keeps the Codex agent alive across webview reloads, so an existing agent is adopted.
let connecting: Promise<{ agent: Agent; cwd: string }> | null = null
function connect() {
  connecting ??= (async () => {
    const port = runtimePort()
    const agents = new Agents(port, { info: { name: "workbonny", version: "0.1.0" } })
    const cwd = await homeDir()
    const running = (await port.agents()).some((entry) => entry.agentId === CODEX_AGENT_ID)
    const agent = running
      ? await agents.adopt(CODEX_AGENT_ID, "codex")
      : await agents.start(CODEX_AGENT_ID, { engine: "codex", cwd })
    agents.onExit(() => {
      connecting = null
    })
    return { agent, cwd }
  })().catch((error) => {
    connecting = null
    throw error
  })
  return connecting
}

export function App() {
  const [status, setStatus] = useState("connecting")
  const [error, setError] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [draft, setDraft] = useState("")
  const [busy, setBusy] = useState(false)
  const agentRef = useRef<Agent | null>(null)
  const sessionRef = useRef<string | null>(null)
  const storeRef = useRef(new SessionStore())
  const requestsRef = useRef<AgentRequests | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        setStatus("starting codex")
        const { agent, cwd } = await connect()
        if (cancelled) return
        agentRef.current = agent
        const requests = new AgentRequests((id, result, err) => void agent.respond(id, result, err))
        requestsRef.current = requests
        requests.onChange((list) => setPending([...list]))
        agent.onAgentRequest((request) => requests.receive(request))
        const store = storeRef.current
        agent.onNotification((method, params) => {
          requests.onNotification(method, params)
          if (method !== "session/update") return
          const { sessionId, update } = params as { sessionId: string; update: never }
          if (sessionId !== sessionRef.current) return
          store.accept(sessionId, update)
          setTurns(store.turns(sessionId))
        })
        agent.onGone(() => {
          setStatus("agent exited")
          agentRef.current = null
        })
        setStatus("creating session")
        const created = (await agent.request("session/new", { cwd, mcpServers: [] })) as { sessionId: string }
        if (cancelled) return
        sessionRef.current = created.sessionId
        store.set(createSession(created.sessionId, cwd))
        setStatus(`ready · ${created.sessionId.slice(0, 8)} · ${cwd}`)
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : String(caught))
        setStatus("failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function send() {
    const agent = agentRef.current
    const sessionId = sessionRef.current
    const text = draft.trim()
    if (!agent || !sessionId || !text || busy) return
    setDraft("")
    setBusy(true)
    const store = storeRef.current
    const prompt = [{ type: "text", text }]
    const localId = store.addPrompt(sessionId, prompt as never)
    setTurns(store.turns(sessionId))
    try {
      const response = (await agent.request("session/prompt", { sessionId, prompt } as never)) as { messageId?: string }
      if (response.messageId) store.acknowledgePrompt(sessionId, localId, response.messageId)
      setTurns(store.turns(sessionId))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  function answer(request: PendingRequest, allow: boolean) {
    const requests = requestsRef.current
    if (!requests) return
    if (request.kind === "permission") {
      const options = request.params.options as Array<{ optionId: string; kind: string }>
      const choice = options.find((option) => (allow ? option.kind.startsWith("allow") : option.kind.startsWith("reject")))
      if (choice) requests.answerPermission(request.toolCallId ?? "", { outcome: "selected", optionId: choice.optionId })
      else requests.answer(request.key, { outcome: { outcome: "cancelled" } })
    } else {
      requests.answer(request.key, { action: allow ? "accept" : "decline", content: {} })
    }
  }

  return (
    <div className="app">
      <div className="bar">
        <strong>Workbonny</strong>
        <span>{status}</span>
        {busy && <span>…</span>}
        {error && <span className="err">{error}</span>}
      </div>
      <div className="log">
        {turns.map((turn, index) => (
          <div className="turn" key={turn.prompt?.id ?? index}>
            {turn.prompt && <div className="prompt">{textOf(turn.prompt.content as ContentBlock[])}</div>}
            {turn.entries.map((entry) => (
              <Entry key={entry.id} entry={entry} />
            ))}
          </div>
        ))}
        {pending.map((request) => (
          <div className="permission" key={request.key}>
            <span>
              {request.kind === "permission"
                ? `Allow: ${request.params.title}`
                : `Question: ${(request.params as { message?: string }).message ?? ""}`}
            </span>
            <button onClick={() => answer(request, true)}>Allow</button>
            <button onClick={() => answer(request, false)}>Reject</button>
          </div>
        ))}
      </div>
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault()
          void send()
        }}
      >
        <textarea
          rows={2}
          value={draft}
          placeholder="Ask Codex…"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              void send()
            }
          }}
        />
        <button type="submit" disabled={busy}>
          Send
        </button>
      </form>
    </div>
  )
}
