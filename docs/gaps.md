# 缺口台账

规则见 plan"缺口台账"一节。编号 G 加序号；层：文档／api／module／runtime／block／模板；状态：开放／已回填／关闭。
"文档没说、看 U 源码才知道"的每一条都要记，哪怕最后证明是自己没找到。

| 编号 | 日期 | 现象 | 层 | 归属仓 | 修复形态 | 状态 | 证据边界 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| G1 | 2026-10-27 | `@alwith/api` README 指向仓库根的 PROTOCOL.md，但 ALwith-ai/alwith-api 仓是 PRIVATE，外部开发者读不到协议文档；Launch 类型在 TS 里是 `unknown`，start 的 launch 形状只能从 U 源码得知（`{ engine: "codex" }`） | 文档 | alwith-api | 把 PROTOCOL.md 随 npm 包发布或公开仓；Launch 给出类型 | 开放 | 用 gh 查到仓库可见性；包内无 PROTOCOL.md |
| G2 | 2026-10-27 | `TauriRuntimeClient` 要求宿主 Rust 实现 `runtime_start`／`runtime_send` 两个 command 和 `runtime:lines`／`runtime:exit` 两个事件，含 connectionId 过滤的响应格式，但包内没有文档，Rust crate（`rust/`）没有 Tauri relay，只能读 U 的 `src-tauri/src/runtime.rs`（540 行，含 U 产品逻辑）自己写 | api | alwith-api | 文档写明 relay 契约；或提供通用 Tauri relay crate／插件（plan 已列为抽包对象） | 开放 | 从 dist/tauri.js 反推出命令名；U 仓公开可读 |
| G3 | 2026-10-27 | Runtime 怎么找到并启动 Codex 引擎（`ALWITH_RUNTIME_ENGINES` JSON、`ALWITH_RUNTIME_JOURNAL`、`ALWITH_RUNTIME_PARENT_PID`、`ALWITH_MODULES_DIR` 环境变量，engines 表里 command／args／env 的形状）没有任何公开文档，只能从 U 的 runtime.rs 的 `engines_table` 读出 | runtime | alwith-runtime（经 `@alwith/runtime` README） | README 写明环境变量与 engines 表格式 | 开放 | `@alwith/runtime` README 只有 stageRuntime |
| G4 | 2026-10-27 | `@alwith/module-auth` 不渲染登录页，且 ALwith 平台 API 的主机名（生产 `api`、开发 `api-dev` 的完整 URL）不在包和文档里，只能从 U 的 `src/features/auth/store.ts` 读 | 文档／block | alwith-modules、create-alwith registry | 文档写明平台 API 地址；登录页做成 block | 开放 | 包内 dist 只含 static.alwith.ai 静态资源地址 |
| G5 | 2026-10-27 | `@alwith/module-store` 的 `StorePort` 需要宿主提供六个方法并接到 Rust `alwith-module-store` crate，但两边之间的 Tauri command 契约没有文档；crate README 只讲存储语义 | 文档 | alwith-modules | 写一段"Tauri 宿主怎么接 StorePort"的示例 | 开放 | 读 crate 0.1.1 源码可推，未验证 |
| G6 | 2026-10-27 | `@alwith/module-chat` README 是组件清单，没有"从零接一个聊天页"的最小示例；明确说导航、设置、登录页不在包内 | 文档／block | alwith-modules、create-alwith registry | 聊天页 block 加 quickstart | 开放 | README 原文 |
| G7 | 2026-10-27 | Tauri 3 alpha 的版本矩阵（cli alpha.5、api alpha.3、tauri crate alpha.5、tauri-build alpha.4、tauri-runtime-wry alpha.5、tauri3-specta alpha.3、各插件 alpha.3／4）没有任何 ALwith 文档说明，只能抄 U 的 package.json 与 Cargo.toml | 文档／模板 | create-alwith | 模板精确版本清单即答案 | 开放 | 事实来自 U 公开仓 |
| G8 | 2026-10-27 | sidecar 清单（alwith-runtime、bun、codex、codex-acp-v2 bundle、U 自有 launcher 与 bootstrap）及 `bundle.externalBin` 怎么配只在 U 的 `scripts/stage.ts` 注释里；最小集合是什么没有文档 | 文档／模板 | create-alwith、`@alwith/runtime` | 模板带最小 stage 脚本；README 写最小 sidecar 集合 | 开放 | 待本仓实测最小集合 |
