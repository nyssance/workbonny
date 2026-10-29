# workbonny

本仓是"客户 WorkBuddy"的实例，用来验收 ALwith 平台"人人都能一小时做出自己的 WorkBuddy"的承诺，并产出 create-alwith。目标与规则见 [plan](docs/plans/2026-10-27-own-workbuddy.md)，拍板理由见 [decisions](docs/decisions/index.md)。

## 硬约束（违反即验收失败）

- 开发、联调和验收使用本地候选包，不以发布作为调试前提。全部实现完成、质量与兼容性验证通过、达到最终交付标准后，再统一发布；禁止边改边发、为继续调试而发包或反复发布。本地候选依赖留在隔离验证环境，不混入正式依赖与锁文件。
- 调试桌面应用和验证界面时，尽量优先使用 Hasgard，直接检查运行中应用的快照、元素、交互与日志；Hasgard 不可用或不适合当前问题时再用其他工具。
- 无绝对必要，禁止任何重试设计，包括自动重试、退避重试、后台重试及专门的重试流程。不得仅以“健壮性”“容错”或“最佳实践”为由引入；失败应明确报错，不擅自重复执行。确有绝对必要时，必须先说明具体原因与适用范围。
- 禁止依赖维护者工作区或 ALwith 私有源码。允许 Cargo `path` 指向 `node_modules/@alwith/*/rust` 这类公开 npm 发行物内的 Rust 源码，但解析结果必须留在公开发行物内。
- `@alwith/*` 用 `^`，实际版本由 bun.lock 锁定；不用 link、file、workspace。
- 遇到上游缺口：记 `docs/gaps.md`，打 `patches/` 或记账复制，不在本仓修。patch 文件名带缺口编号。
- Codex 经 Runtime 托管（`@nyssance/codex-acp-v2`），不自己 spawn Codex，不另建会话库。
- 品牌只在 `alwith.app.json` 定义一次，手写源文件不得重复定义。
- 本轮默认交付地图：壳走 create-alwith 模板，页面走 `@alwith` registry block，能力走 `@alwith/module-*`，ACP 协议与会话投影走 `@nyssance/codex-acp-v2`，`@alwith/api` 只做 Runtime 公共封装。不新增独立交付机制；容不下的需求先说明所有权、生命周期、升级路径再评审。
- 好东西回 U 的路径永远是"先进包，U 再装"，不直接搬代码到 U。
- create 流程的验收终点是生成项目能在用户自己的电脑上编译并独立运行。不要求 U 托管预览、云端构建、证书购买或托管、签名公证、下载安装；这些不是本轮交付前提。见 [本地编译运行决策](docs/decisions/2026-10-29-local-build-endpoint.md)。

## 阅读顺序

1. [plan](docs/plans/2026-10-27-own-workbuddy.md)：要回答的问题、对标、交付地图、步骤、测量协议、验收。
2. [decisions](docs/decisions/index.md)：已拍板的事，不再重复讨论。
3. ALwith 侧的上位文档在 alwith-desktop 仓：`docs/decisions/2026-09-14-workbuddy.md`、`docs/plans/2026-09-15-u-workbuddy.md`、`docs/decisions/2026-09-15-naming.md`。

文档规矩同 alwith-desktop 的 `docs/docs-guide.md`：规格、决策、规划三分；plan 做完并入规格后删除；决策写完不改，补充或推翻就新写一篇引用旧篇。

## Test Runtime isolation

Scripts that start Runtime/engine sessions, including temporary probes, must use
`startTestRuntime` from `@alwith/api/node`. Never use the real Codex home as test
state. Default tests use mocks; only an explicitly authorized live test supplies
`authFrom` to copy auth.json into the helper's temporary home. Use `await using`
or await `dispose()` in `finally`. Existing server protocol fixtures that already
create isolated homes remain valid; they must never fall back to the real home.

## Act on corrections

- When the user points out an omission or a mismatch with an agreed requirement, fix it in the current task. Do not stop at apologizing, explaining, or promising a later change.
- A design or mockup is not an implementation. Apply accepted UI decisions to the actual running application and verify them before claiming completion.
