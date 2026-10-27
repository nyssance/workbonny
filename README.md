# workbonny

**一句话**：下载 ALwith U，一小时内做出并装上一个自己的 WorkBuddy。workbonny 是第一个这样做出来的，顺便把脚手架 create-alwith 做出来。

**为什么**：ALwith 承诺"人人都能做自己的 WorkBuddy"，但到今天没有一个外人真的做出来过。自己扮演外人走一遍，坑就全暴露了。

**怎么做**

1. 先验最难的一步：云端构建出能装的 .dmg，看一小时够不够。
2. 从空目录手搭一个，只用 npm 上的公开包，记下每个坑。
3. 把手搭的过程变成 `bun create alwith`，内置进 U，U 里点"新建 WorkBuddy"，自己填应用名和 bundle id。
4. 让没见过代码的人从头走一遍，计时。

**做成什么样算完**：别人在干净电脑上，下载 U，一小时内装上自己的 WorkBuddy，能登录、聊天、审批、看历史，还改了一个自己的业务需求。

**好看是底线**：生成出来的第一眼就是成品水准的界面，不是开发者占位页。

**要装东西怎么办**：用户零基础，什么都不用自己装。要本地编译时，U 调 [Free](https://github.com/nyssance/Free) 一键装齐 Bun、Rust 这些。

**三条铁律**：不碰 ALwith 私有代码；坑记下来回上游修，不在这里绕；好东西先进包，U 再装。

**这轮不做**：画布型、宠物、手机端、改 U 的架构。

细则给 Agent 看：[AGENTS.md](AGENTS.md)、[plan](docs/plans/2026-10-27-own-workbuddy.md)、[决策](docs/decisions/index.md)。
