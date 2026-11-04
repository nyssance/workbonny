# 随模板交付应用验收测试

所有者为 create-alwith；WorkBonny 同步消费同一份测试、验证脚本和验收说明。没有新增测试依赖、修改正式依赖版本、发布、推送或启动真实模型会话。

## 交付

- `tests/configuration.test.ts`：品牌元数据、原生窗口权限、账号／Vibemon 按模块选择装配，保留无账号模式的核心依赖。
- `tests/wiring.test.ts`：导入应用实际的 runtime/store/client 接线，仅 mock Tauri IPC；验证连接复用与释放、聊天和审批传输、历史读取、错误不重发、设置事件以及 run-state 快照／事件／取消订阅。
- `bun run verify`：测试、包含正式测试文件的类型检查、独立性与前端构建。
- `bun run verify:native` / `fab check`：再执行暂存、厂商字节与签名检查、锁定原生编译。任一失败立即停止。
- `tests/desktop/*.toml`：主窗口与独立设置窗口的 Hasgard 结构 smoke 检查；`docs/testing.md` 明确交互、真实账号和模型、定制与首次用户计时用例及前提。
- 生成器 `tests/acceptance.test.ts`：双品牌 × 双账号模式，检查交付清单并实际运行生成的配置测试；移除拖动权限后必须报错，防止只验证文件存在。
- WorkBonny 的 `scripts/check-create.ts` 也执行生成项目的测试。

## 本地结果

| 检查 | 结果与边界 |
| --- | --- |
| WorkBonny 自动测试 | 10 通过，46 个断言；没有真实 Runtime 或模型 |
| 类型、独立性、前端构建 | 通过；旧的本地 Atlas 探针未修改，类型检查纳入 `tests/**/*.test.ts` |
| 原生编译 | `cargo check --locked --offline --features hasgard-testing` 通过；不等于可发行包验收 |
| 生成器测试 | 22 通过，322 个断言，包含四组生成验收 |
| registry/source | 发现打包快照滞后，按现有源重新生成后检查通过 |
| 本地 tarball | 包内包含测试、说明和验证命令；从实际归档生成 alwith/none 两个隔离项目，分别冻结安装并通过 verify（各 10 项测试、类型、独立性、前端构建） |
| 签名／完整原生验证 | 失败。原始 Codex 与暂存副本哈希一致，但原文件本身签名验证失败；详见 G38。未重签、未绕过 |
| Hasgard 场景 | NOT RUN：检测时没有运行中的 Hasgard 应用 socket；未启动使用真实认证的应用来替代隔离测试 |
| 真实登录、模型、重启恢复与首次用户计时 | NOT RUN；说明书提供独立用例，不计入 mock 测试通过数 |

冻结安装首次发现本地缓存缺少锁定的公开依赖，补充下载后完成隔离验证；没有改动生成项目的依赖声明来绕过失败。版本范围误报已在模板所有者修复，接受 `^major.minor` 和兼容的 `^major.minor.patch`。

本次完成测试随模板交付，不代表总计划的默认完整性、真实功能或一小时目标已经验收完成。
