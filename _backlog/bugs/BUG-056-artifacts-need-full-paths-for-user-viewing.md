# BUG-056: Agent 让用户查看产物（中间图/PPT/评审图）时不提供完整路径

> 严重级别: P2 | 发现: 2026-08-05 | 状态: 活跃

## 症状

在 deck_dark_factory 生产过程中，Agent 多次要求用户查看产物（Style Master 候选图、Pilot/Expansion raw 图、
最终 PPTX），但没有给出**完整文件路径**，用户不知道在哪个目录看，只能猜测或要求再确认。

例：
- 「3 张 Pilot raw 图已打开」—— 没说是哪 3 个文件、在哪个目录
- 「deck.pptx 已构建」—— 没给出 PPTX 的完整路径
- 用户反馈：『你总得给个全路径吧，用户哪知道在哪儿看，给相对路径好吧』

## 根因

Agent 的产物查看习惯只做「open 打开」动作 + 口语化描述，没有**显式附带产物文件的完整路径（或 repo 相对
路径）**。用户不在 `open` 弹出的 viewer 场景时（或想自己找文件时）无从定位。

## 修复方向

在**每次要求用户查看产物**时（中间生成图、评审图、contact sheet、manifest、PPTX、delivery receipt 等），
消息中必须显式给出：
1. 产物的**完整绝对路径**（或至少 repo 相对路径，如 `deck_dark_factory/.../final/deck.pptx`）
2. 简短说明这是什么、怎么看

这是 Agent 沟通契约的一部分，不是代码逻辑改动。可以沉淀为 AGENTS.md / deck-guide.md 的操作规则，或在
每次展示产物时强制执行。

## 关联

- 触发于 deck_dark_factory 生产全程（Style Master / Pilot / Expansion / final）。
