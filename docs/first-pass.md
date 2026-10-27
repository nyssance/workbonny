# 第一遍：发现（执行日志）

按 plan"步骤"第一遍执行。只记事实和耗时，不修上游。

## 计时

| 阶段 | 开始 | 结束 | 耗时 | 备注 |
| --- | --- | --- | --- | --- |
| 读公开包文档与 U 参考，记 G1–G9 | 15:10 | 15:05 后约 25 分钟 | ~25 min | 只读 npm 包、crates.io、U 公开仓；发现 alwith-api 仓私有 |
| 手搭最小工程（配置、Rust relay、stage、图标、UI） | ~15:35 | 15:26 | ~50 min | bun install 冷缓存 160 s；cargo check 首次 20 s（本机有 cargo 缓存，干净机器会远长于此） |
| 首次 `bun tauri dev` | 15:26 | 待记 | 待记 | 编译 Tauri 3 alpha 全量依赖 |
| 首次 `bun tauri dev` 到窗口出现 | 15:26:00 | 15:26:33 | 33 s | cargo 缓存热；干净机器要全量编译 Tauri 3 alpha，待第一遍云端验证测 |
| 第一轮对话走通（"pong"） | 15:26 | 15:31 | 5 min | 中间踩坑：StrictMode 重复 start；网页重载后 adopt 已有 agent 再 session/new 卡住（见 G10），冷启动正常 |

## 里程碑

- 15:31 从空目录只用 npm 公开包做出的 Tauri 应用与 Codex 完成第一轮对话（截图 `app2.png` 在会话 scratchpad，未入库）。从 15:10 计时起 21 分钟，其中约 10 分钟是读文档与 U 参考源码。

## 用户在第一遍中补的要求（已写进 plan）

- bundle id 由用户填，向导旁要有"不知道怎么拿"的 Apple Developer 引导。本仓当前的填写处：`alwith.app.json` 的 `identifier`，已填 `work.bonny.desktop`。
- 用户零基础，要装的东西经 Free 一键装。
- 成品 UI 必须好看：已切到 Tailwind、shadcn、`@alwith/module-chat` 成品组件。
- 图标：`tauri icon` 不处理留白圆角（G9）；图标风格模仿 WorkBuddy 的构图（渐变底、吉祥物头从左下探入、两条竖眼），主体换成粉色兔子，源文件 `assets/icon.svg`。
| 成品 UI 接入（Tailwind、shadcn vega、module-chat 组件） | 15:33 | 15:50 | ~17 min | 踩坑：shadcn init 必须 `-p vega --reinstall` 才能非交互；`@apply bg-background` 写在 `@theme inline` 之前会报未知 utility；U 的 `shadcn/tailwind.css` 导入路径在 4.22.1 实际是 `dist/tailwind.css`（包 exports 映射，可用） |
| 图标六版 | 15:36 | 15:50 | ~14 min | 量 WorkBuddy：眼缝与两眼连线倾角 30°，白毛皮加同色系脸罩；用户反馈脸罩不像兔子，最终版保留 30° 与构图、用第一版兔子脸 |
| 成品渲染调试（module-chat worker） | 15:56 | 16:03 | ~7 min | 现象：发消息后整屏空白，`Error: Error`；原因 G11（Vite 预打包破坏 worker URL），加 `optimizeDeps.exclude` 后用户气泡正常渲染 |
| Atlas 接入（navigation、leading、shell 组件） | 16:03 | 16:08 | ~5 min | 已写组件，待接进 App；G12 记录 Atlas 分发与 atlas-tauri 许可证问题 |
| 本地 release 打包 `bun tauri build` | 16:04:55 | 16:06:13 | 78 s | cargo 缓存热，release 编译 40 s；产物 WorkBonny.app 与 WorkBonny_0.1.0_aarch64.dmg（172 MB，含 Runtime、Bun、Codex 三个 sidecar）；ad-hoc 签名 |
| 云端构建 | 未开始 | | | 工作流已写（.github/workflows/build.yml），GitHub 仓库创建与推送需用户执行 |
| 连接稳定性调试（G10、G13） | 16:08 | 16:22 | ~14 min | 用 `scripts/probe-runtime.ts` 证明 Runtime 路径正常；定位到 Tauri 3 alpha 开发态 IPC 回退重发 invoke，导致重复 initialize／start；relay 改为幂等，客户端改为记住 session 用 attach 重连 |
| 排查"含命令的提示无输出" | 16:22 | 16:36 | ~14 min | 结论：本仓自己的 bug。relay 的调试 eprintln 用 `&text[..400]` 切中文事件，panic 杀死转发任务；Runtime journal（`~/Library/Caches/work.bonny.desktop/runtime/sessions/*.jsonl`）证明 Codex 24 秒完成回合。教训写进 G10 关闭记录；排查工具 `scripts/probe-runtime.ts`、`scripts/probe-adapter.ts`、`VITE_AUTOPROMPT` 留作模板的诊断手段 |
| 成品 UI 整轮验证（含工具调用） | 16:35:08 | 16:35:25 | 17 s | 自动提示词经 webview、relay、Runtime、适配器、Codex 全链路：155 个 agent_message_chunk，`ls ~` 的 tool_call_update 执行并 completed，无 panic、无渲染错误 |

