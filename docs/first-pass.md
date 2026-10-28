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

发布（同日稍后）：`@alwith/api` 0.4.22 经 ALwith-ai 的 CI 发出（私有仓的 Actions 因账单失败，临时改公开、发完改回私有）；`@nyssance/codex-acp-v2` 0.7.38 发出后发现把 api 标成了可选 peer，0.7.39 改回普通 peer。三个应用和本仓已切回精确版本，G15 关闭。U、TV 内部的 thread 命名随后全部改成 session 与 timeline，无别名；仍叫 thread 的只剩 module-chat 自己的 DOM 钩子与导出名，归包，第 2 段随包改。module-chat 随后同样改名并发布：`data-codex-timeline`、`timeline-user-message-navigation-*`、`TimelineUserMessageNavigation*`、`timeline-virtualizer`，删除 `update-scheduler` 入口。`@alwith/*` 从此共用一条版本线，api 与 module-chat 同为 0.5.1；本仓依赖 `^0.5.1` 的 api 与 module-chat、`^0.7.39` 的 adapter，实际版本在 bun.lock。未做：U、TV 两仓的改动未提交。

## 第三段：把 U 的会话时间线抽进包（2026-10-27 19:20–21:45）

聊天层抽取的第 2 段 session-timeline。U 的轮次分组、历史占位、重试、改动文件、异步提问、图片生成、定位栏、跟随与锚定滚动搬进 `@alwith/module-chat/session-timeline`，导出 `SessionTimeline` 与 `TimelineProvider`；应用只给 client、host 能力（主题、工具块改写、存文件、看 diff、文件图标、报错）、产品 slot 和滚动容器。

| 仓 | 改动 | 验证 |
| --- | --- | --- |
| alwith-modules | module-chat 0.5.2：新入口 session-timeline、turns、timeline-registry、resource-content；codex-acp-v2 是可选 peer；README 补 Vite 配置（G11）。46 文件，+6299 | 255 个测试（39 文件）、类型、构建通过；经 CI 发布 |
| alwith-api | 0.5.2，与 module-chat 同版本线，无代码改动 | 经 CI 发布 |
| alwith-u | features/chat 换成 112 行的包装（Pane 滚动容器、分叉分隔线与分叉按钮走 slot、导航音效）；删除 turns、history-timeline、滚动、定位栏、assistant-turn 等实现与测试；features/chat 67 文件，+253／−5402 | 类型检查干净；vitest 1411／1411 |
| alwith-tv | 包装 55 行（`anchorNewTurn`、`insert`、自己的用户消息、工作流任务走 `turnFooter`），画布工具块改写进 host；TV 由此拿到 U 的完整回合行为（重试、改动文件等）；agent/chat 等 16 文件，+100／−1201 | `bun run check` 通过；agent 与 shell 282／282，全量 3153／3154，唯一失败仍是改动前就有的 docsNavigation |
| workbonny | App.tsx 手写的轮次渲染换成一行 `<SessionTimeline>`，删除 chat/projection.ts、chat/turn-boundary.tsx；导航的 thread 命名改成 session；src +28／−156，App.tsx 255 行 | 类型、独立性检查、构建通过；自动驾驶双会话，`[dom]`："用一句话介绍你自己… 21:18 已处理 已运行 ls ~，共有 17 个条目（不含隐藏文件）。 21:18"；截图核对用户气泡、已处理折叠、行内代码、复制与时间戳 |

接入时踩到一次白屏：exclude module-chat 后，Base UI 组件嵌套的 CJS `use-sync-external-store/shim` 没被预打包，WebKit 报 "Importing binding name 'useSyncExternalStore' is not found"。U 早在 vite.config 里 include 了 shim，本仓照抄并记进 G11；0.5.2 的 README 已写明，模板待做。三个应用都改成 `^0.5.2`，删掉本地验证用的覆盖后从 registry 重装，三端复验同上。

## 第四段：把 U 的对话区与会话列表抽进包（2026-10-27 21:45–22:30）

聊天层抽取的第 3、4 段。U 的对话区（输入框、草稿、审批与表单、diff 弹窗、模型与权限菜单、用量）搬进 `@alwith/module-chat/conversation`，侧栏会话列表搬进 `@alwith/module-chat/session-list`。U 的同事被这一段挡着，本仓接入 conversation 不急，这次只升级版本并复验。

