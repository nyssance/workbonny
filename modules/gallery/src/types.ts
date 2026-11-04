export interface GalleryEntry { id: string; name: string; bytes: number; modified: number }
export interface GalleryAlbum { name: string; revision: number; entries: GalleryEntry[] }
export interface GalleryHost {
  pick(): Promise<GalleryAlbum | null>
  restore(): Promise<GalleryAlbum | null>
  refresh(revision: number): Promise<GalleryAlbum>
  image(revision: number, id: string, thumbnail: boolean, signal?: AbortSignal): Promise<Blob>
  preview(revision: number, id: string): Promise<void>
  openOriginal(revision: number, id: string): Promise<void>
  onChange(callback: (error: string) => void): Promise<() => void>
  close(): Promise<void>
}
/** CSS percentage positioning: each fifth samples the SAME fitted image, not five independent crops. */
export const slicePositions = [0, 25, 50, 75, 100] as const

/** Fit the unsliced image inside the available space, reserving gutters and vertical offsets. */
export function fitSlices(width: number, height: number, imageWidth: number, imageHeight: number) {
  const scale = Math.max(0, Math.min((width - 32) / imageWidth, (height - 40) / imageHeight))
  return { width: imageWidth * scale, height: imageHeight * scale }
}
