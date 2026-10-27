# 2026-10-27 Codex（gpt-6-astra）评审记录

Claude 写稿，Codex 经 `codex exec` 评审，四轮达成一致。第二、三、四轮的 Claude 提问内嵌在各轮开头。

## 第一轮：Codex 评审

已完整阅读指定文档，并核对 U、TV、Desktop 源码及 U 已安装的公开包。未修改文件。

**第一轮结论：不建议按现稿直接实施。最大问题是验收终点被降低、零工具链交付依赖尚未证实、部分抽包任务建立在不准确的现状描述上。**

## 1. 反对

**R1．普通用户验收没有兑现“一小时做出独立 WorkBuddy”。**

- **原文位置：** [plan:18](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:18) 要求“五件事走通”；[plan:228](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:228) 推迟云端打包；[plan:245](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:245) 普通用户只验“能运行”。
- **为什么错：** 在 U 中预览一个前端，不能证明用户获得了可安装、可独立登录和使用的应用。当前范围即使全部完成，也无法通过开头承诺。
- **替代方案：** 普通用户与开发者使用同一个终点：安装自己的产物，完成登录、聊天、审批、历史，并退出 U 后再次打开验证。零工具链交付必须进入本轮关键路径；若本轮只交付预览，应明确叫阶段验收，不能宣布一小时目标达成。

**R2．“标准壳加前端资源在技术上成立”下结论过早，实施顺序也反了。**

- **原文位置：** [plan:148](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:148)：“Rust 侧……完全一样，只差品牌”；[plan:219](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:219) 按工作量排序，把托管运行排在抽包、模板之后。
- **为什么错：** 不写自定义 Rust，不等于原生依赖和 capabilities 相同；选装原生 module 就可能改变构建。现有 Tauri 工程也不是默认从外部目录加载可替换前端。真正决定一小时可行性的路线，反而最后才验证。
- **替代方案：** 第一遍先补一个限时技术验证：同一份生成项目，在 U 中运行，再产出自己的安装包。优先验证缓存依赖的云端正常构建；预编译通用壳只是待验证的优化，必须明确固定能力集合、资源装载方式、品牌处理和签名路径。三遍走可以保留，但第二遍按风险和依赖排序。

**R3．品牌唯一来源的门禁写成了不可能满足的文本规则。**

- **原文位置：** [plan:89](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:89)：“grep 品牌字符串只允许命中它”；[plan:260](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:260) 又把生成物实现放到后续。
- **为什么错：** `tauri.conf`、安装包元数据、生成的本地化文本都可能合法包含品牌。唯一来源不等于唯一出现位置。若连最小生成也不做，品牌配置又无法驱动真正的应用。
- **替代方案：** 本轮实现品牌字段和图标的最小生成。门禁检查“手写源文件不得重复定义品牌；生成物必须与配置一致”。使用两个不同品牌分别生成、构建、检查残留，比 grep 次数可靠。

**R4．“module 包拆两半”不能作为一刀切规则，更不能把协议投影搬错层。**

- **原文位置：** [plan:54](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:54)：“逻辑与协议投影留在 npm 包版本化”；[plan:252](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:252) 待决定哪些聊天核心“不让用户重写”。
- **为什么错：** 同包交付逻辑和组件，不代表消费者不能自定义页面。现有协议投影已经由 `@alwith/api` 的 `SessionStore` 承担，不能因为这次分层再建立一套。上游目标是“不要求用户重写”，不是“不允许用户替换”。
- **替代方案：** 按具体依赖拆：协议和会话投影留在 API；复杂聊天交互保留可组合组件；页面布局、导航、产品接线做 block。先证明一个完全不同布局能复用这些接口，再决定哪些现有代码需要移动。不预设新增两套包。

**R5．把四层规定成上限、把 registry 规定成唯一 UI 路径，超出了本轮默认方案的权限。**

