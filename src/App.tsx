import { AgentRequests, Agents, type Agent, type PendingRequest } from "@alwith/api/agent"
import { createSession, SessionStore, type Turn } from "@alwith/api/session"
import { ActivityHostProvider, type ActivityHost } from "@alwith/module-chat/activity-host"
import { CodexActivityGroup } from "@alwith/module-chat/activity"
import { CodexAssistantMessage, CodexAssistantTurn } from "@alwith/module-chat/assistant-message"
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit } from "@alwith/module-chat/composer"
import { PromptInputTextarea } from "@alwith/module-chat/composer-textarea"
import { CodexMarkdownRenderer } from "@alwith/module-chat/markdown"
import { PermissionView } from "@alwith/module-chat/permission-view"
import { CodexUserMessage } from "@alwith/module-chat/user-message"
import { groupBlocksForStyle, type CodexActivityGroupEntry } from "@alwith/module-chat/group-blocks"
import type { ContentBlock } from "@alwith/module-chat/types"
import { homeDir } from "@tauri-apps/api/path"
import { openUrl } from "@tauri-apps/plugin-opener"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { assistantMessage, plainText } from "./chat/projection"
import { TurnBoundary } from "./chat/turn-boundary"
import { CODEX_AGENT_ID, runtimePort } from "./runtime"
import app from "../alwith.app.json"

// One Runtime connection per webview, shared across React StrictMode re-runs and HMR reloads.
let connecting: Promise<{ agent: Agent; cwd: string }> | null = null
function connect() {
  connecting ??= (async () => {
    const port = runtimePort()
    const agents = new Agents(port, { info: { name: app.name, version: app.version } })
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

function useTheme(): "dark" | "light" {
  const [theme, setTheme] = useState<"dark" | "light">(() =>
    matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  )
  useEffect(() => {
    const query = matchMedia("(prefers-color-scheme: dark)")
    const update = () => setTheme(query.matches ? "dark" : "light")
    query.addEventListener("change", update)
    return () => query.removeEventListener("change", update)
  }, [])
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])
  return theme
}

if (typeof window !== "undefined") {
  window.addEventListener("error", (event) => console.error("[window error]", event.message, event.error?.stack))
  window.addEventListener("unhandledrejection", (event) =>
    console.error("[unhandled rejection]", (event.reason as Error)?.message, (event.reason as Error)?.stack)
  )
}

export function App() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const [status, setStatus] = useState<"connecting" | "ready" | "failed" | "exited">("connecting")
  const [error, setError] = useState<string | null>(null)
  const [turns, setTurns] = useState<Turn[]>([])
  const [pending, setPending] = useState<PendingRequest[]>([])
  const [busy, setBusy] = useState(false)
  const agentRef = useRef<Agent | null>(null)
  const sessionRef = useRef<string | null>(null)
  const storeRef = useRef(new SessionStore())
  const requestsRef = useRef<AgentRequests | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const host = useMemo<ActivityHost>(
    () => ({
      t: (key, values) => i18n.t(key, { ns: "alwithChat", ...values }),
      i18n: { language: i18n.language },
      openLink: (url) => void openUrl(url),
      Markdown: ({ text, streaming }) => (
        <CodexMarkdownRenderer text={text} streaming={streaming} host={{ theme, copyLabel: "Copy", openLink: (url) => void openUrl(url) }} />
      )
    }),
    [i18n, theme]
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
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
          setStatus("exited")
          agentRef.current = null
        })
        const created = (await agent.request("session/new", { cwd, mcpServers: [] })) as { sessionId: string }
        if (cancelled) return
        sessionRef.current = created.sessionId
        store.set(createSession(created.sessionId, cwd))
        setStatus("ready")
      } catch (caught) {
        const detail = caught instanceof Error ? `${caught.message} ${JSON.stringify(caught)}` : String(caught)
        console.error("connect failed", caught)
        setError(detail)
        setStatus("failed")
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [turns, pending])

  async function send(text: string) {
    const agent = agentRef.current
    const sessionId = sessionRef.current
    if (!agent || !sessionId || !text.trim() || busy) return
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

  function respond(request: PendingRequest, optionId: string | null) {
    const requests = requestsRef.current
    if (!requests) return
    if (request.kind === "permission") {
      if (optionId) requests.answerPermission(request.toolCallId ?? "", { outcome: "selected", optionId })
      else requests.answer(request.key, { outcome: { outcome: "cancelled" } })
    } else {
      requests.answer(request.key, { action: optionId ? "accept" : "decline", content: {} })
    }
  }

  return (
    <ActivityHostProvider host={host}>
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4" data-tauri-drag-region>
          <span className="font-semibold">{app.productName}</span>
          <span className="text-xs text-muted-foreground">
            {status === "ready" ? t("ready") : status === "connecting" ? t("connecting") : status}
          </span>
          {error && <span className="truncate text-xs text-destructive">{error}</span>}
        </header>
        <main ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6" data-stream-style="codexUI">
            {turns.map((turn, index) => {
              const isLast = index === turns.length - 1
              const message = assistantMessage(turn, index, busy && isLast)
              const activity = groupBlocksForStyle(message.content, "codexUI").filter(
                (entry): entry is CodexActivityGroupEntry => entry.kind === "codexActivityGroup"
              )
              const answer = { ...message, content: message.content.filter((block: ContentBlock) => block.type === "text") }
              return (
                <TurnBoundary key={message.id} label={message.id}>
                <div className="flex flex-col gap-4">
                  {turn.prompt && (
                    <CodexUserMessage
                      host={host}
                      message={{ id: turn.prompt.id }}
                      text={plainText(turn.prompt.content as never)}
                      mentions={[]}
                      images={[]}
                      messageTime={null}
                    />
                  )}
                  {(activity.length > 0 || answer.content.length > 0) && (
                    <CodexAssistantTurn
                      stateKey={message.id}
                      active={busy && isLast}
                      startedAt={message.startedAt}
                      durationMs={message.durationMs}
                      loading={busy && isLast && message.content.length === 0}
                      work={activity.map((group, i) => <CodexActivityGroup key={i} blocks={group.blocks} />)}
                      answer={answer.content.length > 0 ? <CodexAssistantMessage message={answer} isMostRecentTurn={isLast} /> : null}
                    />
                  )}
                </div>
                </TurnBoundary>
              )
            })}
            {pending.map((request) => (
              <PermissionView
                key={request.key}
                requestId={request.key}
                title={request.kind === "permission" ? request.params.title : ((request.params as { message?: string }).message ?? "")}
                options={
                  request.kind === "permission"
                    ? request.params.options.map((option) => ({ optionId: option.optionId, name: option.name, kind: option.kind }))
                    : [
                        { optionId: "accept", name: t("allow"), kind: "allow_once" },
                        { optionId: "decline", name: "Decline", kind: "reject_once" }
                      ]
                }
                onRespond={(optionId) => respond(request, optionId)}
              />
            ))}
          </div>
        </main>
        <footer className="shrink-0 border-t px-4 py-3">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput
              onSubmit={(message) => void send(message.text)}
              onSubmitError={(caught) => setError(caught instanceof Error ? caught.message : String(caught))}
              canSubmit={() => (status === "ready" && !busy ? true : t("connecting"))}
            >
              <PromptInputBody>
                <PromptInputTextarea placeholder={t("placeholder")} />
              </PromptInputBody>
              <PromptInputFooter>
                <PromptInputSubmit status={busy ? "streaming" : "ready"} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </footer>
      </div>
    </ActivityHostProvider>
  )
}
