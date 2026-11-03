import type { ReactNode } from 'react'

export type ToolResult = { content?: unknown[]; structuredContent?: unknown; isError?: boolean }
export type SitesTransport = (tool: string, args: Record<string, unknown>) => Promise<ToolResult>
export type Site = {
  id: string; title: string; description: string | null; slug: string; status: string
  latest_version_number: number; current_live_url: string | null; current_preview_url: string | null
  screenshot_url: string | null; updated_at: string; current_user_role: string | null
}
export type Version = { id: string; project_id: string; version_number: number; commit_sha: string; hasArchive: boolean; deployment_id: string | null }
export type Deployment = { id: string; project_id: string; version_id: string; status: 'pending' | 'building' | 'publishing' | 'succeeded' | 'failed'; url: string | null; failure_message: string | null }
export type Page<T> = { items: T[]; cursor: string | null }
export type AuthoringRequest = { kind: 'create' | 'edit' | 'save'; site: Site | null; instruction: string }
export type SitesHost = {
  call: SitesTransport
  /** Uses the application's existing Runtime session and approval UI; never starts an agent itself. */
  author(request: AuthoringRequest): Promise<void>
  openUrl(url: string): Promise<void>
  editor?: ReactNode
  editorSiteId?: string | null
  authoring?: boolean
  /** Changes only when a real authoring turn completes, to refresh authoritative server state. */
  revision?: number
}