- **原文位置：** [plan:40](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:40)“四层，也是上限”；[AGENTS.md](/Users/ny/Projects/nyssance/workbonny/AGENTS.md)“页面走 `@alwith` registry block”。
- **为什么错：** 黑盒描述可见性，包和 registry 描述交付方式，模板描述生成时机，它们并非严格互斥的架构层。shadcn 不能证明这个“四层上限”。如果把本仓默认路线提升为平台规则，还与上游“自己写 UI、不强制采用 shadcn”冲突。
- **替代方案：** 保留四类作为默认交付地图；本轮只保证 Tauri＋React＋registry 的快速路径。平台契约允许自行写页面、替换组件及通过协议采用其他 UI 技术，不要求本轮实现其他框架模板。

**R6．U 的逐文件漂移门禁，会把不同应用不该共享的部分也绑死。**

- **原文位置：** [plan:123](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:123)：“输出和 U 的壳文件按清单 diff，漂移即构建失败”。
- **为什么错：** U 的 relay、退出流程、窗口和资源装配已经包含产品行为。尚未定义配置输入、扩展点和规范化规则，就要求文件相等，会奖励“所有差异都塞回通用壳”，并阻塞合理的 U 改动。
- **替代方案：** 只对明确由生成器拥有的文件做确定性 diff；用户拥有的接线文件做接口兼容和运行测试。U 发版仍必须验证内置脚手架，但不要用源码完全相等代替消费者兼容性。

**R7．把宠物、移动端统一归为“可选能力”，改错了上游产品定义。**

- **原文位置：** [plan:269](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:269)：“不接……宠物、移动端；可选能力”。
- **为什么错：** [上游决策](/Users/ny/Projects/ALwith/alwith-desktop/docs/decisions/2026-09-14-workbuddy.md) 明确宠物权益随账号，移动端是统一平台供给；它们不同于可选 QA、Gamepad。当前可以不验，不能重新分类。
- **替代方案：** 改为“本轮只验桌面制作与交付；账号权益一致性、统一移动端另行验收”。同时保留其接入契约，不宣称本轮完成全部 WorkBuddy 平台目标。

## 2. 缺失

**M1．缺少“一小时”的可重复测量协议。**

[验收表](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:235) 没规定机器、网络、缓存、账号和模型条件。必须记录下载、登录、生成、依赖安装、定制、构建排队、安装各阶段耗时；不能暂停失败重试的计时。应由多名首次使用者独立完成，并报告完成率及耗时，不能用一次幸运成功证明普通用户目标。

**M2．缺少首次账号与模型开通路径。**

干净机器没有维护者的 CLI 登录、模型额度、平台 token。需要明确两种认证分别如何完成、需要用户预先拥有什么、费用由谁承担，以及登录失败如何恢复。真实模型对话的 CI smoke 也需要明确专用测试身份和额度，不能隐含复用个人凭据。

**M3．缺少 U 托管应用的运行与隔离契约。**

[工具链第一档](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:144) 只有一句“U 用自己的 Runtime 和 webview 托管”。至少必须定义：

- 每个 WorkBuddy 的身份、数据目录、登录态及 Runtime 连接归属。
- 哪些 IPC、文件路径和原生能力可调用。
- 预览重载、关闭项目、退出 U 时的进程和会话生命周期。
- 开发预览与独立安装包使用同一组接口和能力版本。

否则“复用 U”很容易变成共享 U 的凭据和全局权限，与上游应用独立登录、权限隔离冲突。

**M4．缺少真正体现“自己的 WorkBuddy”的业务验收。**

五件事只能证明通用聊天壳可用。应增加一个小而真实的定制任务：用户自然语言描述自己的页面和一种业务数据/工具操作，Agent 完成接入，用户修改一次需求，再验证结果、审批及重启后的状态。验收不能只改名字、颜色和首页文案。

**M5．缺少发布版本的完整闭包。**

精确指定 `@alwith/*` 版本还不够。需记录 create 版本、Bun、Rust、适配器、Runtime、原生包、registry 内容摘要，以及 Bun/Cargo 锁文件。尤其：

- 模板随 npm 包发布，不代表依赖安装和 block 获取离线可用。
- registry 若取可变的最新内容，同一个 create 版本仍可能生成不同项目。
- `--frozen-lockfile` 所用锁文件如何随 preset 生成，目前没有交代。

