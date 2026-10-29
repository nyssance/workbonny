# 会话分组方案：Codex 的项目和随聊、ALwith 自己的都认

日期：2026-10-28。状态：按用户最新结论修正，待实施；本次仅修改方案。

## 问题

会话列表怎么分"随聊"和"项目"，现在由 module-chat 的 `packages/chat/src/session-list/session-groups.ts` 决定：
- `isQuickChatDirectory` 用正则匹配 `cwd`：`~/Documents/Codex` 及其子目录、`~/Documents/ALwith` 算随聊；
- 其余每个 `cwd` 各成一个"项目"组，组名取文件夹名。

这套规则是 andy.lu 在 U 里写的，后来原样搬进了包：

| 日期 | U 提交 | 内容 |
| --- | --- | --- |
| 10-12 | 1615f55 | 首次分随聊：Codex 目录、`~/Documents/ALwith U`、系统临时目录 |
| 10-13 | b32d77b | 去掉临时目录 |
| 10-23 | ad3566a | U 的随聊目录改为共用的 `~/Documents/ALwith`（`draft_directory.rs` 负责创建） |
| 10-26 | 693c010 | 排除旧的 `ALwith U` 目录 |
| 10-27 | 90adcba | 原样搬进 module-chat 0.5.3 |

现有规则的问题：
- **主目录被当成项目。** 在 `~` 下开的会话显示成一个叫 "ny" 的项目组。WorkBonny 第一次接入时就撞上了这个。
- **路径只能靠猜。** 正则只认 macOS 和 Windows 的固定写法。Windows 文档目录被移到 OneDrive、在 Linux 上、或者用远程 Runtime 时，都认不出来，因为客户端看不到 Runtime 那台机器的主目录。
- **不认 Codex 登记的项目。** 官方 Codex Desktop 登记的项目（有名字、可以有多个根目录）在我们这边只是按文件夹名分组。
- **新对话的目录由各应用自己建。** U 的 `draft_directory.rs` 和 WorkBonny 的 `quick_chats.rs` 是重复代码。

## 官方 Codex Desktop 怎么分（实测）

拆的是 `/Applications/ChatGPT.app` 26.1023 的 `app.asar`，函数名经过压缩，结论依据 `webview/assets/app-initial-*.js` 里的查询过滤器。

**侧栏 Chats（随聊）：** 满足下面任意一条，并且没有被明确分配给某个项目：
1. 线程 ID 在 Desktop 自己记的无项目列表里。列表存在 `~/.codex/.codex-global-state.json` 的 `projectless-thread-ids`。
2. `cwd` 是主目录 `~`。
3. `cwd` 在随聊根目录 `~/Documents/Codex/` 下（前缀匹配）。

**项目组：** 项目是侧栏登记的文件夹，正在迁到 app-server 的项目表。线程归进项目组的条件是：
- `cwd` 等于某个项目的根目录，或者在它下面；
- 或者被明确分配到这个项目（`thread-project-assignments`）。

**都不满足的线程**（没登记的目录、临时目录）不进任何项目组，也不进 Chats。是否能通过搜索找到没核实。

官方自己建的线程不会出现"没登记"的情况。在 Desktop 里，新线程只能开在已登记的项目里，或者作为新聊天开；选一个文件夹就等于登记成项目。本机 27 个未归档的 Desktop 线程：
- 7 个明确分配到项目；
- 13 个在无项目列表里；
- 7 个按路径进 Chats（6 个在 `~/Documents/Codex` 下，1 个在主目录）；
- 没登记的 0 个。

没登记的线程都来自别的工具：Codex CLI、`codex exec`，以及 U、TV、WorkBonny（它们建会话时不登记项目）。

本机数据：

| 数据 | 情况 |
| --- | --- |
| app-server 项目表 | 2 个项目：alwith-desktop、alwith-cli，都是 Desktop 迁过来的 |
| 线程的 `project_id` | 381 个全空，Desktop 还没把归属迁到 app-server |
| Desktop 的无项目列表 | 25 个 ID，能查到的都在 `~/Documents/Codex/日期/名字` 下 |
| Desktop 的项目分配 | 13 个，`cwd` 都在 alwith-desktop、alwith-cli 的根目录里 |

app-server 的项目接口是正式接口，不是实验接口：
- `project/list|read|create|update|delete|import|move`；
- `thread/metadata/update` 可以改线程的 `projectId`；
- `thread/list` 可以按 `projectId` 过滤，传 `null` 表示只要没挂项目的线程；
- 两个通知 `project/changed`、`thread/project/updated`。

