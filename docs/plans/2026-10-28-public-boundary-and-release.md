# 公开边界与三应用联合交付

日期：2026-10-28。状态：create-alwith 已在 ALwith-ai 独立公开；API 0.5.4 已发布，其他候选包继续按依赖顺序验证与发布。

## 本轮交付原则

用户要求尽量一次性做完，兼容 TV、U、Bonny，避免反复发布。先完成默认壳、auth/存储/Runtime 桥接、会话分组与默认页面的边界整改，形成固定的候选版本集合，三应用验证后再集中发布。每个受影响包原则上只发布一次；原生包、SDK、应用锁文件有依赖顺序，不声称 npm 多包发布是原子操作。

现有 shell 草稿 PR 继续用于审阅和 CI，不独立抢发。版本以最终候选集为准，遵守上游 @alwith 0.5.x 发行线规则；不得在本仓用 link/file/workspace 或维护者源码冒充公开发行物验收。

## 仓库公开边界

alwith-modules 是混合仓：packages 的 UI/客户端、公开 Rust SDK 与 crates 的私有实现、业务模块共存。现有 docs/npm-distribution.md 明确 whole mixed repository is not made public；用户最新决定先保持私有；下述公开候选仅留作后续审查，不执行仓库公开。create-alwith 仍按既定公开 npm 交付。

推荐按白名单形成可长期公开的源码集合，不为绕过 CI 付款问题临时公开整个混合仓再改私有。后续切回私有不能撤回外部已获得的副本。公开范围变化与许可证变化分开确认；本计划不修改现有许可证。

### 优先公开候选（非已批准公开清单）

- create-alwith 模板与 registry blocks：用户生成后本来就需要拥有和修改的页面源码。
- desktop-shell：原生窗口、菜单、默认样式与 Atlas 接线；Atlas 自身 G12 仍需独立处理。
- browser、editor、file-tree、chat 的通用展示组件：逐包核对资源与依赖后纳入。browser 当前 package.json 已标 Apache-2.0，但不据此推断整个混合仓已公开。
- 公共 ACP/Runtime 客户端契约、native-kit ABI 客户端，以及 scripts/native-sdk-files.json 白名单内的 Rust DTO/桥接源码。
- auth 的登录页、公共客户端和刷新/存储接线；store 的通用宿主接线。不能按目录整包判断：module-auth 当前还打包 pets 等内容，须逐入口拆清。

### 暂留私有、另行判断

- crates/native-* 的具体实现；公开其 ABI/SDK 不代表公开底层实现。
- Runtime 内部、QA、alwith-dev/alwith-services 业务实现、专有执行策略等。
- 商业资源、第三方素材、不能确认公开范围的历史文件。

公开源码集须在全新 checkout 中独立构建，白名单导出不携带原混合仓 git 历史、私有源码或凭证。是否建立独立公共仓以及具体名称，在白名单审查后确定；不增加新的运行时交付机制。

## 联合兼容性验收

| 项目 | U | TV | Bonny |
| --- | --- | --- | --- |
| 平台认证 | 当前 module-auth 0.5.4，现有登录与业务入口保留 | 仍用 0.1.14，验证升级适配 | 仍用 0.1.14，删除 G19 复制实现后验证 |
| 会话 | 项目/随聊/历史/归档完整 | 画板目录关联与历史完整 | 默认随聊及项目新建完整 |
| 壳 | 保留产品专属菜单与布局，公共机制改消费包 | 接公共壳，保留画板布局与行为 | 默认壳、透明、菜单、Atlas 开箱可用 |
| 生命周期 | 刷新、重连、关闭、重启 | 同左，含画板会话 | 同左，独立安装后验证 |
| 本轮平台 | macOS（Windows 暂缓） | macOS（Windows 暂缓） | macOS（Windows 暂缓） |

同时覆盖 Codex 与 alwith-cli 的公共协议接入；Codex projectId 不强加给其他引擎。默认页面允许整体替换，公共能力不能要求依赖默认 UI 才能工作。

