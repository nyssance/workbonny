import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { createImageQueue } from './images'
import type { GalleryHost } from './types'
export function createGalleryHost(): GalleryHost {
  const call = <T>(name: string, args?: Record<string, unknown>) => invoke<T>(`plugin:workbonny-gallery|${name}`, args)
  let pending: Promise<unknown> = Promise.resolve()
  const serial = <T>(operation: () => Promise<T>): Promise<T> => {
    const next = pending.then(operation, operation)
    pending = next.then(() => undefined, () => undefined)
    return next
  }
  return {
    pick: () => serial(() => call('pick')), restore: () => serial(() => call('restore')), refresh: revision => serial(() => call('refresh', { revision })),
    image: createImageQueue(async (revision, id, thumbnail) => new Blob([new Uint8Array(await call<number[]>('image', { revision, id, thumbnail }))], { type: 'image/jpeg' })),
    preview: (revision, id) => call('preview', { revision, id }),
    openOriginal: (revision, id) => call('open_original', { revision, id }),
    onChange: callback => listen<string>('gallery:changed', event => callback(event.payload)),
    close: () => serial(() => call('close'))
  }
}
