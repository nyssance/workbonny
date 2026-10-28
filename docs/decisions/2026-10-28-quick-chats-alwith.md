# 随聊固定在 `~/Documents/ALwith`，不给应用改

日期：2026-10-28。状态：已拍板（用户）。

## 问题

module-chat 的会话列表把工作目录为 `~/Documents/Codex`（含子目录）或 `~/Documents/ALwith` 的会话归进顶部的"随聊"组，其余按文件夹名成组。这两个目录写死在包里（`session-groups.ts` 的 `isQuickChatDirectory`）。WorkBonny 起初把对话开在家目录，显示成名为 `ny` 的项目组，于是记了 G18，提议让宿主声明自己的随聊目录。

## 决定

不给改。每个 WorkBuddy 的随聊都用 `~/Documents/ALwith`，包保持现状，不加宿主选项。没有项目的新对话一律开在这个目录（不存在时创建），由会话列表归进随聊。

## 推论

- G18 关闭，修复落在应用而不是包：本仓新对话改开在 `~/Documents/ALwith`，目录由一个 Rust 命令创建（照 U 的 `draft_directory.rs` 改写，`src-tauri/src/quick_chats.rs`）。
- create-alwith 模板自带这个命令；它和 U 的实现重复，进包时一起收。
- 所有 ALwith 系应用的随聊是同一个文件夹，Codex 的会话存储本来也共用，所以各应用在随聊里看到的是同一批对话。
