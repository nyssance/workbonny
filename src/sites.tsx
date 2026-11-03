import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Composer, ConversationView } from '@alwith/module-chat/conversation'
import { chooseFolder } from '@alwith/module-desktop-shell/native'
import { openUrl } from '@tauri-apps/plugin-opener'
import { toast } from 'sonner'
import { Sites, SITES_APP, SITES_SYSTEM, authoringPrompt, type AuthoringRequest, type SitesHost } from '../modules/sites/src'
import { client, useSession } from './client'
import type { ToolResult } from '../modules/sites/src/types'

type SitesMcpClient = { callMcpTool(params: { threadId: string; server: string; tool: string; arguments: Record<string, unknown> }): Promise<ToolResult> }
function supportsSitesTransport(value: object): value is SitesMcpClient {
  return 'callMcpTool' in value && typeof value.callMcpTool === 'function'
}
import { useChatHost } from './chat-host'

/** Only application wiring lives here; the independently extractable module owns Sites UI and hosting behavior. */
export function SitesPage({ active }: { active: boolean }) {
  const [editorId, setEditorId] = useState<string | null>(null)
  const [editorSiteId, setEditorSiteId] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const session = useSession(editorId)
  const service = useRef<Promise<string> | null>(null)
  const bindings = useRef(new Map<string, string>())
  const report = useCallback((message: string) => { toast.error(message) }, [])
  const chatHost = useChatHost(report)
  const wasRunning = useRef(false)
  useEffect(() => {
    if (session?.state === 'running' || session?.state === 'requires_action') wasRunning.current = true
    else if (session?.state === 'idle' && wasRunning.current) { wasRunning.current = false; setRevision((n) => n + 1) }
  }, [session?.state])
  useEffect(() => () => {
    void service.current?.then((id) => { if (client.isDraft(id)) return client.discardDraft(id) }).catch(console.error)
  }, [])
  const call = useCallback<SitesHost['call']>(async (tool, args) => {
    if (!tool.startsWith('sites.')) throw new Error('Sites 模块只能调用 Sites 工具')
    if (!supportsSitesTransport(client)) throw new Error('当前共享聊天包尚未包含 Sites 接入，请使用本地候选包验证。')
    await client.connect()
    // A normal Runtime-owned draft provides the MCP context; it is not another session database or agent process.
    service.current ??= client.newSession(undefined, { draft: true })
    const threadId = await service.current
    return client.callMcpTool({ threadId, server: 'codex_apps', tool, arguments: args })
  }, [])
  const author = useCallback(async (request: AuthoringRequest) => {
    await client.connect()
    const key = request.site?.id
    let id = key ? bindings.current.get(key) : undefined
    if (id) {
      const existing = client.state.sessions[id]
      if (existing && existing.state !== 'idle') throw new Error('请先完成或停止当前站点任务')
      if (!existing) id = undefined
    }
    if (!id) {
      const cwd = await chooseFolder()
      if (!cwd) throw new Error('未选择站点工作目录')
      id = await client.newSession(cwd, { draft: true, systemPrompt: SITES_SYSTEM })
      if (key) bindings.current.set(key, id)
    }
    setEditorId(id); setEditorSiteId(key ?? null)
    await client.prompt(id, [{ type: 'resource_link', name: 'Sites', uri: SITES_APP }, { type: 'text', text: authoringPrompt(request) }])
  }, [])
  const editor = session ? <ConversationView session={session} client={client} host={chatHost} composer={<Composer session={session} onSubmit={async (prompt, accept) => {
    const receipt = await client.prompt(session.id, [{ type: 'resource_link', name: 'Sites', uri: SITES_APP }, ...prompt])
    accept?.(receipt)
  }} />} /> : undefined
  const host = useMemo<SitesHost>(() => ({ call, author, openUrl, editor, editorSiteId, authoring: session?.state === 'running' || session?.state === 'requires_action', revision }), [call, author, editor, editorSiteId, session?.state, revision])
  return <div className="main-chat-surface flex min-h-0 flex-1 flex-col"><Sites host={host} active={active} /></div>
}
