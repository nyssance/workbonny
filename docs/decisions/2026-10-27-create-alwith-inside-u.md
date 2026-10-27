# create-alwith 是引擎，ALwith U 是普通用户的入口

日期：2026-10-27。状态：已拍板。

## 问题

普通用户不会单独装东西。他下载 ALwith U，然后应该能在 U 里开始做自己的 WorkBuddy。那 create-alwith 是不是就该只活在 U 里。

## 决定

引擎与入口分开。create-alwith 仍是独立 npm 包；U 把它作为资源内置，和内置 Bun、Codex 一样。一个引擎，两个入口：普通用户走 U 的"新建 WorkBuddy"，开发者走 `bun create alwith`。

U 由此多一个定位：不只是参考应用，是做 WorkBuddy 的工作台。U 自己也将是模板的输出加 U 的页面（后续项），U 可以生成自己。

## 为什么

- 干净机器验收、create-alwith 自己的 CI、U 的漂移 diff 都要在没有 U 界面的环境跑，引擎必须能独立运行。
- 开发者需要 CLI。
- 普通用户的起点必须是一个下载，这与产品目标里"无编程基础的人只描述 UI 与业务"一致。

## 边界

"用 Agent 把软件从定义做到发布"是 Desktop 与 alwith-dev 的职责，工具链安装是 Desktop Launchpad 的职责。U 的"新建 WorkBuddy"不复制这些：工具链检测安装抽一个包，项目创建与运行托管抽一个包，Desktop 与 U 都装。Desktop 面向"做任何软件"，U 面向"做自己的 WorkBuddy"，定位不冲突，实现不能有两份。
