# 第一遍：发现（执行日志）

按 plan"步骤"第一遍执行。只记事实和耗时，不修上游。

## 计时

| 阶段 | 开始 | 结束 | 耗时 | 备注 |
| --- | --- | --- | --- | --- |
| 读公开包文档与 U 参考，记 G1–G9 | 15:10 | 15:05 后约 25 分钟 | ~25 min | 只读 npm 包、crates.io、U 公开仓；发现 alwith-api 仓私有 |
| 手搭最小工程（配置、Rust relay、stage、图标、UI） | ~15:35 | 15:26 | ~50 min | bun install 冷缓存 160 s；cargo check 首次 20 s（本机有 cargo 缓存，干净机器会远长于此） |
| 首次 `bun tauri dev` | 15:26 | 待记 | 待记 | 编译 Tauri 3 alpha 全量依赖 |
