# 默认成品壳与可替换页面，应用只接线

日期：2026-10-28。状态：已拍板（用户）。

## 决定

create-alwith 默认交付可用的登录页、聊天列表和 Atlas 桌面壳，包括透明材质、顶部菜单与原生窗口控制，覆盖 macOS 和 Windows。用户改生成的页面源码，或自行实现页面消费公共能力，不靠不断增加样式配置项实现定制。

复杂控件必须自带完整默认样式，不能依赖 U 的行高等私有 CSS 变量才能正确显示。公共能力进 module，原生桥接随对应能力交付；默认页面经 registry block 交付，模板只注册、配置与接线。品牌仍只在 alwith.app.json 定义。

桌面壳机制由 alwith-modules 的 module-desktop-shell 承接，生命周期随应用主窗口；升级通过公开 npm 发行物。默认 Atlas 页面归生成项目所有，允许整体替换。不得用对维护者工作区的 path/link/workspace 依赖代替公开发行。

## 会话协议边界

补充并部分取代 [随聊决策](2026-10-28-quick-chats-alwith.md) 的“包保持现状、修在应用”结论：随聊仍固定在 Runtime 所在机器的 ~/Documents/ALwith，但目录创建、Codex 项目登记及协议处理进 codex-acp；各应用移除重复 Rust 实现。

codex-acp 完整支持 ACP 标准与 Codex 扩展，新建统一走 session/new。Codex 项目 ID 由 app-server 生成，经 _meta.codex.projectId 承载。不增加 quickChat 元数据，不读取官方 Desktop 私有状态，不另建会话库。公共 API 只封装公共连接、生命周期与消费接口，不能替 adapter 补标准 ACP 实现。

## 验收

默认样式开箱可用；替换页面无需重写登录或聊天能力；删除本仓复制与补丁；公开发行物构建和安装；退出 U 后独立运行。原生编译、临时预览和补丁完成都只是阶段证据，不能视为最终验收。Atlas 既有 G12 发行与许可缺口仍需单独关闭。
