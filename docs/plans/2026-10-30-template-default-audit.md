# 默认模板完整性审计与重构

本轮依据用户 2026-10-30 明确要求：模板帮助消费标准实现，不重新设计、裁剪或覆盖 U 默认行为。先在上游整批补齐，本地候选验收后统一发布；create-alwith 不发布 npm。Windows 实机暂缓。

| 范围 | 已确认缺口 | 所有者及修复路径 | 验收 |
| --- | --- | --- | --- |
| 标题栏 | Atlas 顶部留白没有 drag region；缺少拖动、双击原生权限 | desktop-shell 提供 U 标题栏；模板仅装配权限 | 实机拖动、双击缩放 |
| 导航标题 | 模板自画 logo/大方块新建/裸 Vibemon 图标 | chat 提供 U NavigationHeader，模板接事件 | 与 U 对照尺寸、位置、hover |
| 项目与活跃会话 | 模板只有项目历史 | chat 提供标准视图切换与 Runtime 活跃列表 | 活跃进出、状态点、后台任务、停止、历史仍可见 |
| 菜单交互 | 账号入口用通用 ghost 白色 hover 和 truncate | 共用 NavigationItemButton 与 OverflowMarquee | 默认/hover/active、溢出文字、键盘 |
| 项目选择 | 提示选择文件夹但无选择器/菜单 | chat 抽 U DraftProjectPicker；shell 提供 native dialog；ACP 创建项目会话 | 最近项目、文件夹选择、取消、随聊、cwd 正确 |
| Settings | 独立窗口存在但页面被简化成几行 | shell 抽 U 原版 AuxWindowShell、SettingsLayout、SettingRow/CSS；能力逻辑归对应模块；registry 组合 | 原版分类/行/控件；已启用能力可操作；跨窗口同步 |
| -1 屏 | 硬接 VibemonCenter，遗漏定制/扩展/插件/Skills/归档 | 抽 U LeadingNavigation；module-extension 提供扩展宿主/页面；Codex 插件/Skills 继续走 ACP | 各入口、列表、安装/启用/禁用、文档、归档可达 |
| 账号模式 | 无账号模式不能成为功能缩水版 | auth 只控制账号与 Vibemon；项目、活跃会话、Settings、扩展/插件/Skills 同样装配 | 两种模式生成、冻结安装、TS、前端/原生构建 |
| 发行与消费者 | 不能边改边发或仅 Bonny 修补 | 上游完整验证后受影响的 U/TV/Bonny/Desktop/GitCub 接正式包，TV 不改变原版布局 | 无私有路径、无局部样式覆盖、源码/依赖一致 |

## 2026-10-30 阶段证据（不代表当前发行状态）

- 活跃导航共享测试 34 项通过；新 ActivityList 使用 Runtime 成员而非历史记录。
- 外观控制的持久化、系统主题跟随和跨窗口同步测试通过。
- 旧简化 Settings 仍不是完成项；原版布局和完整能力抽取在进行，不能以窗口可打开代替验收。
- 本轮候选代码位于 alwith-modules 与 create-alwith 独立工作树；正式 WorkBonny 依赖保持公开发行物。
- 全部未完成前不得宣称模板完整，不发布中途版本。
