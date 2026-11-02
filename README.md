# workbonny

通过 create-alwith，在一小时内创建自己的桌面 Harness，并在自己的电脑上编译、独立运行。WorkBonny 是这个目标的实际验收样本；一小时目标仍需外部用户实测。

第一版原样消费共享 U 标准：聊天、项目与活跃会话、菜单、设置及已启用模块的入口。创建时可选择是否集成 ALwith 账号；集成时默认包含宠物，不集成时保留不依赖该账号的基础能力。

模板只负责品牌、模块组合与必要接线。缺失能力回上游模块或 registry 补齐，再重新生成验证；不在模板里维护另一套默认界面。用户需要定制时可整体替换页面。

开发使用隔离的本地候选，完成验证后统一发布；create-alwith 新版本仍暂停发布。正式依赖不引用维护者工作区或私有源码。生成项目本机编译运行就是创建终点，不要求 U 托管预览、云端构建、证书托管或下载安装服务。

当前目标与验收见[总计划](docs/plans/2026-10-27-own-workbuddy.md)，执行约束见 [AGENTS.md](AGENTS.md)，缺口见[台账](docs/gaps.md)，历史拍板见[决策索引](docs/decisions/index.md)。

## 本地开发

先执行 `bun install --frozen-lockfile`。安装 Fabric：`python3 -m pip install -r requirements-dev.txt`。

- `fab u`（或 `fab upgrade`）：按声明的版本范围升级 Bun 和 Cargo 依赖，更新锁文件。
- `fab dev`（或 `fab tauri`）：启动桌面应用，启用 Hasgard。
- `fab check`：检查类型、依赖独立性、前端构建和原生编译，不启动聊天会话。
- `fab build`：通过 Tauri 在本机构建应用及安装包，沿用本机签名配置。

这些入口来自 create-alwith 模板。Fabric 只封装现有 Bun/Tauri 命令，不单独管理 Runtime。
