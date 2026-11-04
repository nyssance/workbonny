import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@nyssance/shadcn/vega/components/ui/button'
import { Input } from '@nyssance/shadcn/vega/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@nyssance/shadcn/vega/components/ui/tabs'
import { Alert, AlertDescription } from '@nyssance/shadcn/vega/components/ui/alert'
import { Skeleton } from '@nyssance/shadcn/vega/components/ui/skeleton'
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from '@nyssance/shadcn/vega/components/ui/empty'
import { ArrowLeft, ArrowRight, FolderOpen, ExternalLink, Grid2X2, X } from 'lucide-react'
import { fitSlices, slicePositions, type GalleryAlbum, type GalleryEntry, type GalleryHost } from './types'
export type { GalleryHost, GalleryAlbum, GalleryEntry } from './types'

function Picture({ host, album, entry, thumbnail = false, children }: { host: GalleryHost; album: GalleryAlbum; entry: GalleryEntry; thumbnail?: boolean; children?: (url: string) => React.ReactNode }) {
  const [url, setUrl] = useState(''); const [error, setError] = useState('')
  useEffect(() => {
    let alive = true; let resource = ''; const abort = new AbortController(); setUrl(''); setError('')
    void host.image(album.revision, entry.id, thumbnail, abort.signal).then(blob => {
      if (!alive) return
      resource = URL.createObjectURL(blob); setUrl(resource)
    }).catch(error => { if (alive) setError(String(error)) })
    return () => { alive = false; abort.abort(); if (resource) URL.revokeObjectURL(resource) }
  }, [host, album.revision, entry.id, thumbnail])
  if (error) return <span className="gallery-image-error" title={error}>{thumbnail ? '!' : error}</span>
  if (!url) return <Skeleton className="gallery-loading" role={thumbnail ? undefined : 'status'} aria-label="正在读取图片" />
  return children ? children(url) : <img src={url} alt={entry.name} draggable={false} />
}
function Slices({ url }: { url: string }) {
  const container = useRef<HTMLDivElement>(null)
  const [size,setSize] = useState({width:0,height:0})
  const [natural,setNatural] = useState({width:0,height:0})
  useEffect(() => {
    const image = new Image(); let alive = true
    image.onload = () => { if (alive) setNatural({width:image.naturalWidth,height:image.naturalHeight}) }
    image.src = url
    return () => { alive = false }
  }, [url])
  useEffect(() => {
    const node = container.current; if (!node) return
    const measure = () => setSize({width:node.clientWidth,height:node.clientHeight})
    const observer = new ResizeObserver(measure)
    observer.observe(node); measure()
    return () => observer.disconnect()
  }, [])
  const fit = natural.width ? fitSlices(size.width,size.height,natural.width,natural.height) : {width:0,height:0}
  return <div className="gallery-slice-frame" ref={container}>
    {fit.width > 0 && <div className="gallery-slices" style={{width:fit.width+32,height:fit.height}}>
      {slicePositions.map((_, i) => <span key={i} className="gallery-slice" style={{'--slice':i,backgroundImage:`url("${url}")`,backgroundSize:`${fit.width}px ${fit.height}px`,backgroundPosition:`${-i*fit.width/5}px 0`} as CSSProperties} />)}
    </div>}
  </div>
}
function LazyThumbnail({ host, album, entry }: { host: GalleryHost; album: GalleryAlbum; entry: GalleryEntry }) {
  const container = useRef<HTMLSpanElement>(null)
  const [visible,setVisible] = useState(false)
  useEffect(() => {
    const node = container.current; if (!node) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect() }
    }, {root:node.closest('.gallery-browser-grid'),rootMargin:'120px'})
    observer.observe(node)
    return () => observer.disconnect()
  }, [])
  return <span className="gallery-browser-thumbnail" ref={container}>{visible && <Picture host={host} album={album} entry={entry} thumbnail />}</span>
}

