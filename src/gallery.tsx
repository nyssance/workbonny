import { Gallery } from '../modules/gallery/src'
import { createGalleryHost } from '../modules/gallery/src/tauri'
import '../modules/gallery/src/styles.css'

const host = createGalleryHost()

/** The module owns the gallery; the app only supplies Atlas visibility. */
export function GalleryPage({ active }: { active: boolean }) {
  return (
    <div className="main-chat-surface flex min-h-0 flex-1 flex-col">
      <Gallery host={host} active={active} />
    </div>
  )
}
