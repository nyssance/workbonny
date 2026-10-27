# workbonny：用公开发行物从零做一个自己的 WorkBuddy，并产出 create-alwith

立项：2026-10-27。状态：立项，未实施。本仓就是那个 WorkBuddy，不在 ALwith 组织下。

执行标准沿用 alwith-desktop AGENTS.md："最高执行目标永远是全球最佳"。本稿经 Claude 与 Codex（gpt-6-astra）四轮评审达成一致，记录见 [评审记录](../reviews/2026-10-27-codex-review.md)，结论沉淀在两篇补充决策。

已拍板的决策见 [决策记录](../decisions/index.md)：新仓不 fork、create-alwith 只发 npm、create-alwith 是引擎而 U 是入口、一小时终点是安装产物、评审补充。本文不重复论证。

## 一页纸（给人看，细则在后面给 Agent）

- **目标**：下载 ALwith U，一小时内做出并装上自己的 WorkBuddy。
- **产出**：脚手架 create-alwith，内置进 U；workbonny 是它的第一个输出。
- **顺序**：先验云端构建能不能一小时出 .dmg；再从空目录手搭一个记坑；再把过程做成脚手架；最后让外人计时走一遍。
- **完成标准**：外人在干净电脑上，一小时内装上自己的 WorkBuddy，登录、聊天、审批、看历史都通，还改了一个自己的业务需求。
- **铁律**：不碰私有代码；坑回上游修；好东西先进包，U 再装。
- **不做**：画布型、宠物、手机端、改 U 的架构。

## 要回答的问题

ALwith 的 WorkBuddy 产品目标（alwith-desktop 仓 `docs/plans/2026-09-15-u-workbuddy.md`）有两条验收至今未完成：

| 对象 | 标准 |
| --- | --- |
| 开发者 | 外人只凭获授权的 CLI／适配器、Runtime、客户端、组件、ALwith U 参考和文档，做出能安装、登录、聊天、审批、看历史的独立 WorkBuddy，不依赖维护者私有源码或本机路径 |
| 普通用户 | 无编程基础的人只描述 UI 与业务、检查效果，即可指挥 Agent 完成同一流程，不用自己实现聊天、认证或移动端 |

**终点与时限：两类用户同一终点，一小时。** 终点是安装自己的产物、退出 U 后独立打开、五件事走通、完成一个小而真实的业务定制。一小时是墙钟时间：普通用户从开始下载 U 起算，开发者从执行 `bun create alwith` 起算（含脚手架下载），到上述全部完成；包含首次认证、定制、云端构建排队、下载与安装；失败重试不暂停计时。上游计划写的"一周"是 2026-09-15 的标准，2026-10-27 用户改为一小时，上游文档未改，进缺口台账。U 内预览只算阶段验收（见 [终点决策](../decisions/2026-10-27-acceptance-endpoint-installed-app.md)）。

2026-09-14 决策列的四个同级应用里，U、Board（TV）、Desktop 都有仓库，"客户 WorkBuddy"一直没有实例。workbonny 就是那个实例：维护者扮演外部开发者，按计划里的开场白（"阅读 ALwith 文档，参考 ALwith U，复用已有组件和能力，帮我做一个自己的 WorkBuddy"）指挥编程 Agent 从空目录做起。目的不是再做一个 U，是把文档、包和发行物的缺口逼出来，并把好的东西反哺上游。

这轮真正的产出是 **create-alwith**，workbonny 是它的第一个输出物。一小时的标准决定了结构：没有脚手架、没有可拷贝的页面、没有零工具链交付，一小时就是空话。

名字：WorkBuddy 是腾讯的产品名，不能当仓库名或品牌；workbonny 押同一个韵，避开商标。

## 对标：每个环节的参照与可验证的取舍

比较对象落到本轮可验证的行为，不以产品名代替证据。

