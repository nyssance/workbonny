# Gallery 由 WorkBonny 仓内 module 维护

日期：2026-11-03。状态：用户明确确定。

本决定修正 [此前的模块归属假设](2026-11-03-open-source-gallery.md)。Gallery 是 WorkBonny 的能力，源码放在本仓 `modules/gallery/`，不放入 alwith-modules，不依赖该仓的 Gallery 包。前端、Rust、权限、测试、许可证和模块说明集中维护，保持可整体拆出的边界。

应用负责 Atlas 页面、宿主配置与原生注册；模块不导入应用业务。前端从本仓模块源码接入，Rust 作为应用内模块编译，并保留独立 Cargo 清单供测试及将来拆出。不为本地接入发布 npm/Cargo 包，不引入工作区外的 Gallery 路径依赖。完整源码按 MIT 保留，发布与推送仍需另行指令。