## 当前阻塞与下一步

GitHub CI 当前因付款/额度问题不启动。公开基础源码可以改善长期协作与构建边界，但不能用整个混合仓临时曝光替代边界审查。先继续完成代码整改、候选包构建、三应用本地适配与验证；本轮保持私有仓构建，等待现有 CI 恢复。发布前复核权限、依赖闭包与包内容。

## 2026-10-28 候选落点

- alwith-modules 分支 `codex/default-desktop-shell`：`9c49d51`（同包 auth/store 原生桥接）、`347f2c1`（自定义菜单复用原生壳）、`74f8dd9`（状态菜单可访问名称）。
- alwith-api 分支 `codex/public-platform`：`bdfeae6`（公共状态订阅生命周期）。工作树 `/private/tmp/alwith-api-public-candidate`。
- U 和 TV 的消费候选分别位于 `/private/tmp/alwith-u-public-candidate`、`/private/tmp/alwith-tv-public-candidate`，使用隔离工作树；原应用工作区不覆盖。候选的本地 tarball overrides 和锁文件仅用于兼容验证，不能合入或发布。正式依赖版本和锁文件在统一发布后更新。
- Bonny 候选位于 `/private/tmp/workbonny-public-candidate`；本仓保留 G19/G20 消费补丁，当前源码仍通过类型检查和独立性检查。
- 本轮结果：U 77 条脚本 + 1,375 条应用测试、类型检查和原生编译通过；TV 12 条相关测试、类型检查和生产构建通过；API Runtime 29 条测试、auth/store 149 条、chat session-list 80 条、Rust store 6 条及 Clippy 通过。原生预览进程已停止。

这些证据只覆盖本轮实现。TV 公共壳完整接入、create-alwith 与默认页面、项目分组/ACP、测试 Runtime 隔离辅助函数，以及统一发布后的三应用安装验收仍待完成；CI 付款阻塞只影响发布，不能当作以上代码工作已完成的理由。

## API 与协议边界迁移（2026-10-28）

用户明确 API 不保留任何协议 metadata 字段或处理，不保留兼容转导出。候选已完成：

- API 删除 agent/session、协议 SessionClient 和 ACP 生命周期投影；只留下 Runtime 传输、运行状态观察、通用 store/scheduler。TypeScript、Rust 及构建产物无协议 metadata 字段，便捷会话方法也不再接受 metadata 参数。
- 原协议代码与 171 条测试移入 codex-acp 的 client/protocol，公共入口为 codex-acp 的 /client。保留原源码许可；不因搬入仓库而改成 Apache 许可。API 不依赖适配器，不做循环依赖。
- module-chat、U、TV、Bonny 候选的类型、值导入和动态导入一起迁移，API 的通用 store 与 Runtime 状态导入保留。
- 验证：适配器原测试 1,973 通过、1 跳过，迁入测试 171 通过；chat 374 通过；U 脚本 77 与应用 1,375 通过；TV 3,194 通过；三应用类型/生产构建通过；API Rust Clippy 与测试通过。
- 此迁移不等于 projectId 新协议功能已完成。没有发包，也没有将候选依赖或本地路径合入正式应用。

迁移提交：API `33215ed`，codex-acp `80e07c3`，module-chat `4757bb5`，U 候选 `dc0c742`，TV 候选 `89245a53`。适配器与模块工作树分别为 `/private/tmp/codex-acp-public-candidate` 和 `/private/tmp/alwith-modules-boundary-candidate`。所有提交仅本地保存；本轮没有推送、公开仓库或发布。消费者正式依赖和锁文件仍待统一发布后更新，临时 overrides 不进入提交。

## Windows 暂缓后的进展（2026-10-28）

按用户最新要求，本轮先完成非 Windows 工作；Windows 实机验收不作为这些工作的前置条件。

