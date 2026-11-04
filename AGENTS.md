# workbonny

本仓是"客户 WorkBuddy"的实例，用来验收 ALwith 平台"人人都能一小时做出自己的 WorkBuddy"的承诺，并产出 create-alwith。目标与规则见 [plan](docs/plans/2026-10-27-own-workbuddy.md)，拍板理由见 [decisions](docs/decisions/index.md)。

## 硬约束（违反即验收失败）

- 开发、联调和验收使用本地候选包，不以发布作为调试前提。全部实现完成、质量与兼容性验证通过、达到最终交付标准后，再统一发布；禁止边改边发、为继续调试而发包或反复发布。本地候选依赖留在隔离验证环境，不混入正式依赖与锁文件。
- 禁止消耗 CI 额度：不得推送任何分支或标签到远端去触发 CI，不得用 CI 发包，不得为了看一眼构建结果而推送。验证全部在本地完成（本地测试、本地构建、本地 tarball、Hasgard 实机）。发布只在用户明确下令后在本地执行（`bun publish`），推送同样只在用户明确下令后进行。违反即验收失败。
- 调试桌面应用和验证界面时，尽量优先使用 Hasgard，直接检查运行中应用的快照、元素、交互与日志；Hasgard 不可用或不适合当前问题时再用其他工具。
- 无绝对必要，禁止任何重试设计，包括自动重试、退避重试、后台重试及专门的重试流程。不得仅以“健壮性”“容错”或“最佳实践”为由引入；失败应明确报错，不擅自重复执行。确有绝对必要时，必须先说明具体原因与适用范围。
- 禁止依赖维护者工作区或 ALwith 私有源码。正式 Cargo 依赖只用公开 registry 的版本范围（如 `alwith-<module> = "0.5"`）。调试时允许用 `path` 或 `[patch.crates-io]` 指向本地候选，但只放在未提交的本地配置或隔离验证环境里，不得进入提交的清单和锁文件。
- `@alwith/*` 用 `^`，实际版本由 bun.lock 锁定；不用 link、file、workspace。
- 遇到上游缺口：记 `docs/gaps.md`，打 `patches/` 或记账复制，不在本仓修。patch 文件名带缺口编号。
- Codex 经 Runtime 托管（`@nyssance/codex-acp-v2`），不自己 spawn Codex，不另建会话库。
- 品牌只在 `alwith.app.json` 定义一次，手写源文件不得重复定义。
- 本轮默认交付地图：壳走 create-alwith 模板，页面走 `@alwith` registry block，能力走 `@alwith/module-*`，ACP 协议与会话投影走 `@nyssance/codex-acp-v2`，`@alwith/api` 只做 Runtime 公共封装。不新增独立交付机制；容不下的需求先说明所有权、生命周期、升级路径再评审。
- 好东西回 U 的路径永远是"先进包，U 再装"，不直接搬代码到 U。
- create 流程的验收终点是生成项目能在用户自己的电脑上编译并独立运行。不要求 U 托管预览、云端构建、证书购买或托管、签名公证、下载安装；这些不是本轮交付前提。见 [本地编译运行决策](docs/decisions/2026-10-29-local-build-endpoint.md)。

## 优先级

- create 功能（create-alwith 生成器、U 的“创建 WorkBuddy”入口、生成项目的账号模式与预置锁文件）不重要且独立。不得因为它拖慢发包、依赖升级、模块修复等其他工作；其他工作先完成，create 相关事项排到最后单独处理。

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

- Do not end or pause authorized work with an apology, acknowledgment, explanation, or promise. Continue the investigation, implementation and verification until the requested work is complete; report concrete results and any actual blockers.

Preserve vendor-signed Codex and code-mode-host binaries byte-for-byte during staging and local installation, as ALwith U does. Never apply ad-hoc or --deep re-signing to them. Release signing belongs to the existing CI signing configuration. Verify with bun scripts/check-codex-signatures.ts after staging and against the built application.

## Initial template baseline

The first WorkBonny version is an unchanged consumer of the shared U presentation and create-alwith page blocks. Do not invent application-specific themes, spacing, radii or wrapper surfaces. Fix missing defaults in their shared owner and regenerate first; product-specific styling starts only when the user explicitly requests customization.

## Design reviews

For UI design reviews, accessibility audits and requested design improvements, read
`.design-rules/SKILL.md` and the relevant `.design-rules/references/` guidelines before
giving feedback. Apply them within this repository's shared-template boundary and
the user's compact-toolbar preferences; they do not authorize application-specific
overrides of shared defaults.

## Shared chat dependency boundary

Application code imports the client and session projections from `@alwith/module-chat/client`, import helpers from `@alwith/module-chat/import`, and adapter staging from `@alwith/module-chat/stage`. The shared chat package owns codex-acp; do not declare it directly or locate its files through the application's node_modules. The adapter still owns protocol implementation, and Runtime owns agent processes.

## 模板禁止自行覆盖（硬约束）

- 模板是帮助用户消费平台默认能力的接线层，不是另一套产品实现。禁止擅自覆盖、重做、简化、裁剪或隐藏上游默认界面与能力；不得以“最小模板”“先跑起来”为由留下缩水版本。
- 默认实现以 U 已有标准为准；先将标准实现完整抽取到对应共享模块或 registry block，再由模板原样接入。禁止在模板或 WorkBonny 内另写替代实现，禁止依赖 U 私有源码。
- 上游已有的项目选择与菜单、项目／活跃会话视图、设置分类与设置项、-1 屏扩展／插件／Skills 入口，以及菜单 hover、active、走马灯、间距、圆角等默认行为，均不得被模板自行覆盖或省略。
- 缺失能力、默认值或依赖必须回到所属上游模块补齐；模板只负责品牌配置、模块组合与必要接线。不得复制一份后在模板内维护，也不得用占位文案、不可用入口或简化页面冒充接入完成。
- 可选能力只按用户明确选择或已启用模块决定是否装配；不得擅自把应有的默认能力降级为可选或移除。只有用户明确要求产品定制时，才可整体替换相应页面；定制不得反向污染默认模板。
- 验收必须核对生成项目与共享标准的功能、入口和行为，不仅是编译通过。逐项检查实际入口可用；发现缺口继续回上游修复，禁止宣称“已完整接入”。

Dependency declarations must use version ranges, not exact patch pins. npm dependencies use a three-part caret range (`^major.minor.patch`, for example `^0.6.0`); Cargo uses a two-part compatible range (`"0.6"`). Lockfiles retain exact resolved versions. Prerelease identifiers must remain valid and platform-specific binary aliases must select the correct platform.

## 单分支工作方式

只允许在当前主目录的 `main` 分支工作。禁止创建额外分支或额外 Git worktree。已完成的工作必须整合回 main，不得留在候选分支。

## 默认组件依赖

共享 shell、create-alwith 模板与 WorkBonny 默认携带 `@nyssance/reui`，即使当前页面尚未使用也不移除。保留 ReUI 与 shadcn 的直接依赖、统一 ReUI Vite 插件、TypeScript 回退路径和 Tailwind 源码扫描。组件从包消费，不复制 ReUI 源码。来源：用户明确指示（2026-11-04）。
