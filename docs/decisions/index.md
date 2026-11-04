# 决策记录

"当时为什么这么选"，按日期存，写完不改；推翻就新写一篇引用旧篇。规矩同 alwith-desktop 的 `docs/docs-guide.md`。

| 日期 | 主题 |
| --- | --- |
| 2026-11-03 | [本地图片展厅以完整开源模块交付](2026-11-03-open-source-gallery.md) —— Rust 与前端完整公开，不新增 extension API |
| 2026-10-29 | [创建时选择账号能力](2026-10-29-optional-account.md) —— 账号默认含 Vibemon；不集成账号仍保留不依赖账号的基础能力 |
| 2026-10-29 | [create 的终点是用户本机编译并运行](2026-10-29-local-build-endpoint.md) —— 替代强制安装和零工具链云端交付要求 |
| 2026-10-27 | [workbonny 是新仓，不 fork ALwith U](2026-10-27-new-repo-not-fork.md) |
| 2026-10-27 | [create-alwith 只发 npm，TS 跑在 Bun 上，不发 crates.io](2026-10-27-create-alwith-npm-only.md) |
| 2026-10-27 | [create-alwith 是引擎，ALwith U 是普通用户的入口](2026-10-27-create-alwith-inside-u.md) —— 入口保留；托管责任已由 10-29 决策收窄 |
| 2026-10-27 | [一小时的终点是安装自己的产物，不是 U 内预览](2026-10-27-acceptance-endpoint-installed-app.md) —— 历史：强制安装与云端交付要求已由 10-29 本地编译运行决策替代 |
| 2026-10-27 | [评审后的补充：Bun 前提、U 内置资源闭包、Desktop 抽包推迟、四类不是上限](2026-10-27-review-amendments.md) —— 补充并部分取代同日两篇 create-alwith 决策的论证 |
| 2026-10-28 | [随聊固定在 `~/Documents/ALwith`，不给应用改](2026-10-28-quick-chats-alwith.md) |
| 2026-10-28 | [默认成品壳与可替换页面，应用只接线](2026-10-28-default-shell-and-replaceable-pages.md) —— 补充并部分取代随聊决策 |

当前执行口径见[总计划](../plans/2026-10-27-own-workbuddy.md)与 [AGENTS.md](../../AGENTS.md)。决策正文保持原样；旧文中的云端交付、强制安装和排除 Vibemon 等条款按后续决策执行，不恢复为待办。

- [2026-11-03 Gallery 由 WorkBonny 仓内 module 维护](2026-11-03-gallery-owned-by-workbonny.md)：修正 Gallery 归属，保留将来整体拆出的模块边界。