adapter 现在显式忽略这两个通知，见 `codex-acp-v2/src/CodexEventHandler.ts:1004`。

## 规则

每个会话按下面的顺序判断，**实现统一在 codex-acp-v2 包内**：agent 侧读取真实目录和 Codex 项目表，包内客户端解析 ACP 数据并计算展示分组。不得让 @alwith/api 或应用补齐 Codex adapter 缺少的协议能力。分组结果是客户端投影，不新增 quickChat 会话字段。

| 顺序 | 条件 | 归属 | 来源 |
| --- | --- | --- | --- |
| 1 | 线程有 `projectId` | 该 Codex 项目，组名用项目名 | Codex |
| 2 | `cwd` 等于某个 Codex 项目的根目录，或在它下面（多个都匹配时取最长的根） | 该 Codex 项目 | Codex |
| 3 | `cwd` 是主目录，或在 `~/Documents/Codex` 及其子目录下 | 随聊 | Codex |
| 4 | `cwd` 是 `~/Documents/ALwith` | 随聊 | ALwith |
| 5 | 其他 | 按 `cwd` 文件夹成组，组名取文件夹名 | ALwith（现行为） |

新建会话时按官方做法登记项目（见下文），所以第 5 条只会接住外部工具的会话和历史会话。

第 5 条明确保留 ALwith 的展示行为；本方案不承诺覆盖官方 Desktop 尚未通过公开接口暴露的私有归属。官方的项目组和 Chats 里都没有这些会话；我们照常显示（已拍板），保留 ALwith 一直以来"选一个文件夹就是一个项目"的做法，U 用户现有的分组不会消失。

`~/Documents/ALwith` 只认这一个目录本身，子目录仍按项目处理，沿用 andy.lu 的测试：`~/Documents/ALwith/project` 算独立项目。Codex 根目录按官方做法，子目录也算随聊。

用本机未归档线程粗算（没扣除 adapter 的来源过滤）：

| 归属 | 数量 |
| --- | --- |
| Codex 项目 | 46 |
| 随聊：主目录 | 28 |
| 随聊：Codex 根目录 | 28 |
| 随聊：ALwith | 5 |
| 其他目录（41 个，粗分时临时目录前缀被截断合并，实际不止 41 个；其中临时目录下的测试会话见"已定"第 3 条） | 268 |

和现在相比的变化：
- 主目录下的 28 个会话从 "ny" 组移进随聊；
- alwith-desktop、alwith-cli 改用 Codex 的项目名分组；
- 其余不变。

## 协议与包的职责

**codex-acp-v2 完整承接 ACP 标准能力和 Codex 扩展能力。** 标准方法不拆出去，Codex 专属能力通过同一 ACP 连接的扩展方法或 `_meta.codex` 承载。@alwith/api 只提供 Runtime 传输、运行状态观察和通用 store/scheduler；ACP 客户端生命周期与会话投影全部归 codex-acp，不保留 metadata 处理或兼容转导出。

### 新建只有一条链路

`应用 newSession → ACP session/new → adapter → Codex thread/start`。

- 不选目录：包内客户端向 adapter 获取并创建 Runtime 所在机器的 `~/Documents/ALwith`，再发送标准 `session/new`。ACP 的必填 `cwd` 不变。
- 明确选已有项目：在 `session/new._meta.codex.projectId` 传 Codex 项目 ID，adapter 校验并复用。
- 明确选新文件夹：adapter 查找匹配的已登记项目（最长根目录匹配），没有则调用 `project/create`，再将返回的 ID 交给 `thread/start`。应用不另行编排项目登记。
- 扩展字段区分意图：`projectId` 为字符串表示指定项目，显式 `null` 表示随聊；选文件夹但尚无 ID 时省略该字段，由 adapter 查找或登记。包内客户端为无目录的新建明确发送 null，不能只凭路径反推用户意图。
- 项目 ID 由 Codex 生成，不能自己生成或使用路径哈希代替。创建请求的幂等键与项目 ID 是不同概念；需覆盖并发重试和删除项目后重新登记，不能永久复用已删除项目的幂等键。
- 登记失败应报错，不静默创建未关联线程；新建响应和会话列表均通过 `_meta.codex.projectId` 返回真实归属。历史线程无归属仍为 null，路径推导的展示分组不冒充持久化归属。

