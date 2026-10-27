# workbonny

本仓是"客户 WorkBuddy"的实例，用来验收 ALwith 平台"人人都能一小时做出自己的 WorkBuddy"的承诺，并产出 create-alwith。目标与规则见 [plan](docs/plans/2026-10-27-own-workbuddy.md)，拍板理由见 [decisions](docs/decisions/index.md)。

## 硬约束（违反即验收失败）

- 禁止依赖维护者工作区或 ALwith 私有源码。允许 Cargo `path` 指向 `node_modules/@alwith/*/rust` 这类公开 npm 发行物内的 Rust 源码，但解析结果必须留在公开发行物内。
- `@alwith/*` 用精确版本，不用 `^`。
- 遇到上游缺口：记 `docs/gaps.md`，打 `patches/` 或记账复制，不在本仓修。patch 文件名带缺口编号。
- Codex 经 Runtime 托管（`@nyssance/codex-acp-v2`），不自己 spawn Codex，不另建会话库。
- 品牌只在 `alwith.app.json` 定义一次，手写源文件不得重复定义。
- 本轮默认交付地图：壳走 create-alwith 模板，页面走 `@alwith` registry block，能力走 `@alwith/module-*`，协议与会话投影走 `@alwith/api`。不新增独立交付机制；容不下的需求先说明所有权、生命周期、升级路径再评审。
- 好东西回 U 的路径永远是"先进包，U 再装"，不直接搬代码到 U。
- 验收终点是安装自己的产物并退出 U 后独立运行，U 内预览只算阶段验收。

## 阅读顺序

1. [plan](docs/plans/2026-10-27-own-workbuddy.md)：要回答的问题、对标、交付地图、步骤、测量协议、验收。
2. [decisions](docs/decisions/index.md)：已拍板的事，不再重复讨论。
3. ALwith 侧的上位文档在 alwith-desktop 仓：`docs/decisions/2026-09-14-workbuddy.md`、`docs/plans/2026-09-15-u-workbuddy.md`、`docs/decisions/2026-09-15-naming.md`。

文档规矩同 alwith-desktop 的 `docs/docs-guide.md`：规格、决策、规划三分；plan 做完并入规格后删除；决策写完不改，补充或推翻就新写一篇引用旧篇。
