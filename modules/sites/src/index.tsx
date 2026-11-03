import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeftIcon, ExternalLinkIcon, GlobeIcon, PlusIcon, RefreshCwIcon, RocketIcon, SaveIcon } from 'lucide-react'
import { Button } from '@nyssance/shadcn/vega/components/ui/button'
import { Input } from '@nyssance/shadcn/vega/components/ui/input'
import { Textarea } from '@nyssance/shadcn/vega/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@nyssance/shadcn/vega/components/ui/dialog'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@nyssance/shadcn/vega/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@nyssance/shadcn/vega/components/ui/tabs'
import { SitesClient, safeSiteUrl } from './client'
import type { Deployment, Site, SitesHost, Version } from './types'
export type { SitesHost, Site, Version, Deployment, SitesTransport, AuthoringRequest } from './types'
export { SitesClient } from './client'
export { authoringPrompt, SITES_APP, SITES_SYSTEM } from './authoring'

const pending = (d: Deployment | null) => d !== null && ['pending', 'building', 'publishing'].includes(d.status)
const stages: Record<Deployment['status'], string> = { pending: '等待部署', building: '正在构建', publishing: '正在发布', succeeded: '已部署', failed: '部署失败' }
const errorText = (error: unknown) => error instanceof Error ? error.message : String(error)