### codex-acp-v2

- agent 侧调用 Codex 公开项目接口，完整读取分页，提供 Runtime 侧主目录、随聊目录和项目数据；不让客户端猜远端路径。
- 包内 CodexClient 完整处理 ACP 会话生命周期及扩展，解析 `_meta.codex.projectId`，按本方案五条规则生成展示分组。
- 项目组按 ID 区分、显示项目名；其他目录按完整路径区分，同名文件夹不得合并。
- 收到 `project/changed`、`thread/project/updated` 时更新客户端投影。项目读取失败不是空项目表；保留已有结果并暴露错误，不把会话重新错分。
- 不新增 `_meta.codex.quickChat`、`SessionSummary.quickChat` 或替代性的会话分类枚举。
- ACP 标准能力必须在 adapter 完整可用。已有顶层 `_meta` 扩展按实际协议所有权处理，不能一律搬进 codex；本轮不顺带重命名认证、回放、Zed/AIR 兼容字段。

### @alwith/api

- 仅提供 Runtime 传输、运行状态观察、通用 store/scheduler 和测试 Runtime 辅助入口。
- 不提供 ACP newSession 包装、会话投影、metadata 字段或兼容转导出；这些全部由 codex-acp 客户端承接。应用和 module-chat 直接消费 adapter 投影。
- 公共封装不意味着 adapter 可以缺少 ACP 标准能力；不得要求只有配合 ALwith API 才能完成标准 ACP 流程。
- 提供 Runtime 测试辅助入口，具体隔离要求见下文。

### module-chat 与 Runtime

- module-chat 渲染客户端分组投影，归档列表、项目列表共用同一结果；删除 UI 内的 `isQuickChatDirectory` 正则，不新增会话 quickChat 字段。
- Runtime 继续托管 adapter，不增加项目业务规则。
- G17 行高默认值和 G11 预打包说明可随包修复，独立验证。

### 发布

先修上游包、完成测试、通过 CI 发布，再由应用安装公开发行物。版本号以发布时实际版本为准；验证客户端与 adapter 的能力兼容，缺少能力应明确报告，不退回本机路径猜测。

## 应用改什么

**U**
- `new-chat-directory.ts`、`draft-project-picker.tsx` 不再调用 `isQuickChatDirectory`，消费 codex-acp 客户端提供的分组投影。
- `draft_directory.rs` 里"没给目录就建 `~/Documents/ALwith`"这一段删掉，改用 `newSession()` 不传 `cwd`。
- 校验项目目录的那部分保留，`ai-host.ts`、`preferences.ts`、`file-workspace.tsx` 还在用。

**TV**
- 升级版本，验证画板项目目录创建会话时正确登记、复用并关联项目。

**WorkBonny**
- 删掉 `src-tauri/src/quick_chats.rs` 及其注册，`App.tsx` 改用 `newSession()` 不传 `cwd`。
- `docs/gaps.md` 的 G18 改成指向包里的修复。
- 今天写的 `docs/decisions/2026-10-28-quick-chats-alwith.md` 内容有误：它写的是"包保持现状"，而用户的意思是"随聊固定为 ALwith，不提供配置项"。新增决策引用并纠正该篇，旧决策保留不改。

## 这次不做

- **不读官方 Desktop 的私有文件 `.codex-global-state.json`。** 它是 Electron 应用的内部格式，随时可能变。本机里面的条目都已被第 2、3 条覆盖。Desktop 正在把项目和归属迁到 app-server（相关键名有 `app-server-projects-migration-by-host`、`thread-project-membership-host-ids`），迁完后第 1 条自然就能认出来。
- **不回头登记历史目录。** 官方也不替 CLI 会话补登记。历史会话靠第 5 条照常显示；用户在某个目录里新建一次会话，这个目录就被登记，旧会话按第 2 条自动归到这个项目下。
- **不提供宿主配置项。** 随聊目录固定为 `~/Documents/ALwith`。

## 已定

