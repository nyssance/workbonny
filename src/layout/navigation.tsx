import { MessageSquarePlusIcon, SettingsIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import app from "../../alwith.app.json"

export type SessionRow = { id: string; title: string; active: boolean }

/** The persistent Atlas navigation column: brand, new chat, sessions, settings. */
export function Navigation({ sessions, onNew, onSelect, onSettings }: {
  sessions: SessionRow[]
  onNew: () => void
  onSelect: (id: string) => void
  onSettings: () => void
}) {
  const { t } = useTranslation()
  return (
    <>
      <div className="flex h-12 shrink-0 items-center gap-2 px-4" data-tauri-drag-region>
        <img src="/icon-macos.png" alt="" className="size-6 rounded-md" draggable={false} />
        <span className="font-semibold">{app.productName}</span>
      </div>
      <div className="px-3">
        <Button variant="outline" className="w-full justify-start gap-2" onClick={onNew}>
          <MessageSquarePlusIcon />
          {t("newChat")}
        </Button>
      </div>
      <nav className="mt-3 min-h-0 flex-1 overflow-y-auto px-2">
        {sessions.map((row) => (
          <button
            key={row.id}
            type="button"
            onClick={() => onSelect(row.id)}
            className={`w-full truncate rounded-md px-3 py-2 text-left text-sm hover:bg-sidebar-accent ${row.active ? "bg-sidebar-accent font-medium" : "text-sidebar-foreground/80"}`}
          >
            {row.title}
          </button>
        ))}
      </nav>
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSettings}>
          <SettingsIcon />
          {t("settings")}
        </Button>
      </div>
    </>
  )
}
