/** One native decode in flight; previews jump ahead of thumbnails. Cancelled queued work never crosses IPC. */
export function createImageQueue(load: (revision: number, id: string, thumbnail: boolean) => Promise<Blob>) {
  type Job = { key: string; revision: number; id: string; thumbnail: boolean; signal?: AbortSignal; resolve: (blob: Blob) => void; reject: (error: unknown) => void; abort: () => void }
  const queue: Job[] = []
  const cache = new Map<string, Blob>()
  let cachedBytes = 0
  let working = false
  const aborted = () => new DOMException('Image request cancelled', 'AbortError')
  async function pump() {
    if (working) return
    working = true
    while (queue.length) {
      const priority = queue.findIndex(job => !job.thumbnail)
      const job = queue.splice(priority < 0 ? 0 : priority, 1)[0]!
      if (job.signal?.aborted) { job.reject(aborted()); job.signal.removeEventListener('abort', job.abort); continue }
      try {
        const blob = cache.get(job.key) ?? await load(job.revision, job.id, job.thumbnail)
        if (!cache.has(job.key)) { cache.set(job.key, blob); cachedBytes += blob.size }
        while (cache.size > 36 || cachedBytes > 64 * 1024 * 1024) {
          const oldest = cache.keys().next().value!
          cachedBytes -= cache.get(oldest)!.size; cache.delete(oldest)
        }
        if (!job.signal?.aborted) job.resolve(blob)
      } catch (error) { job.reject(error) }
      finally { job.signal?.removeEventListener('abort', job.abort) }
    }
    working = false
  }
  return (revision: number, id: string, thumbnail: boolean, signal?: AbortSignal): Promise<Blob> => {
    if (signal?.aborted) return Promise.reject(aborted())
    const key = JSON.stringify([revision, id, thumbnail])
    const cached = cache.get(key)
    if (cached) { cache.delete(key); cache.set(key,cached); return Promise.resolve(cached) }
    return new Promise((resolve,reject) => {
      const job: Job = {key,revision,id,thumbnail,signal,resolve,reject,abort: () => {
        const index = queue.indexOf(job); if (index !== -1) queue.splice(index,1)
        reject(aborted())
      }}
      signal?.addEventListener('abort',job.abort,{once:true})
      queue.push(job)
      queueMicrotask(() => { void pump() })
    })
  }
}
