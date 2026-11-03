import type { AuthoringRequest } from './types'
export const SITES_APP = 'app://connector_20205bf7d4e99a89d7154bb849718324'
export const SITES_SYSTEM = `This session edits Sites through the official Sites plugin and tools. Read the installed Sites skill and use its supported source helper and packaging workflow. If the skill, helper, account access, or required tool is unavailable, stop and report the specific missing capability. Never substitute another hosting service. Read .openai/hosting.json before registering; reuse its project_id. Never create a second site for the same checkout. Save source and versions without deployment unless the user explicitly requests deployment in this session; the Sites module has a separate deploy action. Do not change audience, enable publish-on-push, reveal credentials, or store credentials in app state. When loading hosted source, retain its project_id and use a clean checkout. Push source only to the official repository assigned to this Site; never push the WorkBonny/platform repositories. Validate the actual website and package the exact pushed commit before saving. Preserve current project data and user edits. When starting a local preview, report its actual URL. An empty or mocked page is not an implementation.`
export function authoringPrompt(request: AuthoringRequest): string {
  const site = request.site
  if (request.kind !== 'create' && !site) throw new Error('请选择要编辑的站点')
  const action = request.kind === 'create'
    ? 'Build a complete new website for the following request using Sites. Use only this selected checkout; inspect its existing files and hosting manifest first. If it is already a Site, explain that instead of creating a duplicate. New Sites remain private.'
    : request.kind === 'save'
      ? `Validate and save the current source for the existing Site ${JSON.stringify(site!.id)} (${JSON.stringify(site!.title)}). Do not add unrelated changes.`
      : `Modify the existing Site ${JSON.stringify(site!.id)} (${JSON.stringify(site!.title)}). Read get_site, obtain its official source credential, and open the same source repository. If this checkout belongs to another project, stop without changing it. Reuse the site's identity and audience.`
  return `$sites\n${action}\n${request.instruction}\n\nUse the installed Sites skill. Complete source preparation, relevant checks, packaging and save_site_version; do not deploy. Return the actual project ID, saved version ID/number, and a local preview URL if a preview was started. Do not claim a saved version is deployed.`
}