- API `456e2a7`：测试 Runtime 辅助函数，隔离 CODEX_HOME、托管配置与运行记录；显式授权的 live 测试才复制 auth.json。5 条 mock 测试、31 个断言通过。
- U `070ffc5`：live.ts 使用上述辅助函数，删除重复启动逻辑；本轮未运行 live.ts。
- desktop-shell `c7f7314`：同包增加 /native 入口，不依赖 Atlas 前端；无需另发一个包。
- TV `ba90c86e`：接入透明原生壳和菜单，新聊天路由到当前画板项目；没有新增左侧菜单。相关 11 条测试、类型检查、Rust 编译通过。
- 项目分组实现仍在 codex-acp 候选工作树，包含项目注册、分页目录、远程目录上下文及 ACP v1/v2 projectId；API 不承载协议 metadata。相关 139 条 mock 测试与默认 chat 327 条测试通过，完整回归尚未通过，不可作为发布完成证据。

以上提交均为本地候选，未推送或发布。create-alwith/默认页面、U 的随聊目录接入、三应用最终安装验收与统一发布仍未完成；Atlas G12 和 CI 状态仍需在发布前解决。

## 当前发布进展（2026-10-28）

- create-alwith：公开仓 https://github.com/ALwith-ai/create-alwith，AGPL-3.0-only。交互输入、非交互参数、JSON 事件、稳定错误码、取消清理、文件归属与内容摘要已实现；7 条生成测试通过，尚未发 npm。
- 项目名、显示名与 identifier 由用户输入；Rust 二进制使用合法包名，显示名允许空格。测试品牌的 macOS 应用已构建、安装到本机并打开默认登录页；此项使用候选 tarball，不等同于正式发行物安装验收，也未验证真实登录或聊天。
- API：0.5.4 已通过 Trusted Publishing 发布，npm 已可读取，源码仓已恢复私有；41 条 JS 测试通过、1 条真实进程测试跳过，9 条 Rust 测试与 Clippy 通过。
- 适配器：0.7.43 发布候选切换到正式 API 0.5.4；协议和项目职责均在此包。默认测试不启动真实 Codex，真实 app-server 测试单独手动运行。
- 模块候选：auth 0.5.5、store 0.5.0、chat 0.5.7、desktop-shell 0.5.0；分别 146、5、331、1 条测试通过，构建、分发检查和原生契约检查通过。正式锁文件仍待适配器和 Atlas 入库。
- Atlas：0.1.3 本地类型检查、19 条单元测试、23 条浏览器测试、18 条 Rust 测试和 Clippy 通过，npm 发布 CI 已触发，仍在等待 runner。

上面的最新状态替代前文的阶段性待办状态。剩余：其余 npm 版本落库、生成器与模板的正式锁文件、从公开发行物重新生成及安装验收、三应用正式消费更新、U 内置生成器与入口、云端交付和外部用户计时验收。Windows 实机验收继续暂缓。


## 2026-10-29 消费端复核

- 正式发行：API 0.5.4、codex-acp-v2 0.7.43、Atlas 0.1.3、auth 0.5.5、store 0.5.0；chat 0.5.9 已经 CI 上传，等待 npm 索引。0.5.8 漏掉 SessionStateMenu 公共导出，0.5.9 补回并把回归测试改为通过公共入口导入。
- U、TV 与 Bonny 候选均完成类型检查和生产构建。U 应用测试 1,427 条、脚本测试 84 条、Rust 测试 253 条通过，Clippy 与 knip 通过。当前 Bun 1.4.4 不提供 lint 子命令，ts7-lint 同样依赖它，因此 lint 未通过执行。
- TV 全量应用测试 3,196 条通过、1 条旧断言失败；为新增的 projectId: null 更新断言后，相关 12 条测试全部通过。类型、架构、知识、多语言检查通过；Rust Clippy 和 28 条测试通过。保留画布布局，不新增左侧菜单。
- Bonny 已删除重复 auth/store 宿主代码，接默认登录、设置、桌面壳与四色状态菜单；探针迁到 adapter 并通过 startTestRuntime 隔离。临时副本的类型、构建、独立性扫描及 Rust Clippy 通过。
- create-alwith 的 7 条生成测试、5 个 registry block 来源检查通过。
- desktop-shell 0.5.0 首次 npm 发布等待本人认证。三个应用的正式依赖安装、正式锁文件与最终安装验收仍未完成；候选 tarball 验证不计入正式发行物验收。原应用工作区的其他未提交改动保留。

