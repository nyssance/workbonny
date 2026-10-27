# create-alwith 只发 npm，TS 跑在 Bun 上，不发 crates.io

日期：2026-10-27。状态：已拍板。

## 问题

脚手架 create-alwith 发 npm 还是 crates.io，用 TS 还是 Rust 写。create-tauri-app 是 Rust 写的、npm 与 crates.io 都发，要不要照搬。

## 决定

只发 npm，包名 `create-alwith`。TS 实现，跑在 Bun 上。不发 crates.io，以后真有 `cargo` 入口需求，发一个薄壳调同一份 npm 包。

## 为什么

- `bun create alwith` 与 `npm create alwith` 这个入口要求 npm 上必须有 `create-alwith`，这是 npm 约定，没有替代；crates.io 只能是额外入口，省不掉 npm。
- 零工具链那档用户是决定性的：生成的项目反正要 `bun install`，Bun 必有；create 走 cargo 等于用户创建那一步就得先装 Rust，与"不加 Rust 命令就不需要 Rust"直接冲突。
- U 内置更简单：U 已把 Bun 打成 sidecar，内置一个 npm 包是多拷一个目录；内置 Rust 二进制要进 stage 流程，三平台各编一份。
- 脚手架是工具不是能力包，"进程侧 Rust、界面侧 TS"那条规则不管它；ALwith 现有工具链就是 Bun 脚本加 fabfile。
- 图标生成不自己写，`tauri icon` 已在 `@tauri-apps/cli` 里，create 直接调。

create-tauri-app 两边都发的理由在 ALwith 不成立：Tauri 要照顾只用 Rust 不装 Node 的用户，ALwith 生成的项目没有不用 Bun 的。两边都发多一条发布流水线、版本会漂，命名决策（alwith-desktop 仓 `docs/decisions/2026-09-15-naming.md`）也只预留了 `@alwith/x` 与 `alwith-x` 两个空间。