| 环节 | 参照 | 取什么 | 明确差距或不取 |
| --- | --- | --- | --- |
| 脚手架命令 | create-tauri-app、create-vite、create-next-app | 模板随包发布不联网拉取；交互式与非交互式（全量 flag）两套，Agent 与 U 走非交互；机器可读进度与错误；结束打印下一步；默认无遥测 | create-tauri-app 多渠道发布，我们只发 npm |
| 生成项目的升级 | Angular `ng update`、Nx migrations、`tauri migrate`、shadcn `add --diff` | 本轮只记录生成器版本、文件所有权、来源与可恢复基线 | 三方合并与迁移脚本是后续项，本轮不提供 `migrate` 命令 |
| 原生壳不手改 | Expo prebuild | 本轮实现品牌字段与图标的最小生成；其余生成物只定边界 | Expo 的 config plugin 不在本轮 |
| 可拷贝的 UI | shadcn registry（namespaced registry、preset、`add --diff`／`--dry-run`） | 页面级 UI 是 block，拷走归用户；固定 shadcn CLI 版本，以实际行为为准 | 不自建商店、不自建 CLI；block 的版本来源与冲突处理另写 |
| 零工具链交付 | EAS Build、Capacitor Appflow | 带依赖缓存的云端构建出 installer 并签名，U 提交与取产物 | 预编译通用壳是待验证优化（见终点决策） |
| 应用内新建项目 | Xcode 向导、Android Studio、Unity Hub、Expo Orbit | U 的"新建 WorkBuddy"向导；创建完直接进 Agent 会话 | 无 |
| 给编程 Agent 的入口 | agents.md 约定、SKILL.md | 生成项目带 AGENTS.md；`alwith` skill 只写实际可运行的命令，含诊断、恢复、认证与交付步骤 | 无 |
| 模板不腐 | create-tauri-app 的 CI 真实构建；Angular、Nx 自举 | 模板 CI 真实生成并构建；U 的 CI 对生成器拥有的文件做确定性 diff；长期让 U 自己是模板输出 | 无 |
| 共享的东西只有一份 | Tauri 的 `tauri` crate 与 `@tauri-apps/api` | 变得勤的全进包，模板只接线 | 无 |

## 结构：本轮默认交付地图

四类是本轮默认交付方式，不是平台规则，也不是上限（见[评审补充](../decisions/2026-10-27-review-amendments.md)）。

| 类 | 内容 | 用户关系 | 变更怎么到用户 |
| --- | --- | --- | --- |
| 黑盒 | Runtime、`@alwith/api`、relay、stage | 从不碰 | 升版本 |
| 包 | 复杂聊天交互的可组合组件、各能力的逻辑半边；协议与会话投影留在 `@alwith/api` 的 SessionStore，不另建一层 | 用不改，但允许替换 | 升版本 |
| registry block | 页面布局、导航、产品接线：登录页、设置页、聊天页、侧栏 | 拷走就是自己的 | `shadcn add --diff` 预览，用户自己决定 |
| 模板 | `alwith.app.json`、tauri 配置、CI 工作流、AGENTS.md | 一次生成 | 本轮只记录版本与基线 |

规则：本轮采用这四类，不新增独立的交付机制；发现现有分类容不下的实际需求，先说明所有权、生命周期和升级路径，再评审是否调整。平台契约允许自写页面、替换组件、经协议用其他 UI 技术；本轮不做其他框架模板。

聊天组件与页面接线的划分**按具体依赖拆**，不是一刀切：先证明一个完全不同的布局能复用现有组件和接口，再决定哪些现有代码要移动。"不要求用户重写"不等于"不允许用户替换"。

## create-alwith

### 引擎与入口

独立 npm 包 `create-alwith`，TS 跑在 Bun 上，只发 npm（见决策与补充）。ALwith-ai 下独立公开仓。CLI 前提：安装兼容版本的 Bun，对外本轮只承诺经过测试的 `bun create alwith`。U 内置经验证、可由自带 Bun 执行的完整脚手架资源及其运行依赖，测试安装后路径与离线启动。