应提供随发行物冻结的首批 block 快照或不可变版本地址，并明确“离线”只承诺到哪一步。

**M6．缺少创建失败后的继续执行能力和机器可读接口。**

[命令面](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:62) 只有参数和下一步命令，不足以支撑 U 向导。需要阶段化进度、稳定错误码、结构化结果、取消处理、非空目录保护，以及依赖下载失败后继续，而不是删除目录重来。U 和 Agent 应调用同一接口，不能解析终端文案推测成功。

**M7．缺少发行物与门禁的完整依赖检查。**

[独立性机制](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:166) 只查两个 manifest 是否指向 ALwith 路径，漏掉安装脚本、环境变量、锁文件、Cargo patch、绝对路径和下载源。

应在无维护者配置、无私有凭据的环境，从发布 tarball 生成并构建；检查完整解析依赖及 staged artifacts 的来源。模板还应继承现有许可证和第三方 notices 的打包链，不能只复制二进制。

## 3. 该删

**D1．删掉本轮的画布型、综合型 preset。**

位置：[plan:94](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:94)。

目前首批 block 只有登录、设置、聊天、侧栏，没有定义画布和综合型的实际能力。三个名字不会增加验收价值，却扩大生成、构建和运行矩阵。本轮保留聊天型，以及在聊天型上完成真实业务定制。

**D2．删掉本轮同时给 Desktop 抽工具链安装包、项目托管包的要求。**

位置：[入口决策“边界”](/Users/ny/Projects/nyssance/workbonny/docs/decisions/2026-10-27-create-alwith-inside-u.md)。

普通用户关键路径既然是零本地工具链，Launchpad 安装抽包就不该挡住首个结果。先复用实际可复用的实现；等 U 的托管契约验证后，再让第二个消费者接入。无需提前承诺两个产品同时改造。

**D3．删掉互相矛盾的首轮 migrate 承诺。**

位置：[plan:31](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:31) 写“第一轮……三方合并”，命令面列出 `migrate`，但 [plan:228](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:228) 又推迟。

本轮保留生成器版本、文件所有权和来源记录即可。不提供尚未实现的公开命令，不建设三方合并引擎。文件哈希也不能代替未来三方合并所需的原始基线内容。

## 4. 事实核对

**F1．relay 两仓各一份：属实；“同一个 relay”只能描述来源，不能描述当前完全相同。**

证据：[TV runtime.rs:1](/Users/ny/Projects/ALwith/alwith-tv/src-tauri/src/runtime.rs:1)、[U runtime.rs:1](/Users/ny/Projects/ALwith/alwith-u/src-tauri/src/runtime.rs:1)。

TV 的确有该注释；但 U 已有初始化串行化、异步退出协调、computer/mobile 清理，TV 的关闭流程不同。两者已共同使用 `alwith_api::RuntimeClient`。应提取剩余通用 Tauri 桥接与生命周期机制，保留产品装配回调，不能整文件搬成公共实现。

**F2．`stage.ts` 各仓一份：属实；“stage 尚未抽包”的推论不准确。**

证据：

- [U stage.ts:20](/Users/ny/Projects/ALwith/alwith-u/scripts/stage.ts:20) 已导入多种 native staging，以及 `@alwith/runtime/stage`。
- [TV stage.ts:27](/Users/ny/Projects/ALwith/alwith-tv/scripts/stage.ts:27) 同样调用 `stageNative`、`stageRuntime`。
- [Desktop stage.ts:5](/Users/ny/Projects/ALwith/alwith-desktop/scripts/stage.ts:5) 是多个 staging 步骤的编排入口。

缺口是尚重复的 Bun/Codex/adapter 装配，以及应用级编排接口；不是从零抽出 Runtime staging。也不能把 Board 模块编译、U 专属 launcher 等全部塞进 `@alwith/runtime`。

**F3．“module-chat 逻辑界面一体，因此不能自定义 UI”：判断过度。**

证据：[已安装 module-chat 的 exports](/Users/ny/Projects/ALwith/alwith-u/node_modules/@alwith/module-chat/package.json:7) 已分别暴露 `update-scheduler`、虚拟列表、composer、审批等入口。

