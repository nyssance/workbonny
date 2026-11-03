# Sites 本地合并检查点

按用户要求在功能完成前提交可编译的中间状态，供
`fix/shared-module-interactions` 合并。没有推送、发布、触发 CI 或部署网站。

- codex-acp：通用 Apps 查询、ACP v1/v2 应用引用、MCP 查询与直接工具调用。
- alwith-modules/chat：通用应用菜单、可用状态过滤、引用持久化和提交。
- WorkBonny：`modules/sites` 独立模块、`src/sites.tsx` 宿主适配和只读探针。

当前编译检查通过：适配器 `bun run build`、chat `bun run build`、WorkBonny
`bun run check` 与 `bun run build`、Sites 模块构建。9 项相关测试通过：适配器
1 项、chat 4 项、Sites 4 项。没有用这些结果替代全部仓库测试或原生验收。

真实只读 Sites 列表调用和无模型 MCP 直接查询已经通过。建站、修改、保存与
部署的端到端验收，以及桌面视觉验收仍未完成。本检查点不能作为 Sites 完整
发布的依据。其他模型与 Sites 托管的组合也未验证。

WorkBonny 的 App.tsx 与 navigation.tsx 混有其他会话的 Gallery/壳升级改动，
本提交不包含它们。Sites 入口已经在当前工作区接好，其独立增量记录在
`patches/G40-workbonny-sites-entry.patch`，随后续应用升级整合；不要对当前已
含该入口的文件重复应用补丁。其他未提交文件与已暂存内容均保留。

适配器原有 package.json 与 bun.lock 的依赖升级不属于 Sites，留给原会话处理。
chat 的 Apps 查询采用可选结构化端口，避免中间提交必须依赖未发布的新类型。
Sites 实际调用仍需要含新接口的适配器候选；旧版明确报缺口，不伪装接通。