export function Gallery({ host, active = true }: { host: GalleryHost; active?: boolean }) {
  const [album, setAlbum] = useState<GalleryAlbum | null>(null)
  const [selected, setSelected] = useState('')
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState('')
  const [changed, setChanged] = useState(false)
  const [view, setView] = useState<'slices' | 'image'>('slices')
  const previewing = useRef(false)
  const [browsing, setBrowsing] = useState(false)
  const [query, setQuery] = useState('')
  const [browserPage, setBrowserPage] = useState(0)
  const root = useRef<HTMLElement>(null)
  const mounted = useRef(false)
  const revision = useRef(0)
  const index = Math.max(0, album?.entries.findIndex(e => e.id === selected) ?? 0)
  const entry = album?.entries[index]
  const accept = (next: GalleryAlbum | null) => {
    if (!next) return
    setAlbum(next); setChanged(false)
    let saved = ''
    try { saved = localStorage.getItem(`gallery:${next.name}:selected`) ?? '' } catch { /* Storage can be unavailable; browsing still works. */ }
    setSelected(current => next.entries.some(e => e.id === current) ? current : next.entries.some(e => e.id === saved) ? saved : next.entries[0]?.id ?? '')
  }
  useEffect(() => {
    mounted.current = true
    let alive = true; let stop: (() => void) | undefined
    void (async () => {
      stop = await host.onChange(message => { if (alive) { setChanged(true); if (message) setError(message) } })
      if (!alive) { stop(); return }
      const value = await host.restore()
      if (alive) accept(value)
    })().catch(e => { if (alive) setError(String(e)) }).finally(() => { if (alive) setBusy(false) })
    return () => { alive = false; mounted.current = false; stop?.(); void host.close().catch(console.error) }
  }, [host])
  useEffect(() => { if (album && entry) { try { localStorage.setItem(`gallery:${album.name}:selected`, entry.id) } catch { /* Nonessential preference. */ } } }, [album?.name, entry?.id])
  // One low-priority lookahead replaces the permanent row of thumbnail decodes.
  useEffect(() => {
    if (!active || !album || album.entries.length < 2) return
    const abort = new AbortController()
    const next = album.entries[(index + 1) % album.entries.length]!
    void host.image(album.revision,next.id,true,abort.signal).catch(() => { /* A speculative load never replaces the current image; opening the file reports its error. */ })
    return () => abort.abort()
  }, [host,album,index,active])
  async function preview() {
    if (!album || !entry || previewing.current) return
    previewing.current = true
    try { await host.preview(album.revision, entry.id) }
    catch (e) { if (mounted.current) setError(String(e)) }
    finally { previewing.current = false }
  }
  const move = (delta: number) => { if (album?.entries.length) setSelected(album.entries[(index + delta + album.entries.length) % album.entries.length]!.id) }
  useEffect(() => {
    if (!active) return
    const keydown = (event: KeyboardEvent) => {
      if (browsing) {
        if (event.key === 'Escape') { event.preventDefault(); setBrowsing(false); root.current?.focus() }
        return
      }
      if (event.altKey || event.ctrlKey || event.metaKey || (event.target as HTMLElement)?.closest('input, textarea, select, [contenteditable=true], [role=tablist]')) return
      if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1) }
      if (event.code === 'Space' && !event.repeat && !(event.target as HTMLElement)?.closest('button, a, [role=button]')) { event.preventDefault(); void preview() }
    }
    const node = root.current
    node?.addEventListener('keydown', keydown)
    return () => node?.removeEventListener('keydown', keydown)
  }, [active, album, index, browsing])
  async function run(operation: () => Promise<GalleryAlbum | null>) {
    const ticket = ++revision.current; setBusy(true); setError('')
    try { const next = await operation(); if (mounted.current && ticket === revision.current) accept(next) }
    catch (e) { if (mounted.current) setError(String(e)) }
    finally { if (mounted.current && ticket === revision.current) setBusy(false) }
  }
  const matches = album?.entries.filter(item => item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) ?? []
  const pageCount = Math.max(1, Math.ceil(matches.length / 48))
  const page = Math.min(browserPage, pageCount - 1)
  const openBrowser = () => { setQuery(''); setBrowserPage(Math.floor(index / 48)); setBrowsing(true) }
  const closeBrowser = () => { setBrowsing(false); root.current?.focus() }
  return <section className="alwith-gallery" ref={root} aria-label="图片展厅" tabIndex={0}>
    {!browsing && <Tabs className="gallery-view" value={view} onValueChange={value => { if (value === 'slices' || value === 'image') setView(value) }}>
    <header className="gallery-toolbar">
      <div className="gallery-toolbar-file">
        {entry && <Button variant="ghost" className="gallery-browse" aria-label="浏览全部图片" onClick={openBrowser}><Grid2X2 data-icon="inline-start" />全部图片</Button>}
        <span className="gallery-folder" title={album?.name}>{album?.name ?? '图片展厅'}</span>
      </div>
      <div className="gallery-toolbar-actions">
        {changed && <Button variant="secondary" disabled={busy} onClick={() => album && void run(() => host.refresh(album.revision))}>文件夹已变化 · 更新</Button>}
        <TabsList className="rounded-full" aria-label="展示方式">
          <TabsTrigger className="rounded-full" value="slices">切片</TabsTrigger>
          <TabsTrigger className="rounded-full" value="image">原貌</TabsTrigger>
        </TabsList>
        {album && entry && <Button variant="ghost" size="icon" aria-label="用系统应用打开" title="用系统应用打开" onClick={() => void host.openOriginal(album.revision, entry.id).catch(e => setError(String(e)))}><ExternalLink /></Button>}
        <Button variant="ghost" size="icon" disabled={busy} aria-label={album ? '更换文件夹' : '选择文件夹'} title={album ? '更换文件夹' : '选择文件夹'} onClick={() => void run(host.pick)}><FolderOpen /></Button>
      </div>
    </header>
    {error && <Alert variant="destructive" className="gallery-error"><AlertDescription>{error}</AlertDescription><Button variant="ghost" size="icon" aria-label="关闭错误信息" onClick={() => setError('')}><X /></Button></Alert>}
    {(['slices', 'image'] as const).map(mode => <TabsContent key={mode} value={mode} className="gallery-body">
      {album && entry ? <>
        <div className="gallery-exhibition">
          <button className={`gallery-artwork gallery-artwork--${mode}`} aria-label={`系统预览 ${entry.name}`} onClick={() => void preview()}>
            <Picture key={`${album.revision}:${entry.id}`} host={host} album={album} entry={entry}>{url => mode === 'slices'
              ? <Slices url={url} />
              : <img className="gallery-whole" src={url} alt={entry.name} />}</Picture>
          </button>

        </div>

      </> : <Empty className="gallery-empty"><EmptyHeader><EmptyTitle>{busy ? '正在读取你的收藏' : album ? '这个文件夹还没有支持的图片' : '从你自己的文件夹开始'}</EmptyTitle><EmptyDescription>JPEG · PNG · WebP · GIF · BMP · TIFF，包含子文件夹。</EmptyDescription></EmptyHeader><EmptyContent><Button disabled={busy} onClick={() => void run(host.pick)}><FolderOpen data-icon="inline-start" />选择图片文件夹</Button></EmptyContent></Empty>}

    </TabsContent>)}
    {album && entry && <footer className="gallery-footer">
      <div className="gallery-footer-file">
        <h1 className="gallery-title" title={entry.name}>{entry.name.split('/').pop()}</h1>
        <span className="gallery-file-info">{entry.name.split('.').pop()?.toUpperCase()} · {(entry.bytes / 1024 / 1024).toFixed(1)} MB{entry.modified > 0 && ` · ${new Date(entry.modified).toLocaleDateString()}`}</span>
      </div>
      <nav className="gallery-footer-navigation" aria-label="图片导航">
        <span className="gallery-count">{index + 1} / {album.entries.length}</span>
          <Button variant="ghost" size="icon" className="gallery-previous" aria-label="上一张" onClick={() => move(-1)} disabled={album.entries.length < 2}><ArrowLeft className="size-5" /></Button>
          <Button variant="ghost" size="icon" className="gallery-next" aria-label="下一张" onClick={() => move(1)} disabled={album.entries.length < 2}><ArrowRight className="size-5" /></Button>
      </nav>
    </footer>}
    </Tabs>}
    {browsing && album && <section className="gallery-browser" aria-label="全部图片">
          <header className="gallery-browser-toolbar">
            <Button variant="ghost" size="icon-lg" aria-label="返回图片" title="返回图片" onClick={closeBrowser}><ArrowLeft /></Button>
            <Input autoFocus={active} aria-label="搜索图片" placeholder="搜索文件名或文件夹" value={query} onChange={event => {setQuery(event.target.value);setBrowserPage(0)}} />
            <span>{matches.length} 张</span>
            <nav aria-label="图片分页" className="gallery-pagination">
              <Button variant="ghost" size="icon-lg" aria-label="上一页图片" disabled={page === 0} onClick={() => setBrowserPage(page - 1)}><ArrowLeft /></Button>
              <span>{page + 1} / {pageCount}</span>
              <Button variant="ghost" size="icon-lg" aria-label="下一页图片" disabled={page + 1 >= pageCount} onClick={() => setBrowserPage(page + 1)}><ArrowRight /></Button>
            </nav>
          </header>
          <div className="gallery-browser-grid" key={`${album.revision}:${query}:${page}`}>
            {matches.length === 0 ? <Empty><EmptyHeader><EmptyTitle>没有匹配的图片</EmptyTitle><EmptyDescription>试试其他文件名或文件夹。</EmptyDescription></EmptyHeader></Empty> : matches.slice(page * 48, (page + 1) * 48).map(item => <button key={item.id} aria-label={`打开 ${item.name}`} aria-current={entry?.id === item.id ? 'true' : undefined} onClick={() => {setSelected(item.id);closeBrowser()}} title={item.name}>
              <LazyThumbnail host={host} album={album} entry={item} />
            </button>)}
          </div>
    </section>}
  </section>
}