### 命令面

```
bun create alwith <dir> --name "..." --identifier com.example.x --preset chat --yes
```

- 模板随包发布，不从 GitHub 拉取；"离线"承诺到哪一步见"发布闭包"。
- 非交互模式所有参数都能从 flag 给出，缺一个就报错不猜。
- 机器可读接口：阶段化进度、稳定错误码、结构化结果、取消处理、非空目录保护、失败后续跑（不覆盖用户已改的文件，恢复时校验项目状态）。U 与 Agent 调同一接口，不解析终端文案推测成功。
- 结束打印下一步命令。无遥测。
- 本轮没有 `migrate`。

### 模板只负责接线，接的东西必须是包

抽包对象按核实后的现状：

| 现状 | 去处 |
| --- | --- |
| Runtime relay：U 与 TV 各一份 Rust，已共用 `alwith_api::RuntimeClient`，但 U 有初始化串行化、异步退出协调、computer／mobile 清理，TV 的关闭流程不同 | 提取通用 Tauri 桥接与生命周期机制，保留产品装配回调，不整文件搬成公共实现 |
| staging：U 与 TV 的 `scripts/stage.ts` 已调用 `@alwith/runtime/stage` 与 native staging；Desktop 的 `scripts/stage.ts` 编排本仓多个 staging 步骤 | 继续提取的是已确认重复的 Bun／Codex／adapter 装配及应用级编排接口，范围以实际重复实现和消费者需求为准，不预先规定全部进 `@alwith/runtime`，也不把 Board 模块编译、U 专属 launcher 塞进去 |

**布局以 Atlas 为基线。** 用户 2026-10-27 要求：和 Desktop、U 一样，壳的布局用 `@nyssance/atlas`（leading 屏、常驻导航列、workspace 的滑动轨道），这是模板的一部分，不是可选项；原生触控板插件 `atlas-tauri` 因许可证待定（见 G12）。

**成品必须好看。** 用户不接受丑的 UI，脚手架生成的第一眼就是成品水准：Tailwind、shadcn、`@alwith/module-chat` 的成品组件（composer、turn 列表、审批卡）、主题与字体一并装好，不留裸 HTML 占位页；该加的包和框架都加，以 U 的视觉为基线。这条是用户 2026-10-27 的明确要求。

模板本身只含：Tauri 壳与窗口入口、读 `alwith.app.json` 的品牌与图标生成（调 `tauri icon`）、精确版本的依赖清单、tauri3-specta 的 bindings 配置、i18n（en 与 zh-CN）与主题骨架、mac 与 win 的 CI 工作流、许可证与第三方 notice 的打包链、给用户的编程 Agent 看的 AGENTS.md。页面来自 preset 指定的 block。

AGENTS.md 最容易漏：用户是"指挥编程 Agent"做的，规则不随模板走，用户第一轮就会让 Agent 自己 spawn Codex。

### `alwith.app.json`

品牌与壳配置的唯一来源：名字、identifier（bundle id，用户填写，不自动生成）、图标源文件、支持语言、窗口默认尺寸、preset、启用的 module 列表、模板版本。随 create-alwith 发布 JSON Schema。

唯一来源不等于唯一出现位置：`tauri.conf`、安装包元数据、生成的本地化文本可以合法含品牌。门禁是：手写源文件不得重复定义品牌；生成物必须与配置一致；用两个不同品牌分别生成、构建、检查残留。品牌文案与支持语言配置分开，不把 locale 内容当成要消灭的硬编码。

### registry 与 preset

- components.json 里挂 `@alwith` 命名空间的 registry，block 就是商品。
- 本轮只有聊天型 preset。preset 机制保留，画布型与综合型不做。
- 固定 shadcn CLI 版本；以 `add --diff`／`--dry-run` 的实际行为为准，验证自定义 registry。
- 首批 block 随发行物冻结快照或不可变版本地址；同一个 create 版本必须生成同一个项目。
- alwith.dev 门户放目录和预览。

