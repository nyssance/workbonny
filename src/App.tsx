import { turns as turnsOf } from "@alwith/api/session"
import { PromptInput, PromptInputBody, PromptInputFooter, PromptInputSubmit } from "@alwith/module-chat/composer"
import { PromptInputTextarea } from "@alwith/module-chat/composer-textarea"
import { CodexMarkdownRenderer } from "@alwith/module-chat/markdown"
import { PermissionView } from "@alwith/module-chat/permission-view"
import { SessionTimeline, type SessionTimelineHost } from "@alwith/module-chat/session-timeline"
import { homeDir } from "@tauri-apps/api/path"
import { openUrl } from "@tauri-apps/plugin-opener"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { client, useClient, useSession, watchRunStates } from "./client"
import { Leading } from "./layout/leading"
import { Navigation } from "./layout/navigation"
import { Shell } from "./layout/shell"

/** The session shown when the webview comes back; the Runtime keeps it alive across reloads. */
const SESSION_KEY = "workbonny.session"

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

async function until(predicate: () => boolean, ms = 60_000): Promise<void> {
  const start = Date.now()
  while (!predicate()) {
    if (Date.now() - start > ms) throw new Error("Timed out")
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
}

// Connect once per webview (StrictMode runs effects twice; the client itself is idempotent): hold
// the agent, list what Codex has, then show the remembered session or start a new one.
let booting: Promise<string> | null = null
function boot(): Promise<string> {
  booting ??= (async () => {
    await client.connect()
    void watchRunStates().catch((error: unknown) => console.warn("run states unavailable", error))
    await client.listSessions().catch((error: unknown) => console.warn("session list unavailable", error))
    const remembered = sessionStorage.getItem(SESSION_KEY)
    const row = remembered ? client.state.sessionList.find((item) => item.sessionId === remembered) : undefined
    if (remembered && (row || client.state.runStates[remembered])) {
      try {
        await client.open(remembered, row?.cwd ?? client.state.runStates[remembered]?.cwd ?? (await homeDir()))
        return remembered
      } catch (error) {
        console.warn("reopening the remembered session failed, starting a new one", error)
      }
    }
    return client.newSession(await homeDir())
  })().catch((error: unknown) => {
    booting = null
    throw error
  })
  return booting
}

export function App() {
  const { t, i18n } = useTranslation()
  const theme = useTheme()
  const connection = useClient((state) => state.connection)
  const connectionError = useClient((state) => state.connectionError)
  const sessionList = useClient((state) => state.sessionList)
  const actions = useClient((state) => state.actions)
  const [selected, setSelected] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const session = useSession(selected)
  const busy = session !== null && session.state !== "idle"
  const pending = useMemo(() => actions.filter((action) => action.sessionId === selected), [actions, selected])
  const scrollRef = useRef<HTMLDivElement>(null)

  const host = useMemo<SessionTimelineHost>(
    () => ({
      t: (key, values) => i18n.t(key, { ns: "alwithChat", ...values }),
      i18n: { language: i18n.language },
      theme,
      openLink: (url) => void openUrl(url),
      Markdown: ({ text, streaming }) => (
        <CodexMarkdownRenderer text={text} streaming={streaming} host={{ theme, copyLabel: "Copy", openLink: (url) => void openUrl(url) }} />
      )
    }),
    [i18n, theme]
  )

  useEffect(() => {
    let cancelled = false
    boot().then(
      (id) => {
        if (cancelled) return
        sessionStorage.setItem(SESSION_KEY, id)
        setSelected(id)
      },
      (caught: unknown) => {
        console.error("connect failed", caught)
        setError(caught instanceof Error ? caught.message : String(caught))
      }
    )
    return () => {
      cancelled = true
    }
  }, [])

  // Dev-only: dump the rendered conversation text once a turn settles, so the terminal shows what
  // the user would see without screen automation.
  useEffect(() => {
    if (!import.meta.env.DEV || busy || session === null || session.items.length === 0) return
    const timer = setTimeout(() => {
      const text = scrollRef.current?.innerText ?? ""
      console.warn("[dom]", JSON.stringify({ session: selected, turns: turnsOf(session).length, text: text.replace(/\s+/g, " ").slice(0, 900) }))
    }, 1200)
    return () => clearTimeout(timer)
  }, [busy, session, selected])

  // Dev-only autopilot: VITE_AUTOPROMPT drives two sessions end to end (prompt A, prompt B, reopen A)
  // and prints what the client holds, so multi-session handling is verified from the terminal.
  const autoSent = useRef(false)
  useEffect(() => {
    const text = import.meta.env.VITE_AUTOPROMPT as string | undefined
    if (!import.meta.env.DEV || !text || connection !== "ready" || selected === null || autoSent.current) return
    autoSent.current = true
    const a = selected
    void (async () => {
      await client.prompt(a, [{ type: "text", text }])
      await until(() => client.session(a).state === "idle")
      const b = await client.newSession(client.session(a).cwd)
      setSelected(b)
      await client.prompt(b, [{ type: "text", text: "只回复一个词：second" }])
      await until(() => client.session(b).state === "idle")
      await client.open(a, client.session(a).cwd)
      setSelected(a)
      console.warn(
        "[sessions]",
        JSON.stringify({
          list: client.state.sessionList.map((item) => ({ id: item.sessionId, title: item.title })),
          a: { turns: turnsOf(client.session(a)).length, state: client.session(a).state, attached: client.session(a).attached },
          b: { turns: turnsOf(client.session(b)).length, state: client.session(b).state, attached: client.session(b).attached },
          selected: a
        })
      )
    })().catch((caught: unknown) => console.error("[autopilot]", caught))
  }, [connection, selected])

  async function send(text: string) {
    if (!selected || !text.trim() || busy) return
    try {
      await client.prompt(selected, [{ type: "text", text }])
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  async function newChat() {
    try {
      const cwd = session?.cwd ?? (await homeDir())
      const id = await client.newSession(cwd)
      sessionStorage.setItem(SESSION_KEY, id)
      setSelected(id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  async function select(id: string) {
    const row = sessionList.find((item) => item.sessionId === id)
    try {
      await client.open(id, row?.cwd ?? session?.cwd ?? (await homeDir()))
      sessionStorage.setItem(SESSION_KEY, id)
      setSelected(id)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    }
  }

  const rows = sessionList.map((item) => ({ id: item.sessionId, title: item.title ?? t("untitled"), active: item.sessionId === selected }))
  if (selected && !rows.some((row) => row.id === selected)) rows.unshift({ id: selected, title: session?.title ?? t("untitled"), active: true })

  return (
    <Shell
      leading={<Leading />}
      navigation={<Navigation sessions={rows} onNew={() => void newChat()} onSelect={(id) => void select(id)} onSettings={() => undefined} />}
    >
      <div className="flex h-full flex-col">
        <header className="flex h-12 shrink-0 items-center gap-3 border-b px-4" data-tauri-drag-region>
          <span className="text-xs text-muted-foreground">
            {connection === "ready" ? t("ready") : connection === "connecting" ? t("connecting") : connection}
          </span>
          {(error ?? connectionError) && <span className="truncate text-xs text-destructive">{error ?? connectionError}</span>}
        </header>
        <main ref={scrollRef} className="flex min-h-0 flex-1 flex-col">
          {session && <SessionTimeline key={session.id} session={session} client={client} host={host} />}
        </main>
        {pending.length > 0 && (
          <div className="mx-auto flex w-full max-w-3xl shrink-0 flex-col gap-2 px-4 pb-2">
            {pending.map((action) => (
              <PermissionView
                key={action.id}
                requestId={action.id}
                title={action.kind === "permission" ? action.params.title : ((action.params as { message?: string }).message ?? "")}
                options={
                  action.kind === "permission"
                    ? action.params.options.map((option) => ({ optionId: option.optionId, name: option.name, kind: option.kind }))
                    : [
                        { optionId: "accept", name: t("allow"), kind: "allow_once" },
                        { optionId: "decline", name: "Decline", kind: "reject_once" }
                      ]
                }
                onRespond={(optionId) => {
                  if (action.kind === "permission")
                    client.respond(action.id, { outcome: optionId ? { outcome: "selected", optionId } : { outcome: "cancelled" } })
                  else if (optionId === "accept") client.respond(action.id, { action: "accept", content: {} })
                  else client.respond(action.id, { action: "decline" })
                }}
              />
            ))}
          </div>
        )}
        <footer className="shrink-0 border-t px-4 py-3">
          <div className="mx-auto w-full max-w-3xl">
            <PromptInput
              onSubmit={(message) => void send(message.text)}
              onSubmitError={(caught) => setError(caught instanceof Error ? caught.message : String(caught))}
              canSubmit={() => (connection === "ready" && selected !== null && !busy ? true : t("connecting"))}
            >
              <PromptInputBody>
                <PromptInputTextarea placeholder={t("placeholder")} />
              </PromptInputBody>
              <PromptInputFooter className="justify-end">
                <PromptInputSubmit status={busy ? "streaming" : "ready"} />
              </PromptInputFooter>
            </PromptInput>
          </div>
        </footer>
      </div>
    </Shell>
  )
}
