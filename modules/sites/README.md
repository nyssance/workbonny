# Sites

WorkBonny-owned Sites module, extractable later as a separate package. The host supplies
`SitesTransport`, an existing Runtime-backed authoring session and URL opening. The
module imports neither WorkBonny files nor private ALwith implementation, stores no
account credentials, and does not create another session database.

Checkpoint: site list/search/pagination, editing entry, saved versions, explicit deployment
and observation of that deployment, and online preview. Authoring uses the installed
official Sites skill and source helpers. New/edit/save asks for a saved version without
deploying; the deploy action publishes the selected version without changing its audience.
Progress observation never reissues the mutation. Site state excludes source credentials
and bypass tokens through explicit projection.

WorkBonny's `src/sites.tsx` supplies Codex and shared conversation UI. Hosting currently
requires authenticated Codex app-server MCP support. Other authoring models can implement
the host contract but have not been verified. Sites account access is required. Official
helper code is not redistributed. ChatGPT.app resources were inspected read-only for
behavioral reference; their implementation is not included.

Validation: module and WorkBonny frontend compile; direct read-only Sites calls work via
isolated Runtime. Creation/edit/save/deployment and desktop visual acceptance are not yet
end-to-end validated. This checkpoint is not a completed Sites release.

Build with `bun run build` in this directory. Run `bun test modules/sites/src` in WorkBonny.
Consumers must include module source/dist in Tailwind content discovery.
