import type { Deployment, Page, Site, SitesTransport, ToolResult, Version } from './types'

type ObjectValue = Record<string, unknown>
function object(value: unknown): ObjectValue {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) throw new Error('Sites 返回了无效数据')
  return value as ObjectValue
}
function string(value: unknown): string { if (typeof value !== 'string' || !value) throw new Error('Sites 缺少必要字段'); return value }
function nullable(value: unknown): string | null { return typeof value === 'string' && value ? value : null }
export function resultData(result: ToolResult): ObjectValue {
  if (result.isError) {
    const messages = result.content?.flatMap((part) => typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string' ? [part.text] : [])
    throw new Error(messages?.join('\n') || 'Sites 操作失败')
  }
  if (result.structuredContent != null) return object(result.structuredContent)
  for (const part of result.content ?? []) {
    if (typeof part === 'object' && part !== null && 'text' in part && typeof part.text === 'string') {
      try { return object(JSON.parse(part.text)) } catch { /* An MCP text block need not contain JSON. */ }
    }
  }
  throw new Error('Sites 未返回结构化结果，未将此次操作标记为成功')
}
export function siteFrom(value: unknown): Site {
  const v = object(value)
  // Explicit projection: credentials, access tokens and repository secrets never enter module state.
  return { id: string(v.id), title: string(v.title), slug: string(v.slug), description: nullable(v.description), status: string(v.status),
    latest_version_number: typeof v.latest_version_number === 'number' ? v.latest_version_number : 0,
    current_live_url: nullable(v.current_live_url), current_preview_url: nullable(v.current_preview_url), screenshot_url: nullable(v.screenshot_url),
    updated_at: string(v.updated_at), current_user_role: nullable(v.current_user_role) }
}
export function versionFrom(value: unknown): Version {
  const v = object(value)
  if (typeof v.version_number !== 'number') throw new Error('Sites 版本号无效')
  return { id: string(v.id), project_id: string(v.project_id), version_number: v.version_number, commit_sha: string(object(v.source).commit_sha),
    hasArchive: v.archive_storage != null, deployment_id: nullable(v.deployment_id) }
}
export function deploymentFrom(value: unknown): Deployment {
  const v = object(value)
  if (!['pending', 'building', 'publishing', 'succeeded', 'failed'].includes(String(v.status))) throw new Error('Sites 返回了未知部署状态')
  return { id: string(v.id), project_id: string(v.project_id), version_id: string(v.version_id), status: v.status as Deployment['status'], url: nullable(v.url), failure_message: nullable(v.failure_message) }
}
function page<T>(data: ObjectValue, read: (value: unknown) => T): Page<T> {
  if (!Array.isArray(data.items)) throw new Error('Sites 列表格式无效')
  return { items: data.items.map(read), cursor: nullable(data.cursor) }
}
export function safeSiteUrl(value: string | null): string | null {
  if (!value) return null
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password ? url.href : null } catch { return null }
}
export class SitesClient {
  constructor(private readonly call: SitesTransport) {}
  private async request(tool: string, args: Record<string, unknown>) { return resultData(await this.call(`sites.${tool}`, args)) }
  async list(cursor: string | null = null) { return page(await this.request('list_sites', { limit: 20, cursor, include_editable: true }), siteFrom) }
  async get(id: string) { return siteFrom(await this.request('get_site', { project_id: id })) }
  async versions(id: string, cursor: string | null = null) { return page(await this.request('list_site_versions', { project_id: id, limit: 20, cursor }), versionFrom) }
  async deploy(site: Site, version: Version) {
    if (version.project_id !== site.id) throw new Error('版本不属于当前站点')
    // Re-read before publishing; never modify audience or derive opaque IDs.
    const current = await this.get(site.id)
    if (current.status !== 'active') throw new Error('当前站点不可部署')
    if (current.current_user_role && !['owner', 'editor'].includes(current.current_user_role)) throw new Error('当前账号没有部署权限')
    // Generic official operation supports unknown/shared audiences and retains native approvals.
    return deploymentFrom(await this.request('deploy_site_version', { project_id: site.id, version_id: version.id }))
  }
  async deployment(projectId: string, deploymentId: string) {
    const result = deploymentFrom(await this.request('get_deployment_status', { project_id: projectId, deployment_id: deploymentId }))
    if (result.project_id !== projectId || result.id !== deploymentId) throw new Error('Sites 部署标识不匹配')
    return result
  }
}
