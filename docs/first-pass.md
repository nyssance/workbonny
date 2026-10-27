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