| 仓 | 改动 | 验证 |
| --- | --- | --- |
| alwith-modules | module-chat 0.5.3：新入口 conversation、session-list、session-list.css；README 补两节。73 文件，+7387 | 361 个测试、类型、lint、构建通过；经 CI 发布 |
| alwith-api | 0.5.3，同版本线，无代码改动 | 经 CI 发布 |
| alwith-u | 聊天区剩 chat-view、composer（语音、原生拖放、模型目录、预测偏好）、chat-host、action-card 四个包装，共 355 行；侧栏换成包装；`thread` 命名清完 | 类型干净；vitest 1319／1319 |
| alwith-tv | 审批卡、模型与权限菜单换成包组件，画布操作标题经 host 注入；删 action-card、pickers 与 23 条不用的文案 | `bun run check` 通过；全量只剩改动前就失败的 docsNavigation |
| workbonny | `@alwith/module-chat`、`@alwith/api` 升到 `^0.5.3` | 类型、独立性检查、构建通过 |

## 第五段：本仓接入 conversation 与 session-list，接 Hasgard（2026-10-27 22:35–23:05）

App 的手写时间线、审批列表与输入框换成 `ConversationView`（输入框、审批卡、模型与权限菜单、用量都随包来），导航列的手写会话列表换成 `SessionList`。应用代码（App、chat-host、layout、client、runtime、i18n）共 351 行，其中 App 125 行。

接 `tauri-plugin-hasgard` 0.6.1（`hasgard-testing` 特性，`bun run dev:tauri`）。之前用 cmux 截屏按坐标操作，按键落到了权限菜单上，把一个测试会话误切成完全访问，后经 Hasgard 改回"帮我批准"。Hasgard 直连 WKWebView 之后，以下都在真实应用里走通：

- 两个会话的完整回合与切换回放（自动驾驶时期）；侧栏按项目分组、运行中的圆点与停止按钮。
- 审批：切到"请求批准"，发 `curl -sI https://example.com`，审批卡内联出现三个选项，点"Yes, proceed"后回合完成，回答 200 OK。
- 历史：重启应用后点开旧会话，标题与两轮回合完整回放。
- 新对话：草稿态显示包的欢迎语。

新缺口：G17（会话列表的两个 CSS 变量由宿主定义）、G18（快速对话目录写死）。G11 补充：module-chat 的 patch 视图引 `diff2html/lib/types`（CommonJS），Vite 要预打包 `diff2html` 与该子路径，README 没写；U 的配置早已列出。开发探针 `VITE_AUTOPROMPT` 删除，诊断改用 Hasgard。

顺带修了本仓自己的漏：前端用 `@tauri-apps/plugin-opener` 打开链接，Rust 侧一直没注册插件，现补上 `tauri-plugin-opener` 与 `opener:default`。

未做：登录（module-auth，G4）。

## 第六段：平台登录，记账复制（2026-10-28）

用户选择记账复制（另两个选项是先进包、暂不接）。U 的登录分散在应用代码里：传输与刷新接线、单窗口化的认证状态、登录页、StorePort、Tauri 侧命名存储命令、加载闭源 `@alwith/native-auth` 的 Rust。全部照搬，文件头注明出处，台账记为 G19。新增依赖都是公开发行物：`@alwith/native-auth`、`@alwith/native-kit`（Cargo `path` 指向其 `rust/`）、crates.io 的 `alwith-module-store`、`tauri-plugin-http`、`tauri-plugin-os`；表单组件用 shadcn CLI 加（alert、field、input、spinner、tabs）。

结果：应用启动先过登录页，登录后才连 Runtime；导航列底部显示账号邮箱与退出按钮。主题处理挪到应用最外层，登录页也跟随系统外观。复制进来的登录代码约 530 行，应用自己的代码约 380 行。

实际登录由用户本人在开发版（api-dev）完成。之后经 Hasgard 验证：导航列显示账号邮箱，登录后发消息 Codex 正常回复；重启应用不再出现登录页，直接连上 Runtime，登录态存在 `~/Library/Application Support/work.bonny.desktop/auth.api-dev.alwith.ai.json`（另有 `.bak`）。退出按钮未测，测了要重新登录。

随聊：用户拍板随聊固定在 `~/Documents/ALwith`、包不给改（见 decisions），G18 关闭。本仓新对话改开在该目录，经 Hasgard 验证新对话的 `pwd` 是 `/Users/ny/Documents/ALwith`，侧栏把它放进随聊组。
