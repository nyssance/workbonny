import { expect, test } from 'bun:test'
import { SitesClient, resultData, safeSiteUrl, siteFrom } from './client'
import { authoringPrompt } from './authoring'
const raw = { id: 'site-id', title: 'Site', slug: 'site', status: 'active', updated_at: '2026-11-03', source_repository_credential: { token: 'must-not-persist' }, siwc_bypass_bearer_token: 'must-not-persist' }
test('site state excludes credentials and rejects unsafe preview URLs', () => {
  expect(JSON.stringify(siteFrom(raw))).not.toContain('must-not-persist')
  expect(safeSiteUrl('javascript:alert(1)')).toBeNull()
  expect(safeSiteUrl('https://user:secret@example.com')).toBeNull()
  expect(safeSiteUrl('https://example.com/')).toBe('https://example.com/')
})
test('a failed tool call is an error, without another call', async () => {
  let calls = 0
  const client = new SitesClient(async () => { calls++; return { isError: true, content: [{ type: 'text', text: 'denied' }] } })
  await expect(client.list()).rejects.toThrow('denied')
  expect(calls).toBe(1)
})
test('cannot deploy a version belonging to another site', async () => {
  let calls = 0
  const client = new SitesClient(async () => { calls++; return {} })
  await expect(client.deploy(siteFrom(raw), { id: 'version-id', project_id: 'other-site', version_number: 1, commit_sha: 'sha', hasArchive: true, deployment_id: null })).rejects.toThrow('版本不属于当前站点')
  expect(calls).toBe(0)
})
test('editing preserves site identity and saves without deployment', () => {
  const prompt = authoringPrompt({ kind: 'edit', site: siteFrom(raw), instruction: 'Change title' })
  expect(prompt).toContain('"site-id"')
  expect(prompt).toContain('save_site_version; do not deploy')
  expect(() => resultData({ content: [{ type: 'text', text: 'done' }] })).toThrow('未返回结构化结果')
})
