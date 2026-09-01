## Why

这个仓库已经自然采用了 DSH 的多项原则（短 AGENTS.md、ADR 与当前文档分离、分层入口链、渐进披露），但有两类 DSH 指出的知识归属缺陷仍然存在：

1. **同一事实两处 home**：CLAUDE.md 独立于 AGENTS.md，且重复声明了 Node.js 版本号。当版本号变化时，两处都要改——必然漂移。
2. **负知识没有 home**：哪些方案已被否决、哪些能力已知受限——这些信息只活在人的记忆里，agent 反复提出已否决方案（例如"要不要用 Puppeteer做渲染？"）。

同时，ADR 已经有 `Status:` 行，但用的值不统一（`Superseded` vs `Accepted`），缺少完整的生命周期标记（没有 `rejected`、`archived`）。

本 change 不做架构改造，只做一件事：**把知识归属拧紧半圈**，使 agent 进入仓库时碰到的抗拒最小的路径就是正确路径。

## What Changes

- **CLAUDE.md 变 symlink**：把 CLAUDE.md 独有的内容（Trigger 触发词、四步入口流程）合并进 AGENTS.md，然后 CLAUDE.md 用 `ln -s` 指向 AGENTS.md。从此仓库级入口规则只有一个 home。
- **合并 Node.js 版本声明**：CLAUDE.md 和 AGENTS.md 各有一行 `Node.js 22.x、24.x 或 26.x`，统一为 AGENTS.md 唯一拥有，CLAUDE.md 不再持有。
- **ADR status 标准化**：给 `docs/adr/*.md` 加统一元数据块，使用受控词汇：`Proposed | Accepted | Superseded | Rejected | Archived`。现有 ADR 逐条加标签。
- **新建 `docs/known-limitations.md`**：作为负知识的 home。首批条目：不走 Puppeteer 路线、不做自动字体嵌入、不用 JSON Schema 管设计规则。

**非 BREAKING**：不改任何 CLI、管线、schema 或 run-bundle contract。纯文档变化。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `harness-charter`：新增一项 REQUIREMENT——agent 面对的知识（AGENTS.md、ADR、known-limitations）必须遵循 one-home-per-fact、current-state-vs-decision 分离、负知识外置。本 change 为这些原则提供第一个实例落实。

## Impact

| 影响面 | 说明 |
|--------|------|
| `AGENTS.md` | 吸收 CLAUDE.md 的 Trigger 词 + 入口流程；Node.js 版本唯一 home |
| `CLAUDE.md` | 变 symlink；内容合并到 AGENTS.md |
| `docs/adr/*.md` | 加 status 元数据块（共 7 文件） |
| `docs/known-limitations.md` | 新建 |
| Control owner | MD（文档组织规则） |
| Run-bundle contract impact | `none` |