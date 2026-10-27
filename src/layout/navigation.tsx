import {
  isQuickChatDirectory,
  NavigationStack,
  QUICK_CHATS_GROUP,
  SessionList,
  type SessionSummary,
  useSessionListExpansion
} from "@alwith/module-chat/session-list"
import { MessageSquarePlusIcon, SettingsIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import app from "../../alwith.app.json"
import { useClient } from "../client"

/** The persistent Atlas navigation column: brand, new chat, module-chat's session list, settings. */
export function Navigation({ selectedId, onNew, onSelect, onSettings }: {
  selectedId: string | null
  onNew: () => void
  onSelect: (row: SessionSummary) => void
  onSettings: () => void
}) {
  const { t } = useTranslation()
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const expansion = useSessionListExpansion()
  // Groups start closed; open the one holding the shown session once.
  const group = useClient((state) => {
    const row = state.sessionList.find((item) => item.sessionId === selectedId)
    return row ? (isQuickChatDirectory(row.cwd) ? QUICK_CHATS_GROUP : row.cwd) : null
  })
  const { open, setOpen } = expansion
  useEffect(() => {
    if (group !== null && !open.has(group)) setOpen(group, true)
  }, [group, open, setOpen])

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
      <div ref={setViewport} className="mt-3 min-h-0 flex-1 overflow-y-auto px-2 [--navigation-row-height:30px]">
        <NavigationStack>
          <SessionList selectedId={selectedId} onSelect={onSelect} viewport={viewport} expansion={expansion} />
        </NavigationStack>
      </div>
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Button variant="ghost" className="w-full justify-start gap-2" onClick={onSettings}>
          <SettingsIcon />
          {t("settings")}
        </Button>
      </div>
    </>
  )
}