### 发布闭包

精确版本不够。随发行物记录：create 版本、Bun、Rust（实际构建环境含云端，不要求普通用户装）、适配器、Runtime、原生包、registry 内容摘要、Bun 与 Cargo 锁文件。锁文件方案：本轮聊天型 preset 随发行物提供经真实生成与构建验证的 Bun、Cargo 锁文件；生成器必须使输出 manifest 与锁文件一致，名称或配置变化涉及锁文件中的项目元数据时确定性处理并验证；依赖闭包变化时不沿用不匹配的锁文件；模板 CI 使用生成项目中的锁文件做冻结安装与锁定构建。"离线"只承诺到模板展开，依赖安装与 block 获取需要网络，除非另行提供缓存。

### 同步：U 在不停更新，模板怎么跟

同步的需求本身是信号：壳有两份才需要同步。目标是让"必须同步的东西"趋近于零。

| 类 | 同步方式 |
| --- | --- |
| 包 | 升版本即同步，模板不动。U 的日常更新绝大多数在这层 |
| 生成物 | 从 `alwith.app.json` 加依赖版本生成，用户不手改，升级即重生成。本轮只做品牌与图标 |
| registry block | 拷走归用户，`add --diff` 看上游改了什么 |
| 模板文件 | 生成时落 `.alwith/template.json`：生成器版本、每个文件的所有权（生成器拥有／用户拥有）、来源与内容摘要；原始基线随项目保存或凭摘要从不可变发行物恢复 |

### 源头与方向：先从 U 提取，稳定后翻转

无论哪个方向都绕不开的第一步：在 U 里定壳边界清单，并把 U 的品牌抽成 `alwith.app.json`。

| 阶段 | 方向 | 为什么 |
| --- | --- | --- |
| 起步 | 从 U 提取：脚本按清单抽取并把品牌换成占位符 | 摩擦最低，U 的节奏不变 |
| 模板稳定后 | 翻转为 U 消费模板：U 是 `bun create alwith` 的输出加 U 的页面 | U 的 AGENTS.md 已定共享的东西抽成包禁止复制 |

### 防止模板腐烂

1. **模板 CI 真实构建**：对 preset 真实生成一个项目并完整构建（`bun install --frozen-lockfile`、`bun tauri build`、起一轮对话的 smoke，用专用测试身份与额度）。生成不出能构建的项目，模板不能发版。
2. **U 的 CI 守漂移**：只对生成器拥有的文件做确定性 diff；用户拥有的接线文件做接口兼容与运行测试。不要求源码完全相等，不把 U 的产品行为塞回通用壳。
3. **U 的发版带着模板**：U 的发版 CI 从内置模板生成并构建一次。
4. **长期解法，后续项**：U 自己变成模板输出加 U 的页面。

## U 作为工作台

### "新建 WorkBuddy"流程

1. 向导：选目录、填应用名、填 bundle id（identifier，用户自己填，不自动生成，按反向域名格式校验）、填品牌、选 preset。U 用自带 Bun 跑内置的 create-alwith，`alwith.app.json` 从表单生成。
   - bundle id 旁放"不知道怎么拿？"引导：说明反向域名格式与示例；本地未签名构建任何合法 id 都能用；要签名、公证、上架则必须与 Apple Developer 里注册的 App ID 一致，按钮直接跳转 Apple Developer 的 Identifiers 页面（developer.apple.com/account/resources/identifiers）并给出注册步骤；Windows 不需要注册，同一个 id 用于安装包升级识别。
2. U 把新目录设为 workspace，开 Codex 会话，AGENTS.md 和 alwith skill 已在目录里。
3. "运行"：U 托管前端预览（需先有托管契约，见待拍板）。"打包"：U 提交云端构建、展示进度、取回 installer；普通用户不配置仓库、Secrets 或工作流。

### 两种认证与费用