export function Sites({ host, active = true }: { host: SitesHost; active?: boolean }) {
  const api = useMemo(() => new SitesClient(host.call), [host.call])
  const [sites, setSites] = useState<Site[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [selected, setSelected] = useState<Site | null>(null)
  const [versions, setVersions] = useState<Version[]>([])
  const [versionCursor, setVersionCursor] = useState<string | null>(null)
  const [versionId, setVersionId] = useState<string>('')
  const [deployment, setDeployment] = useState<Deployment | null>(null)
  const [uncertain, setUncertain] = useState(false)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState('')
  const [compose, setCompose] = useState<'create' | 'edit' | null>(null)
  const [instruction, setInstruction] = useState('')
  const [view, setView] = useState<'preview' | 'edit'>('preview')
  const generation = useRef(0)
  const started = useRef(false)
  const lock = useRef(false)
  const revision = useRef(host.revision)
  const selectedId = useRef<string | null>(null)
  const version = versions.find((item) => item.id === versionId) ?? null
  const hasEditor = !!host.editor && (!selected || host.editorSiteId === selected.id)
  const onlineUrl = safeSiteUrl(selected?.current_live_url ?? null)
  const items = sites.filter((site) => `${site.title} ${site.slug}`.toLocaleLowerCase().includes(filter.toLocaleLowerCase()))

  const refresh = useCallback(async (siteId: string | null, append = false, next: string | null = null) => {
    const current = ++generation.current
    setLoading(true); setError(null)
    try {
      if (siteId) {
        const [site, page] = await Promise.all([api.get(siteId), api.versions(siteId, next)])
        if (current !== generation.current) return
        setSelected(site); setVersions((old) => append ? [...old, ...page.items.filter((item) => !old.some((v) => v.id === item.id))] : page.items)
        setVersionCursor(page.cursor)
        if (!append) {
          const first = page.items[0]
          setVersionId(first?.id ?? '')
          const state = first?.deployment_id ? await api.deployment(site.id, first.deployment_id) : null
          if (current !== generation.current) return
          setDeployment(state); setUncertain(false)
        }
      } else {
        const page = await api.list(next)
        if (current !== generation.current) return
        setSites((old) => append ? [...old, ...page.items.filter((item) => !old.some((v) => v.id === item.id))] : page.items)
        setCursor(page.cursor)
      }
    } catch (caught) { if (current === generation.current) setError(errorText(caught)) }
    finally { if (current === generation.current) setLoading(false) }
  }, [api])

  useEffect(() => {
    if (active && !started.current) { started.current = true; void refresh(null) }
  }, [active, refresh])
  useEffect(() => {
    if (host.revision !== revision.current) {
      revision.current = host.revision
      if (started.current) void refresh(selectedId.current)
    }
  }, [host.revision, refresh])
  useEffect(() => () => { ++generation.current }, [])

  // Observe one existing deployment; this never reissues the mutation or retries failed requests.
  useEffect(() => {
    if (!active || !deployment || !pending(deployment)) return
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const end = Date.now() + 180_000
    const observe = async () => {
      try {
        const next = await api.deployment(deployment.project_id, deployment.id)
        if (disposed) return
        if (!pending(next)) {
          setDeployment(next)
          if (next.status === 'succeeded') {
            const site = await api.get(next.project_id)
            if (!disposed && selectedId.current === site.id) setSelected(site)
          }
        } else if (Date.now() < end) timer = setTimeout(observe, 2500)
        else setError('部署仍在进行，可点刷新查看同一次部署；不会重新部署。')
      } catch (caught) { if (!disposed) setError(errorText(caught)) }
    }
    timer = setTimeout(observe, 2500)
    return () => { disposed = true; clearTimeout(timer) }
  }, [active, api, deployment?.id, deployment?.status])

  const open = (site: Site) => {
    if (lock.current) return
    selectedId.current = site.id; setSelected(site); setVersions([]); setVersionId(''); setDeployment(null); setUncertain(false); setView('preview')
    void refresh(site.id)
  }
  const back = () => { if (lock.current) return; selectedId.current = null; setSelected(null); setDeployment(null); setVersions([]); setVersionId(''); void refresh(null) }
  const author = async (kind: 'create' | 'edit' | 'save') => {
    if (lock.current) return
    lock.current = true; setBusy(true); setError(null)
    try {
      await host.author({ kind, site: kind === 'create' ? null : selected, instruction: kind === 'save' ? '保存当前修改，保留现有站点的访问范围。' : instruction.trim() })
      setCompose(null); setInstruction(''); setView('edit')
    } catch (caught) { setError(errorText(caught)) }
    finally { lock.current = false; setBusy(false) }
  }
  const deploy = async () => {
    if (!selected || !version || lock.current || pending(deployment) || uncertain) return
    lock.current = true; setBusy(true); setError(null); setUncertain(true)
    try {
      const result = await api.deploy(selected, version)
      setDeployment(result); setUncertain(false)
      if (result.status === 'succeeded') setSelected(await api.get(selected.id))
    } catch (caught) { setError(`${errorText(caught)}。请刷新核对版本部署状态，不要重复提交。`) }
    finally { lock.current = false; setBusy(false) }
  }
  const chooseVersion = async (id: string | null) => {
    if (!id || busy || loading || pending(deployment) || uncertain) return
    const item = versions.find((entry) => entry.id === id)
    if (!item || !selected) return
    const projectId = selected.id
    setVersionId(id); setDeployment(null); setLoading(true); setError(null)
    try {
      const result = item.deployment_id ? await api.deployment(projectId, item.deployment_id) : null
      if (selectedId.current === projectId) setDeployment(result)
    } catch (caught) { setError(errorText(caught)); setUncertain(true) }
    finally { setLoading(false) }
  }
  const showError = error || (deployment?.status === 'failed' ? deployment.failure_message || '部署失败' : null)
  return (
    <section className="sites-module flex h-full min-h-0 flex-1 flex-col" aria-label="Sites">
      <header className="flex h-16 shrink-0 items-center gap-2 overflow-x-auto px-6">
        {selected && <Button variant="ghost" size="icon" aria-label="返回 Sites" disabled={busy} onClick={back}><ArrowLeftIcon /></Button>}
        <h1 className="min-w-0 shrink-0 truncate text-lg font-semibold">{selected?.title ?? 'Sites'}</h1>
        {!selected ? <>
          <Input className="ml-2 w-56 shrink-0" aria-label="搜索 Sites" placeholder="搜索站点" value={filter} onChange={(event) => setFilter(event.target.value)} />
          <span className="shrink-0 text-sm text-muted-foreground">{sites.length}{cursor ? '+' : ''}</span>
          <div className="flex-1" />
          {host.editor && <Button variant="ghost" onClick={() => setView(view === 'edit' ? 'preview' : 'edit')}>{view === 'edit' ? '站点列表' : '继续编辑'}</Button>}
        </> : <>
          <Tabs value={view} onValueChange={(value) => { if (value === 'edit' && !hasEditor) setCompose('edit'); else setView(value as 'preview' | 'edit') }}><TabsList><TabsTrigger value="preview">线上预览</TabsTrigger><TabsTrigger value="edit">编辑</TabsTrigger></TabsList></Tabs>
          <div className="flex-1" />
          {deployment && <span role="status" className="shrink-0 text-sm text-muted-foreground">{stages[deployment.status]}</span>}
          <Select value={versionId} onValueChange={chooseVersion} disabled={busy || loading || uncertain || pending(deployment) || versions.length === 0}>
            <SelectTrigger className="w-36"><SelectValue placeholder="暂无保存版本" /></SelectTrigger>
            <SelectContent><SelectGroup>{versions.map((item) => <SelectItem key={item.id} value={item.id}>版本 {item.version_number}</SelectItem>)}</SelectGroup></SelectContent>
          </Select>
          {versionCursor && <Button variant="ghost" disabled={loading || busy} onClick={() => void refresh(selected.id, true, versionCursor)}>更多版本</Button>}
          <Button variant="ghost" disabled={busy || host.authoring} onClick={() => void author('save')}><SaveIcon />保存版本</Button>
          <Button disabled={busy || loading || host.authoring || !version || uncertain || pending(deployment) || selected.status !== 'active'} onClick={() => void deploy()}><RocketIcon />部署版本 {version?.version_number ?? ''}</Button>
          {onlineUrl && <Button variant="ghost" size="icon" aria-label="在浏览器打开站点" onClick={() => void host.openUrl(onlineUrl).catch((e) => setError(errorText(e)))}><ExternalLinkIcon /></Button>}
        </>}
        <Button variant="ghost" size="icon" aria-label="刷新 Sites" disabled={loading || busy} onClick={() => void refresh(selectedId.current)}><RefreshCwIcon className={loading ? 'animate-spin' : undefined} /></Button>
        {!selected && <Button disabled={busy || host.authoring} onClick={() => { setInstruction(''); setCompose('create') }}><PlusIcon />新建</Button>}
        {selected && <Button variant="outline" disabled={busy || host.authoring} onClick={() => { setInstruction(''); setCompose('edit') }}>修改</Button>}
      </header>
      {showError && <p role="alert" className="mx-6 mb-3 text-sm text-destructive">{showError}</p>}
      {view === 'edit' && hasEditor ? <div className="min-h-0 flex-1">{host.editor}</div> : selected ? <>
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6">
          {onlineUrl ? <iframe key={onlineUrl} src={onlineUrl} title={`${selected.title} · 线上版本`} className="min-h-0 w-full flex-1 rounded-lg border" sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-popups-to-escape-sandbox allow-downloads" referrerPolicy="no-referrer" />
            : <div className="flex flex-1 flex-col items-center justify-center gap-3"><GlobeIcon className="size-9 text-muted-foreground" /><p>这个站点还没有线上版本</p><Button variant="outline" disabled={busy || host.authoring} onClick={() => setCompose('edit')}>编辑站点</Button></div>}
          <div className="flex items-center justify-between gap-3 pt-3 text-xs text-muted-foreground"><span>{onlineUrl ? '此处显示已部署版本；未部署的修改在编辑会话中本地预览。' : '保存版本不会发布；选择一个保存版本后部署。'}</span>{version && <span className="shrink-0">{version.commit_sha.slice(0, 8)}</span>}</div>
        </div>
      </> : <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-6">
        {!loading && sites.length === 0 && <div className="flex h-full flex-col items-center justify-center gap-3"><GlobeIcon className="size-9 text-muted-foreground" /><p>创建你的第一个 Site</p><Button onClick={() => setCompose('create')}>开始建站</Button></div>}
        {items.map((site) => <button key={site.id} type="button" className="flex w-full items-center gap-4 border-b py-4 text-left hover:bg-muted/50 focus-visible:outline-ring" onClick={() => open(site)}>
          <GlobeIcon className="size-5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1"><span className="block truncate font-medium">{site.title}</span><span className="block truncate text-sm text-muted-foreground">{site.slug}</span></span>
          <span className="shrink-0 text-sm text-muted-foreground">{site.current_live_url ? '已部署' : '未部署'}</span><span className="shrink-0 text-sm text-muted-foreground">v{site.latest_version_number}</span>
        </button>)}
        {!loading && sites.length > 0 && items.length === 0 && <p className="py-8 text-center text-muted-foreground">没有匹配的站点</p>}
        {cursor && <div className="flex justify-center py-4"><Button variant="ghost" disabled={loading} onClick={() => void refresh(null, true, cursor)}>加载更多</Button></div>}
      </div>}
      <Dialog open={compose !== null} onOpenChange={(value) => { if (!value && !busy) setCompose(null) }}>
        <DialogContent><DialogHeader><DialogTitle>{compose === 'create' ? '新建 Site' : `修改 ${selected?.title ?? 'Site'}`}</DialogTitle></DialogHeader>
          <Textarea aria-label="网站需求" placeholder={compose === 'create' ? '描述网站用途、内容与需要完成的功能…' : '描述需要修改的内容…'} rows={6} value={instruction} onChange={(event) => setInstruction(event.target.value)} disabled={busy} />
          <DialogFooter><Button disabled={busy || !instruction.trim()} onClick={() => void author(compose === 'create' ? 'create' : 'edit')}>{busy ? '正在打开工作目录…' : '选择工作目录并开始'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
