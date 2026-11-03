const result = await Bun.build({entrypoints: ['src/index.tsx', 'src/client.ts'], outdir: 'dist', target: 'browser', packages: 'external'})
if (!result.success) throw new AggregateError(result.logs)
