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