ALwith 平台登录与 Codex／模型供应商认证分开。第一遍五件事验证前，形成可执行的首次认证说明：分别列出 ALwith 平台登录和默认 Codex／模型供应商认证入口、操作步骤、账号或订阅前提、费用承担方及失败恢复方式，并在干净机器验证。不得隐含复用维护者登录态。首次登录、授权和配置计入一小时。CI smoke 使用专用测试身份与额度。

### 工具链三档

| 用户 | 需要什么 | 路径 |
| --- | --- | --- |
| 只改前端和业务，不碰 Rust | 零工具链 | 运行：U 托管前端。打包：云端构建与签名，主路线；预编译通用壳待验证 |
| 加了自己的 Rust 命令 | 本地工具链 | U 调用 [Free](https://github.com/nyssance/Free)（公开，MIT，macOS 与 Windows 一行安装，`free setup` 装 Homebrew／Scoop、Git、Bun、uv、Python、Rust 等，rustup 已带 `-y`）；用户零基础也不用自己装。待核实：`free setup` 全程是否无需交互、Xcode 命令行工具是否覆盖、干净机器耗时。本轮不要求 Desktop 同步抽包 |
| 开发者 | 自己有 | CLI |

第一档是一小时唯一能兑现的路：装 Rust 和 Xcode 命令行工具本身就可能超过一小时。

### 与 Desktop 的关系

"用 Agent 把软件从定义做到发布"是 Desktop 与 alwith-dev 的职责，工具链安装是 Launchpad 的职责。U 不复制实现；第二个消费者在 U 的托管契约验证后接入。

## 给 Agent 的入口

- 生成项目自带 AGENTS.md：交付地图、不自己 spawn Codex、能力走包、页面走 block、品牌只在 `alwith.app.json` 定义一次。
- `alwith` skill 只写实际可运行的命令，含诊断、恢复、认证与交付步骤，不引用未实现的东西。
- 外部视角的入门指南先在本仓写，稳定后挪到 alwith-api；U 的 README 不是入口。

## 核心矛盾与约束

维护者同时是上游作者和"外部开发者"，边界全部做成机制，机制失败本身就是一条缺口。

| 约束 | 机制 | 为什么 |
| --- | --- | --- |
| 禁止依赖维护者工作区或私有源码。允许 Cargo `path` 指向 `node_modules/@alwith/*/rust` 这类公开 npm 发行物内的 Rust 源码，但 `path` 最终解析结果必须留在已验证的公开发行物内，不能经符号链接再指回工作区 | 检查脚本覆盖 manifest、安装脚本、环境变量、锁文件、Cargo patch、绝对路径、下载源，检查解析后的完整依赖来源；在无 ALwith 私有源码或私有发行物访问凭据的环境，从发布 tarball 生成并构建（nyssance 账号 GitHub Actions）。签名、上传、测试账号用显式配置的专用凭据，不算独立性失败 | 外部开发者拿不到私有源码；"顺手 link 一下"在物理上堵死 |
| `@alwith/*` 用精确版本 | lockfile 升级即"哪个上游版本关掉了哪条缺口"的证据 | 证据可复现 |
| 本地绕过只允许 `patches/` | 文件名带缺口编号；验收含"`patches/` 为空" | 债务可见 |
| 从 U 复制单个文件允许，但每复制一个记一条"X 本该是包" | 验收时该文件已被包或 block 替代并删除 | 复制变成信号 |
| Codex 经 Runtime 托管，不自己 spawn，不另建会话库 | 代码审查 | 2026-09-14 决策 |
| 品牌只在 `alwith.app.json` 定义一次 | 手写源文件不得重复定义品牌；双品牌生成构建检查残留 | 唯一来源不等于唯一出现位置 |
| 缺口不在本仓修 | 路由表 | 否则缺口被掩盖 |

## 回流

不靠 git merge。U 和 workbonny 是两个消费者，共享的东西都在包或 registry 里：

| 产出 | 去处 |
| --- | --- |
| 壳、品牌配置、工程骨架 | create-alwith |
| 页面级 UI 与产品接线 | `@alwith` registry block |
| 能力级逻辑、聊天可组合组件 | 对应的 `@alwith/module-*` |
| 协议与会话投影 | `@alwith/api` |
| 包与文档的修复 | alwith-api、alwith-modules、U 的 docs |

"文档没说、看 U 源码才知道"的记录，要么变成文档一行，要么变成 API 改进。行为类缺口的修复必须带上游包自己的测试，本仓只升版本。

## 缺口台账

位置：本仓 `docs/gaps.md`（开工时建）。字段：编号、日期、现象、层、归属仓、修复形态、状态、证据边界。

| 层 | 归属仓 | 修复形态 |
| --- | --- | --- |
| 文档 | alwith-api 或 U docs | 文档一行或指南一节 |
| `@alwith/api` 协议 | alwith-api | 包改动加测试，发版 |
| 某个 module 包 | alwith-modules | 包改动加测试，发版 |
| registry block | create-alwith 仓的 registry | block 改动，发版 |
| Runtime 发行物 | alwith-runtime，经 `@alwith/runtime` 发布 | 发行物改动，发版 |
| 模板 | create-alwith | 模板改动，或下沉到包／生成物 |

## 已知缺口（开工前就清楚的，进台账；事实经 Codex 核对，附证据边界）

- U 品牌硬编码：`src-tauri/tauri.conf.json` 的产品名、identifier、图标；`src/locales/zh-CN.json` 的名称与退出提示。支持语言列表（`src/lib/i18n.ts`）是配置不是品牌。
- Runtime relay 在 U 与 TV 各一份，已共用 `alwith_api::RuntimeClient`，关闭流程不同；缺口是未抽的通用桥接与生命周期机制。
- staging：U 与 TV 已调用 `@alwith/runtime/stage` 与 native staging，Desktop 是多步编排入口；缺口是已确认重复的 Bun／Codex／adapter 装配与应用级编排接口。
- `@alwith/module-chat` 已分别暴露 update-scheduler、虚拟列表、composer、审批等入口；本次检查未找到可直接交付的完整页面 block 与充分解耦的页面接线契约。完整页面在 U 的 `src/features/chat/chat-view.tsx`。
- 平台登录：开发环境 `api-dev`，生产环境 `api`（U `src/features/auth/store.ts`）；真实账号联调是否通过是另一项证据。"Runtime 平台身份校验未实现"的全局结论来自上游文档，U 的 Runtime 启动接线未传平台凭据可佐证，但待 Runtime 实现审查或发行物契约测试。
- Windows：U 已有 staging CI 与 release 构建矩阵，配置存在不等于运行成功；验证结果待关联 CI，分别追踪 staging、构建、安装、Auth 联调。`docs/native-distribution.md` 仍描述旧的 `@alwith/native` 形态。
- U 的 README 与 `getting-started.md` 只有从源码构建的步骤，没有"用包做新应用"的入口；环境要求互相矛盾：README 与 getting-started 的 macOS 版本冲突，getting-started 与 AGENTS.md 的 Windows 架构冲突，getting-started 与 package.json 的 Bun 版本冲突。
- 上游 `2026-09-15-u-workbuddy.md` 的开发者验收写的是"一周"，已改为一小时，上游文档未改。
- 预编译通用壳不是现有 Tauri 工程的既得能力：`frontendDist` 经 codegen 嵌入二进制。

第一遍实测新增（详见 `docs/gaps.md`）：G1 协议文档在私有仓；G2 Tauri relay 契约无文档、无 crate；G3 Runtime 环境变量与 engines 表无文档；G4 平台 API 地址与登录页；G5 StorePort 宿主接法；G6 聊天页 quickstart；G7 Tauri 3 alpha 版本矩阵；G8 最小 sidecar 集合；G9 图标管线；G11 module-chat 的 Vite `optimizeDeps.exclude`；G12 Atlas 只在 GitHub 分发、atlas-tauri 是 AGPL；G13 Tauri 3 开发态 IPC 重发导致 initialize／start 不幂等。G10 查实是本仓自身 bug，已关闭。

## 步骤：三遍走，发现、回填、验收分开

**第一遍，发现，按风险排序。** 严格按文档走，遇坑只记台账、打 patch 或记账复制，不修。

1. 限时技术验证，先于一切。云端构建验证前，先确定本次验证所需的签名身份、凭据归属与运行边界。用一个符合目标结构的最小工程（脚手架尚不存在时可手搭），在 nyssance 账号下用 GitHub Actions 从公开发行物装依赖、构建、签名、生成安装包；下载到干净机器安装、退出 U 后独立启动、五件事走通；分别记录冷缓存、热缓存、排队、构建、签名、下载、安装耗时。
2. 接入 U 托管预览前，完成托管运行契约 decision（它不阻塞第 1 项的源码调查与独立云端构建验证）。然后同一工程接入 U 预览，验证两种运行方式的接口和行为一致。
3. 空目录起 Tauri 3 + React 工程，只装已发布的包，品牌走 `alwith.app.json`；接 Runtime 与 Codex；接 module-chat、module-auth、module-store；写自己的品牌与页面。
4. 拿到诚实的缺口清单与耗时分布。

**第二遍，回填并固化 create-alwith，按风险与依赖排序。**

1. 依据第一遍的验证结果，固化云端交付与 U 托管实现；涉及已拍板结论调整时另写补充决策。
2. 抽 relay 通用机制与重复的 staging 装配。
3. 定 U 的壳边界清单与 `alwith.app.json`，实现品牌与图标最小生成。
4. 模板、`.alwith/template.json`、registry 首批 block（登录、设置、聊天、侧栏）、聊天型 preset、发布闭包；模板 CI 真实生成并构建。
5. U 内置 create-alwith，"新建 WorkBuddy"向导、托管预览、云端打包提交与取产物；U 的 CI 对生成器拥有的文件做 diff。
6. `alwith` skill 与生成项目的 AGENTS.md。
7. 本仓升版本、删 patch、删复制文件。验收：用本仓的 `alwith.app.json`、固定发行版本和相同生成输入重新生成项目，生成器拥有的文件确定性一致；用户拥有的页面与接线按所有权清单排除原始文件相等要求，通过接口兼容与运行验证；所有差异均须能归属于配置生成或用户定制。

**第三遍，验收，都不能由维护者本人跑。**

- 开发者：只拿到文档和 npm、看不到 `~/Projects/ALwith` 的新 Agent 会话，在干净环境从 `bun create alwith` 开始重做，到验收表定义的完整终点（安装产物、五件事、业务定制含一次修改与重启验证）。
- 普通用户：多名首次使用者在干净机器下载 U 的 dmg，点"新建 WorkBuddy"，只用自然语言做到安装自己的产物、五件事走通、完成一个真实业务定制。

## 测量协议（首轮测试前定，不得事后选口径）

- 条件：机器型号与系统、网络、缓存状态（冷／热）、账号与订阅前提、模型。
- 分阶段计时：下载、登录与授权、生成、依赖安装、定制、构建排队、构建、签名、下载、安装、五件事验证。失败重试不暂停计时。
- 参与者：预先定人数、任务与通过标准；每人独立完成；报告完成率与各阶段耗时。一次幸运成功不算证明。
- 构建缓存必须是服务正常提供的，不能为单次验收预热。

## 验收

| 条目 | 标准 | 证据 |
| --- | --- | --- |
| 独立性 | 检查脚本通过；无私有源码或私有发行物访问凭据的环境从发布 tarball 生成并构建通过 | 待做 |
| 无绕过 | `patches/` 为空；"本该是包"的复制条目全部关闭 | 待做 |
| 模板等价 | 用本仓的 `alwith.app.json`、固定发行版本和相同生成输入重新生成项目：生成器拥有的文件确定性一致；用户拥有的页面与接线按所有权清单排除原始文件相等要求，并通过接口兼容与运行验证；所有差异均须能归属于配置生成或用户定制 | 待做 |
| 模板不腐 | 模板 CI 真实构建通过；U 的 CI 对生成器拥有文件 diff 通过；U 发版 CI 从内置模板构建通过 | 待做 |
| 双品牌 | 两个品牌分别生成、构建，无残留 | 待做 |
| 发布闭包 | 同一 create 版本两次生成结果一致；闭包记录齐全 | 待做 |
| 终点 | 安装自己的产物，退出 U 后独立打开，完成登录、聊天、审批、历史验证，以及下一条业务定制的全部步骤，包括一次需求修改与重启后的状态验证 | 待做 |
| 业务定制 | 用户自然语言描述自己的页面与一种业务数据或工具操作，Agent 接入；用户改一次需求；验证结果、审批与重启后的状态 | 待做 |
| 开发者时限 | 从执行 `bun create alwith` 开始，包含脚手架下载和首次认证，到上述全部终点完成，不超过一小时 | 待做 |
| 普通用户时限 | 多名首次使用者从开始下载 U 到上述全部终点完成，不超过一小时，报告完成率 | 待做 |
| 缺口回填 | 台账每条有对应仓的提交或 plan 挂号 | 待做 |

## 待拍板（各开一篇 decision 再做，前两项在第一遍对应步骤前完成）

- **U 托管运行契约**（接入托管预览前的条件，不阻塞源码调查与独立云端构建验证）：每个 WorkBuddy 的身份、数据目录、登录态与 Runtime 连接归属；可调用的 IPC、文件路径与原生能力；预览重载、关闭项目、退出 U 时的进程与会话生命周期；开发预览与独立安装包使用同一组接口与能力版本。不能变成共享 U 的凭据与全局权限。
- **云端构建与签名**（第一遍云端构建验证前先定本次验证所需的签名身份、凭据归属与运行边界；完整方案按验证结果固化）：签名身份、凭据归属（参照 EAS 的凭据托管）、运行边界、缓存策略；预编译通用壳若要做，先固定能力集合、资源装载、品牌处理、签名路径四项。
- 聊天组件与页面接线的拆分边界：以"一个完全不同布局能复用接口"为证据。
- 用户 Rust 扩展点的形态。
- Free 作为工具链安装器的接入方式：U 直接执行 `free setup` 还是只装所需子集（Bun、Rust、Xcode 命令行工具）；Free 是 nyssance 个人公开仓，是否迁入 ALwith-ai 或保持引用。
- block 的版本来源与本地修改冲突处理。

## 后续项（本轮不做，挂号防忘）

- U 变成 create-alwith 的输出加 U 的页面；TV 同理。
- `migrate`：按版本的迁移脚本与三方合并。
- 生成物层的完整实现：capabilities、Cargo 依赖等从 `alwith.app.json` 生成。
- 画布型与综合型 preset。
- Desktop 作为工具链安装与项目托管的第二个消费者。
- 账号权益一致性与统一移动端的验收。

## 决策归属

本仓自己的取舍写在 [docs/decisions](../decisions/index.md)，写完不改，推翻或补充就新写一篇引用旧篇。凡是改了上游规则的，按现行规矩写进对应仓 AGENTS.md 一行结论加 docs 展开，两边用缺口编号互相引用。

## 不做什么

- 本轮只验桌面制作与交付。账号权益一致性与统一移动端是平台供给不是可选能力，另行验收，不破坏已有接入契约，也不在本轮凭空设计其接口。QA、Gamepad、alwith.dev 是可选能力，不接。
- 不做画布型与综合型 preset，不做其他框架模板。
- 不在这轮把 U 改成"模板加页面"，不要求 Desktop 同步抽包。
- 不自建 UI 商店，不自建 registry CLI。
- 不开源 workbonny、不发布、不改许可；create-alwith 与 registry 必须公开，另算。