本次没有运行真实模型会话；Windows 实机验证继续暂缓。


## 2026-10-29 正式发行物消费

- desktop-shell 0.5.0 已正式发布并可从 npm 正常解析；本批七个发行物的 tarball 均验证通过。
- U main `33f236d`、TV main `37f5b772` 已合入推送，原工作区安装正式锁定依赖。TV 原有 package.json、bun.lock、Cargo.lock 三份未提交依赖升级完整恢复，未混入本次提交。
- 三应用正式安装与生产构建通过；Bonny 独立性检查通过，已生成并安装 `/Applications/WorkBonny.app`，补齐本地 ad-hoc bundle 签名后严格签名验证通过。没有宣称签名公证或对外分发验收完成。
- API、modules 均已恢复私有；create-alwith 与 Atlas 保持公开。create-alwith 正式模板锁文件已生成，仍在完成最终生成安装验证和首次 npm 发布。
- 真实登录、模型会话、外部用户一小时计时与 Windows 实机验收未在本次执行。U 生成向导和云端交付仍属于原计划后续项，不包含在本次平台包与三应用依赖同步完成的声明中。


## 生成器正式模板验收

create-alwith main `bdb305e` 已包含正式 Bun/Cargo 锁文件；7 条生成测试和源码边界检查通过。全新 `Release Buddy` 品牌使用正式 npm 包完成生成、安装、类型检查、生产构建、独立性检查及 macOS app 构建；独立启动显示默认登录页和原生菜单，未登录或创建模型会话。Bonny 安装与此生成品牌验收为两项独立证据。首次 npm 上传继续执行中。

## 2026-10-29 创建入口与云端构建验证

- create-alwith 0.1.0 的首次 npm 上传已完成；之后按用户要求暂停新版本发布。
- U 新增 WorkBuddy 创建入口，使用随应用打包的公开 create-alwith 生成器；用户填写品牌、目录与 identifier，成功后进入对应项目聊天。生成失败直接显示错误，不自动重复执行，也不增加专门的重试流程。
- U main `1f68aa0` 已整合远端并行更新并推送。合并后类型检查、85 条脚本测试、1,436 条应用测试、255 条 Rust 测试、Clippy、knip 和生产构建通过；当前 Bun 缺少 lint 子命令，不能宣称 lint 通过。此项是代码交付，未发布新的 U 安装包。
- create-alwith main `5cd6340` 修复品牌改名后 Bun/Cargo 锁文件的根包信息，保留依赖锁定结果。8 条测试通过，生成品牌的 `cargo check --locked` 通过。该修复仅已推送源码，尚未发布到 npm；0.1.0 仍有改名后严格 Cargo 锁定构建的问题。
- [双品牌云端构建](https://github.com/ALwith-ai/create-alwith/actions/runs/40839262595)成功：Amber Buddy 与 Violet Buddy 均使用正式依赖完成 macOS ARM64 应用构建并上传产物。已下载 Violet Buddy，验证 identifier、ARM64 可执行文件与严格 ad-hoc 签名。未进行 Developer ID 签名或苹果公证。
- 此 CI 是生成器的云端构建验证，不等于已提供 U 内的云端交付服务。现有 U、Desktop、modules 与 API 中尚未找到桌面构建提交接口，已向用户询问服务所在仓库；接入需要该服务信息。
- AGENTS.md 已加入“无绝对必要，禁止任何重试设计”的硬约束。本次未运行真实模型会话；外部用户一小时验收和 Windows 实机验收仍未执行。
