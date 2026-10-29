# 默认桌面壳交付

日期：2026-10-28。状态：上游模块与消费补丁已编写，未发布、未安装验收。

依据：[默认成品壳与可替换页面](../decisions/2026-10-28-default-shell-and-replaceable-pages.md)。缺口：G20；Atlas 发行依赖：G12。

## 已实现的第一段

- alwith-modules/packages/desktop-shell：@alwith/module-desktop-shell 0.5.0，Rust 源码随 npm 包提供。
- 原生 Tauri 插件：macOS 材质、Windows Acrylic，不支持时保留不透明页面；主窗口原生菜单和新对话事件；复用 atlas-tauri 触控板实现。Windows 保留系统标题栏与窗口控制，不依赖 U 的私有 decoration 补丁。
- 包内 JS：壳状态、窗口范围菜单订阅、Atlas 连接与释放；包内默认 CSS 和窗口配置生成函数。
- native 初始化在 RunEvent::Ready、主窗口已创建后执行；不在 plugin setup 阶段访问尚不存在的窗口。
- CI：macOS/Windows 编译检查；现有 publish 工作流增加 module-desktop-shell 标签映射。尚未触发发布。
- Bonny 接线保存在 patches/G20-desktop-shell-consumer.patch：只依赖拟发布的 ^0.5.0，未将维护者路径加入本仓依赖。临时消费副本用于类型与构建检查，不计独立性验收。
- 修复 scripts/app-config.ts 丢失 native-auth 资源映射的问题，避免重新生成配置时破坏登录。

## 待完成

1. 实机验证默认壳的菜单、材质、Atlas 和窗口操作；Windows 编译通过不等于 Windows 运行验证。
2. 确定 Atlas 面向外部专有应用的发行授权与公开版本（G12）；不得声称现有 ALWITH-LICENSE.md 本身是授权书。
3. 按已有 CI 流程发布模块并验证 npm tarball，不手工 npm publish。
4. Bonny 应用消费补丁，使用公开版本重算 bun.lock 和 Cargo.lock，运行独立性检查；补丁随接入完成删除。
5. U 从包消费公共机制，保留其产品专属菜单和布局；不能把本仓代码直接复制回 U。
6. 把默认壳布局和接线固化为 create-alwith 模板/registry block，在独立安装产物验收。

## 证据

- 初版 Rust cargo check：aarch64-apple-darwin 与 x86_64-pc-windows-msvc 通过。
- 生命周期修正后 macOS 与 Windows cargo check 均通过。
- 临时 Bonny 消费副本：tsc 与 Vite production build 通过。
- 本仓：tsc、check:independence 通过。
- 原生 Hasgard 预览通过：status 返回 macos/native；页面背景透明，导航背景 alpha=0.6；Cmd+N 经原生菜单触发一次新对话事件；视口无横向溢出。当前设备 has_trackpad=false，未验证真实触控板手势；尚无完整安装或 Windows 实机证据。

这段工作不关闭 auth G19、relay G2/G13 或会话分组方案。它们仍需各自上游实现、发布和消费者验收。

- module-chat 默认行高已在上游改为组件自身的 30px，不再读取 U 的私有变量；已有 navigation/session-list 测试从包目录运行，18/18 通过。删除 Bonny 覆盖须等该包新版本发布。

上游草稿 PR：https://github.com/ALwith-ai/alwith-modules/pull/2。消费者移除行高补丁：patches/G17-remove-host-list-overrides.patch，待 module-chat 新版本发布后应用。

## 外部阻塞

GitHub Actions run 40671752019 未执行任何步骤，check-run 122759989106 的官方注释为："The job was not started because recent account payments have failed or your spending limit needs to be increased." macOS 任务随之取消。需账号侧恢复 Billing & plans 后重跑；不通过改支付设置或绕过 CI 手工发布解决。草稿 PR #2 未合并，npm 未发布，因此 Bonny 消费补丁尚未应用。

## 2026-10-28 后续范围

按用户最新要求，本模块不单独抢发，纳入[三应用联合交付](2026-10-28-public-boundary-and-release.md)。先完成相关能力整改并验证 TV/U/Bonny，再集中发布候选包集合。

## 四色运行状态菜单与认证桥接（2026-10-28）

用户明确“四色点”指会话运行状态，不是窗口控制按钮。

- `module-chat/session-list` 新增 `SessionStateMenu`，红（待处理）、黄（运行中）、蓝（完成未读）、绿（空闲）；显示各态数量，点击菜单里的会话走宿主原有导航。修复原组件将完成未读和空闲都显示绿色的问题。
- 状态菜单只读传入的 Runtime 会话状态；不创建会话库、不自行推断历史会话为空闲、打开菜单不触发已读。没有 Codex 专属依赖或样式配置项。
- `module-auth/transport` 抽取三应用重复的请求、刷新合并、过期处理与登录切换隔离；`module-store/tauri` 提供标准命名存储 JS 桥接。未新增包、未发布版本；Rust 命名存储命令和 native-auth 装配仍待抽取，G19 不关闭。
- Bonny 候选接线：`G19-public-auth-store-consumer.patch`、`G20-session-state-menu-consumer.patch`，然后应用已更新的 `G17-remove-host-list-overrides.patch`。正式应用须等相应公共 npm 版本发布、升级依赖和重算锁文件；当前源码仍能使用原发行版本构建。
- 本轮验证：auth 全包 144 项、store 5 项、chat 会话列表 80 项通过，三个包构建通过；临时 Bonny 消费副本类型检查及生产构建通过，本仓类型及独立性检查通过。临时副本使用本地候选产物，只算接口验证，不算公开发行物独立验收。
- 浏览器控制服务返回 `The browser access host is unavailable`，新增状态菜单尚未做视觉验收。仅模拟状态的预览进程已停止，没有启动 Runtime 或真实 Codex。
- U/TV 完整升级回归、原生桥接、create-alwith、会话分组仍未完成，不能用本轮测试替代三应用联合验收。

## 原生桥接与三应用候选验证续记

- module-store 提供可选 Tauri feature、命名 IPC 与权限清单；Rust 源码按白名单随现有 npm 包交付。保留原 app-data 与 cache/stores 路径，退出时释放广播任务。
- module-auth 同包提供 native-auth 公共 Rust 客户端和 Tauri 插件，具体认证仍在原闭源二进制。U 与 Bonny 候选删除应用里的重复 Rust auth/store 实现；TV 继续使用 Board transport，HTTP 层消费公共包。
- API 的 observeRunStates 统一先订阅后取快照、迟到快照保护和释放；三应用消费。Bonny 接线另见 G20-run-state-observer-consumer.patch。
- U 候选：77 条脚本测试及 1,375 条应用测试通过。TV 候选：类型检查、生产构建及新增 3 条状态菜单生命周期/导航测试通过。
- 独立 Hasgard 原生预览验证公共 store 插件写入、读取、删除成功；auth 插件初始化成功（未请求真实登录/刷新）。四色运行状态菜单筛选和导航通过，打开菜单不触发已读；截图位于 /private/tmp/workbonny-state-menu.png。
- 原生壳增加 install_native 入口，允许 U 整份保留产品菜单，同时消费公共材质与 Atlas 安装机制；默认生成应用仍使用完整插件。
- 所有本地 tarball 与 file overrides 仅存在于 /private/tmp 候选目录，不属于 Bonny 独立性验收或发布版本。未修改仓库可见性，未发布 npm。
