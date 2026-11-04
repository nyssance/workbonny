const result = await Bun.build({entrypoints: ["src/index.tsx", "src/tauri.ts"], outdir: "dist", target: "browser", packages: "external", sourcemap: "external"})
if (!result.success) throw new AggregateError(result.logs)