完整页面仍在 [U chat-view.tsx](/Users/ny/Projects/ALwith/alwith-u/src/features/chat/chat-view.tsx:1)；客户端装配在 [U agent/client.ts](/Users/ny/Projects/ALwith/alwith-u/src/agent/client.ts:30)，会话投影使用 API 的 `SessionStore`。

更准确的缺口是：**现有细粒度组件之外，还没有在本次检查中找到可直接交付给外部用户的完整页面 block 和充分解耦的页面接线契约。** “逻辑和 UI 同一个 npm 包”本身不是缺陷。

**F4．U 品牌硬编码：属实。**

证据：[tauri.conf.json:3](/Users/ny/Projects/ALwith/alwith-u/src-tauri/tauri.conf.json:3) 的产品名、identifier 和图标配置；[中文 locale:3](/Users/ny/Projects/ALwith/alwith-u/src/locales/zh-CN.json:3) 的名称、退出提示等；[i18n.ts:7](/Users/ny/Projects/ALwith/alwith-u/src/lib/i18n.ts:7) 的语言资源列表。

但应区分品牌文案和支持语言配置，不应把所有 locale 内容都当作需要消灭的硬编码。

**F5．“登录只能验到 api-dev”：错误；“Runtime 平台身份校验未实现”：本次只能部分核实。**

[auth/store.ts:23](/Users/ny/Projects/ALwith/alwith-u/src/features/auth/store.ts:23) 明确开发环境走 `api-dev`，生产环境走 `api`。不能把生产登录说成不存在；真实账号联调是否通过是另一项证据。

[U runtime.rs:218](/Users/ny/Projects/ALwith/alwith-u/src-tauri/src/runtime.rs:218) 的启动接线没有传入 ALwith 平台凭据；Auth 刷新独立走 [auth.rs](/Users/ny/Projects/ALwith/alwith-u/src-tauri/src/auth.rs:1)。这支持“当前应用接线未把平台登录接入 Runtime”，但**仅凭消费者源码不能证明闭源 Runtime 所有入口都未实施校验**。该全局结论目前来自上游文档，仍需 Runtime 实现审查或发行物契约测试。

**F6．“Windows 未验”：证据过旧，不能作当前绝对判断。**

[原生发行文档](/Users/ny/Projects/ALwith/alwith-u/docs/native-distribution.md) 记录的是 9 月的 macOS 隔离验证，而且仍描述旧的 `@alwith/native` 形态。

当前已有 [Windows staging CI](/Users/ny/Projects/ALwith/alwith-u/.github/workflows/ci.yml:60) 和 [Windows release 构建矩阵](/Users/ny/Projects/ALwith/alwith-u/.github/workflows/release.yml:33)。配置存在不等于运行成功，本次也没有拿到对应 CI 结果。应改为“Windows 验证结果待关联”，分别追踪 staging、构建、安装、真实 Auth 联调。

**F7．“标准壳加前端资源”不是现有 Tauri 工程的既得能力。**