## 里程碑

- 16:35 成品 UI（Atlas 布局、shadcn、module-chat 组件）在应用内完成含工具调用的完整回合；本地 release 打包 78 s 出 .dmg，装好后独立运行并连上 Runtime。

渲染证据（16:36:40，dev-only `[dom]` 转储，来自 module-chat 组件渲染后的 innerText）："用一句话介绍你自己… 已处理 7秒 我是 Codex，一个可以帮你编写代码… 编写与修改代码 排查问题并验证结果 使用工具完成实际操作 … 已运行 ls ~，主目录内容如下： Applications Datacenter Desktop …"。用户气泡、工作区折叠（本地化"已处理 7秒"）、Markdown 列表、命令结果全部由成品组件渲染。

## 第二段：把 U 的客户端层抽进包（2026-10-27 17:00–19:20）

背景与方案见 alwith-desktop 的 [聊天层抽取计划](../../../ALwith/alwith-desktop/docs/plans/2026-10-27-chat-layer-extraction.md) 与 [聊天层词表](../../../ALwith/alwith-desktop/docs/decisions/2026-10-27-chat-naming.md)（本机路径，仓库私有）。第一段 client 的结果：

| 仓 | 改动 | 验证 |
| --- | --- | --- |
| alwith-api | 新入口 `@alwith/api/client`：SessionClient（hold 的 attach、adopt、start 顺序，sessions 与运行态，open 回放，prompt 回执，cancel、respond、setConfig、close、stop、delete、fork、session/list）、UpdateScheduler（从 module-chat 搬来）、无 React 的 store | 19 个客户端测试，全套 202 通过；类型检查、构建通过 |
| codex-acp-v2 | `@nyssance/codex-acp-v2/client` 从只有 CodexCapabilitiesClient 变成 CodexClient = SessionClient 加 `_codex/*`：全量列表、归档、历史分页与导航、导出、技能、插件、限额、文件搜索、重试、预测、分叉血缘、实时语音；U 的 codex-extensions、history-*、activity-preview 原样搬入 | 37 个 client 测试，全套 1964 通过；本地仓从 0.7.30 快进到 origin/main 0.7.37（本地的依赖升级改动存成 stash@{0}，未跟踪的 bun.lock 挪到会话 scratchpad） |
| alwith-u | agent/client.ts 从 1935 行变成 330 行的产品子类（双聊天位草稿、模型记忆、分叉标题、按项目分组）；删除 codex-extensions、history-page、history-navigation、history、activity-preview、run-state-source 及其测试；77 文件，+504／−3725 | `bun check` 无类型错误；vitest 1511／1511 通过 |
| alwith-tv | agent/codex/client.ts 从 712 行变成 190 行的子类（SessionSetup、画布工具回调）；5 文件，+115／−637 | 类型检查通过；vitest 3154／3155，唯一失败 docsNavigation 的文档数量 163≠164 在改动前就失败 |
| workbonny | App.tsx 自己写的连接、store、请求簿全部删掉，换成 `client.ts` 的一个 CodexClient 实例加两个 hook；导航列出 `sessionList`，新对话、切换会话走 newSession／open | 自动驾驶双会话：A 提问含 `ls ~`、B 提问、重开 A；`[sessions]` 转储列表 36 条（两条新会话在最前），`[dom]` 转储 A 重开后 1 轮含命令输出；无渲染错误 |

未做：三个 ALwith 仓的改动未提交（等用户看过再提）；api 与 adapter 未发布，三个应用和本仓暂用 `link:`（G15）；module-chat 的 update-scheduler 入口还在（下一段改成转发 api）。
