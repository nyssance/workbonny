# Sites 接入探测

2026-11-03，在隔离测试环境通过 WorkBonny 的 Runtime → codex-acp → Codex app-server 查询；没有创建、修改或发布网站，没有运行模型生成任务。

使用 `startTestRuntime` 创建临时 CODEX_HOME、工作目录和 journal，仅通过 `authFrom` 复制登录凭证，结束时 dispose 删除。候选依赖来自 `/private/tmp/workbonny-gallery/consumer`，未修改正式依赖或锁文件。实验适配器副本 `/private/tmp/workbonny-sites-adapter.mjs` 只新增 `app/list` 和 `app/installed` 两项只读转发，未修改正式适配器。

结果：

- Runtime 成功启动代理。
- 初次受限网络环境下插件列表没有 Sites；这个结果不能作为账号无权限的证据。
- 放行网络后的 `app/list` 返回 Sites：`isAccessible: true`、`isEnabled: true`。
- `app/installed` 返回 `connector_20205bf7d4e99a89d7154bb849718324`、`runtimeName: Sites`、`enabled: true`、`callable: true`。
- 未实际调用 Sites 的工具，未验证创建、预览、上传与部署全链路。

结论：当前账号的 Sites 能力可被 WorkBonny 托管的 Codex 发现，且服务端报告可调用。下一步应在 codex-acp 的公开扩展接口与 module-chat 的 Apps 接线补齐查询和选择；WorkBonny 消费共享能力。不应复制 Codex 内部凭证、硬编码私有接口或另造部署后端。账号级验证不代表所有用户均有权限。

现有 Codex 原始二进制签名问题 G38 仍存在；本探测没有修改或重签二进制，运行成功不等于签名发行验收通过。

## 接入实现与真实调用（同日续验）

已落回两个共享仓库的 main 工作区，未提交、发布或推送：

- codex-acp：增加 Apps 只读查询转发及 `CodexClient.installedApps()`；ACP v1/v2 将显式 `app://` resource_link 保留为 Codex 原生 mention。
- module-chat：现有输入栏增加标准 shadcn 应用菜单，仅提供 enabled 且 callable 的应用；选择插入可随草稿保存的应用链接，提交时生成 resource_link；失败报错，不自动重试。
- WorkBonny 不另写 Sites 服务，不改正式依赖与锁文件。候选位于 `/private/tmp/workbonny-sites-candidate`，源码补丁保存在 `patches/G40-sites-adapter.patch` 和 `patches/G40-sites-chat.patch`。

真实调用通过 Runtime → ACP → Codex → Sites 完成：观察到 `mcp.codex_apps.sites.list_sites` 从 in_progress 到 completed，模型返回站点数 1，最后收到 ACP v2 `state_update: idle`、`stopReason: end_turn`。没有创建、修改、发布站点。第一次探针在 ACP v2 返回 messageId 时过早结束，不能算调用成功；完成态修正后的记录才计入验收。

从共享源码构建的适配器在**空配置**隔离 home 中也返回 Sites enabled/callable；没有依赖前次临时 `features.apps=true` 配置。账号数据未写入仓库，临时 Runtime home 均已 dispose。

验证：适配器构建、适配器类型检查、共享聊天涉及文件类型检查通过；1 项协议转换测试（Vitest）、2 项引用测试及 2 项菜单交互测试（Bun）通过。菜单测试覆盖不可调用/禁用项过滤、选择引用、失败报错且不自动重试。一次测试命令误命中整个 chat 测试脚本，因隔离测试环境缺少 DOM preload 导致无关测试失败，已停止；随后按项目 DOM preload 单独运行相关测试通过，不能据此声称整个 chat 测试集通过。

当前边界：尚未替换用户已安装的 WorkBonny，也未完成桌面菜单视觉验收。Hasgard 候选 socket 连接被拒绝；原生重新暂存仍受 G38 签名门禁约束。不能把协议与组件测试称为桌面全链路完成。创建网站、预览与部署也尚未验收。

`scripts/probe-sites.ts` 提供只读可用状态复查，必须显式给出 `--auth-from`，并在安装本地候选包的消费者环境运行；可通过 `--adapter` 和 `--codex` 指定候选文件。