1. 没登记的目录照常显示，按文件夹成组（用户拍板）。
2. 选文件夹即登记成 Codex 项目，本轮做。和官方一致，不需要另外拍板。
3. `/var/folders`、`/private/tmp` 下的测试会话不做特殊隐藏，按第 5 条显示。清理前本机共 167 个（含归档 2 个；Claude 会话记录显示用户已删除 165 个，余下 2 个受分叉引用保护，未重新核验当前状态），分布在 72 个目录。`project_id` 全为空，也没有一个临时目录登记成 Codex 项目。来源：originator 为空 69、alwith-u 34、e2e 33、alwith-codex 9、smoke 5、alwith-conformance 5、probe 5、codex_exec 3、alwith-board 3、taptap-canvas-bridge 1。真正的问题在测试：U 的实机测试用的是用户真实的 `~/.codex`，所以测试会话混进了用户列表，登记项目后还会往用户的 Codex 里登记临时项目。改法照 Codex 官方测试（`Vendor/codex/codex-rs/app-server/tests/common/test_app_server.rs`），跟登记项目同一轮做：
   - 每个测试一个临时 `CODEX_HOME`（`TempDir`；官方有 222 个测试文件这样做）；用它启动 app-server，`cwd` 也设成它。
   - `CODEX_APP_SERVER_MANAGED_CONFIG_PATH` 指向临时目录内，官方注释是"Keep integration tests isolated from host managed configuration"；同时清掉 originator 覆盖变量。
   - 模型请求打到本地 mock 的 Responses 服务（官方 `app-server/tests/suite` 里有 100 个文件这样做），登录态用固定的 auth 文件（`auth_fixtures.rs` 的 `write_chatgpt_auth`），不用真实账号，也不走真实网络。
   - 必须用真实模型的少数冒烟测试，同样用临时 `CODEX_HOME`，只复制 `auth.json` 进去。官方不做这类测试，这是我们比官方多的部分。
   - 测试会话的来源分两类：
     - **仓库里的正式测试。** codex-acp-v2 自带的 e2e 已经用临时 `CODEX_HOME`（`RuntimePaths.createTemporary`），andy.lu 10-23 加的分叉测试也是把 `auth.json` 复制进临时目录。没隔离的是 U 的 `scripts/live.ts`，它只建了临时工作目录，直接用真实的 `~/.codex` 登录。本机 34 个 alwith-u 会话来自这里，改法同上。
     - **开发时现写现跑的验证脚本。** originator 为 e2e、smoke、probe、alwith-conformance、alwith-codex 的会话，在任何仓库里都搜不到对应代码，只出现在 Claude Code 的会话记录里（alwith-desktop 项目的会话和子代理）。这些脚本为了用真实登录没设 `CODEX_HOME`，跑完脚本就删了，会话却留在了 `~/.codex`。`/private/tmp/claude-501/` 下的会话就是直接在 Claude 的临时目录里跑的；`codex_exec` 的 3 个是 Claude Code 调用 `codex exec` 做评审时留下的。
   - 对后一类，光靠规则约束 Agent 不够，要把隔离做成默认行为（确定性归平台）。`@alwith/api/node` 提供一个启动 Runtime 的测试辅助函数，默认建临时 `CODEX_HOME`、隔离托管配置并使用 mock 与测试认证；仅显式启用真实模型冒烟时复制 `auth.json`。负责停止 Runtime 后清理临时目录，并验证子进程继承隔离环境；`live.ts` 和以后的临时脚本都用它。各仓 AGENTS.md 写明：直接起 Codex 的脚本必须使用这个辅助函数。

## 验证

- **adapter 单元测试：** 用一张 `cwd` 到归属的对照表覆盖 5 条规则，包括多个根目录嵌套时取最长、Windows 路径、主目录带或不带末尾斜杠、`~/Documents/ALwith/子目录`。
- **module-chat：** 验证客户端分组投影的展示；分组规则测试归 codex-acp 包。
- **用 Hasgard 在 WorkBonny 上跑：**
  - 新对话进随聊，`pwd` 为 `~/Documents/ALwith`；
  - alwith-desktop 的会话显示在名为 "alwith-desktop" 的组里；
  - 主目录下的会话进随聊；
  - 在一个没登记的文件夹里新建会话后，`project/list` 出现这个项目，线程带上 `projectId`，官方 Desktop 侧栏里能看到它；
  - 同一文件夹再建一次，不会出现重复项目；
  - 该文件夹以前的会话自动归进这个项目组。
- **U：** 除了主目录会话移进随聊、Codex 项目改用项目名之外，侧栏和现在一致。

- **协议与异常验证：** 标准 ACP session/new 链路；projectId 字符串/null/省略三种输入；返回和列表字段一致；项目分页、改名、同名目录、路径边界、并发登记、删除后重建、接口失败、旧版能力缺失；普通测试及真实冒烟均不写用户会话库。
