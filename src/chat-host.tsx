// What module-chat's surfaces ask of WorkBonny: strings, theme, links, Markdown and error reporting.
// The same object serves the conversation and the session list.
import type { ConversationHost, ReportedError } from "@alwith/module-chat/conversation"
import { CodexMarkdownRenderer } from "@alwith/module-chat/markdown"
import { PatchView } from "@alwith/module-chat/patch-view"
import { TerminalOutput } from "@alwith/module-chat/terminal-output"
import { openUrl } from "@tauri-apps/plugin-opener"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

const openLink = (url: string) => void openUrl(url)

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

export function useChatHost(report: (message: string) => void): ConversationHost {
  const { i18n } = useTranslation()
  const theme = useTheme()
  const language = i18n.language
  return useMemo<ConversationHost>(
    () => ({
      t: (key, values) => i18n.t(key, { ns: "alwithChat", ...values }),
      i18n: { language },
      theme,
      openLink,
      openImage: openLink,
      Output: TerminalOutput,
      Patch: ({ patch }) => <PatchView patch={patch} theme={theme} />,
      Markdown: ({ text, streaming }) => (
        <CodexMarkdownRenderer text={text} streaming={streaming} host={{ theme, copyLabel: i18n.t("copy"), openLink }} />
      ),
      reportError: (error) => {
        const message = error instanceof Error ? error.message : String(error)
        const description = (error as ReportedError | null)?.description
        report(description ? `${message}: ${description}` : message)
      }
    }),
    [i18n, language, theme, report]
  )
}