U 当前 [tauri.conf.json:8](/Users/ny/Projects/ALwith/alwith-u/src-tauri/tauri.conf.json:8) 使用 `frontendDist: "../dist"`。本机 Tauri 3 的 [codegen/context.rs:185](/Users/ny/.cargo/registry/src/index.crates.io-1949cf8c6b5b557f/tauri-codegen-3.0.0-alpha.4/src/context.rs:185) 会把目录交给 `EmbeddedAssets::new`，前端参与代码生成；[官方配置说明](https://v2.tauri.app/reference/config/) 也明确本地目录资源被嵌入二进制。

所以“预编译一次，然后换资源即可”需要额外的资源装载设计，不能从“不写 Rust”直接推出。

**F8．README 缺少创建新应用入口：属实，而且 getting-started 已明显漂移。**

[README](/Users/ny/Projects/ALwith/alwith-u/README.md) 有 30 分钟文案，但工程操作仍是构建 U。[getting-started.md](/Users/ny/Projects/ALwith/alwith-u/getting-started.md) 写 macOS 13、Windows ARM64、Bun 1.4.2；README 写 macOS 26，当前 [package.json:8](/Users/ny/Projects/ALwith/alwith-u/package.json:8) 为 Bun 1.4.4，AGENTS 规定 Windows x64。

缺口不仅是增加入口，还要消除互相矛盾的环境要求。

**F9．公开 Rust 依赖不等于必须来自 crates.io；现稿需要澄清。**

[U AGENTS.md](/Users/ny/Projects/ALwith/alwith-u/AGENTS.md) 明确要求 Cargo 使用 npm 包中的 Rust SDK；[Cargo.toml:34](/Users/ny/Projects/ALwith/alwith-u/src-tauri/Cargo.toml:34) 实际为 `../node_modules/@alwith/api/rust`，多个能力也采用这种方式。

应明确允许“公开 npm 发行物内携带的 Rust 源码”。禁止的是依赖维护者工作区或私有源码，不是禁止所有 Cargo `path` 依赖。

**F10．`shadcn diff` 不宜直接写成长期升级契约。**

当前[官方 CLI 文档](https://ui.shadcn.com/docs/cli) 展示的是 `add --dry-run`、`add --diff` 等预览方式。plan 应固定采用的 CLI 版本并验证自定义 registry 的实际行为。无论命令叫什么，它都不能自动替代 block 的版本来源、兼容性说明和本地修改冲突处理。
## 第 2 轮


## 第 3 轮

codex
已完整重读六份文件。发现 **6 项落实偏差或未落实**；其余已达成的改动已落实，包括 R5 的替代写法和两篇补充决策。

## 1. 逐章节核对

**1．验收表仍把业务定制排除在计时终点之外。**

位置：[plan:259](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:259)、[plan:261](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:261)，另见 [plan:239](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:239)。

正文和新决策已包含业务定制，但验收表的“终点”只有安装与五件事，两项时限又只引用“终点”；开发者第三遍也漏了定制。

建议替换为：

> 终点：安装自己的产物，退出 U 后独立打开，完成登录、聊天、审批、历史验证，以及下述业务定制全部步骤，包括一次需求修改与重启后的状态验证。  
> 开发者时限：从执行 `bun create alwith` 开始，包含脚手架下载和首次认证，到上述全部终点完成，不超过一小时。  
> 普通用户时限：从开始下载 U 到上述全部终点完成，不超过一小时，报告完成率。

第三遍开发者条目同步引用这个完整终点。第 18 行“两类用户从下载开始”也应明确开发者是从执行创建命令、含其下载开始，避免起点歧义。

**2．托管契约和签名决策的时序仍自相矛盾。**

位置：[plan:222](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:222)、[plan:229](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:229)、[plan:267](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:267)。

第一遍已经签名、实现 U 预览，相关 decision 却到第二遍才写。“不阻塞第一遍”也扩大了此前约定；原约定是不阻塞调查和独立云端构建验证。

建议改为：

> 第一遍：云端构建验证前，确定本次验证所需的签名身份、凭据归属与运行边界；接入 U 托管预览前，完成托管运行契约 decision。托管契约不阻塞源码调查及独立云端构建验证。  
> 第二遍第 1 项：依据第一遍的验证结果，固化云端交付与 U 托管实现；涉及已拍板结论调整时另写补充决策。

**3．“模板等价”仍保留原来的原始文件 diff 规则。**

位置：[plan:235](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:235)、[plan:255](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:255)。

“只差 `alwith.app.json` 与业务页面”没有容纳合法的品牌生成物差异，也没有应用已经约定的文件所有权边界。

两处统一替换为：

> 使用本仓的 `alwith.app.json`、固定发行版本和相同生成输入重新生成项目。生成器拥有的文件应确定性一致；用户拥有的页面与接线按所有权清单排除原始文件相等要求，并通过接口兼容与运行验证。所有差异均须能归属于配置生成或用户定制。

**4．认证章节仍是“要求写清”，没有落实路径或明确落实节点。**

位置：[plan:143](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:143)。

目前仍写“写清：各自怎么完成……”，不是已确定流程。无需现在猜账号、费用，但要把它变成第一遍的明确交付物。

> 第一遍五件事验证前，形成可执行的首次认证说明：分别列出 ALwith 平台登录和默认 Codex／模型供应商认证入口、操作步骤、账号或订阅前提、费用承担方及失败恢复方式，并在干净机器验证。不得隐含复用维护者登录态。首次登录、授权和配置计入一小时。CI smoke 使用专用测试身份与额度。

**5．发布闭包没有落实锁文件的生成方案。**

位置：[plan:104](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:104)。

“写清 lockfile 如何随 preset 生成”仍是待办句，不能支撑后面的 `--frozen-lockfile` 和确定性生成门禁。

> 本轮聊天型 preset 随发行物提供经真实生成与构建验证的 Bun、Cargo 锁文件。生成器必须使输出 manifest 与锁文件一致；若名称或配置变化涉及锁文件中的项目元数据，应确定性处理并验证。依赖闭包发生变化时，不沿用不匹配的锁文件。模板 CI 使用生成项目中的锁文件进行冻结安装与锁定构建。

## 2. F1—F10 事实与证据边界核对

**6．staging 的“各仓”仍把 U／TV 的事实扩大到了 Desktop。**

位置：[plan:82](/Users/ny/Projects/nyssance/workbonny/docs/plans/2026-10-27-own-workbuddy.md:82)。

“各仓的 `scripts/stage.ts` 已调用 `@alwith/runtime/stage` 与 native staging”超出了之前核实的范围。Desktop 的入口是本仓多个 staging 步骤的编排，不能统一这么写。

> U 与 TV 的 `scripts/stage.ts` 已调用 `@alwith/runtime/stage` 与 native staging；Desktop 的 `scripts/stage.ts` 编排本仓多个 staging 步骤。需继续提取的是已确认重复的 Bun／Codex／adapter 装配及应用级编排接口，抽取范围以实际重复实现和消费者需求为准。

“已知缺口”一节的核对结果：

| 原编号 | 核对结果 |
|---|---|
| F1 relay | 第 209 行准确，保留了共用 SDK 与关闭流程不同的边界。 |
| F2 staging | 第 210 行准确；正文第 82 行的扩大表述按上面第 6 项修正。 |
| F3 module-chat | 第 211 行准确，保留“本次检查未找到”的证据边界。 |
| F4 品牌 | 第 208 行准确，已区分品牌与支持语言配置。 |
| F5 Auth／Runtime 身份 | 第 212 行准确，没有把消费者接线推断写成 Runtime 全局实现结论。 |
| F6 Windows | 第 213 行准确，已区分 CI 配置与成功证据。 |
| F7 通用壳 | 第 216 行准确，未再宣称可直接替换前端资源。 |
| F8 入门文档 | 第 214 行保留的缺口成立；具体对应关系仍是 README 与 getting-started 的 macOS 要求冲突、getting-started 与 AGENTS 的 Windows 架构冲突、getting-started 与 package.json 的 Bun 版本冲突。 |
| F9 npm 内 Rust 源码 | 已在第 171 行及 AGENTS 第 7 行落实，无须重复列为缺口。 |
| F10 shadcn | 已在第 98、271 行落实固定版本、实际行为验证及冲突处理边界，无须重复列为缺口。 |

不一致：共 6 项
已完整重读六份文件。发现 **6 项落实偏差或未落实**；其余已达成的改动已落实，包括 R5 的替代写法和两篇补充决策。

不一致：共 6 项


## 第 4 轮

codex
已完整重读该文件，六项均落实准确：

1. 起点与完整终点统一，业务定制、需求修改及重启验证计入一小时。
2. 签名与托管契约的前置时序已修正。
3. 模板等价两处均按文件所有权验证。
4. 首次认证说明已有明确交付节点与验证要求。
5. 锁文件方案已明确生成一致性、冻结安装与锁定构建。
6. staging 两处已区分 U／TV 与 Desktop；F8 已准确列明三组文档冲突。

一致：可以进入第一遍
已完整重读该文件，六项均落实准确：

一致：可以进入第一遍


