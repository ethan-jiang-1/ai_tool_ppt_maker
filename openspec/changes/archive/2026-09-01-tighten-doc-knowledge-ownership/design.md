## Context

当前仓库已经有两处 DSH 识别出的知识归属缺陷，见 `proposal.md - Why`。本 design 只解决这四个具体问题，不做架构改造。

现状：

- `CLAUDE.md` 和 `AGENTS.md` 同时声明 `Node.js 22.x、24.x 或 26.x` — 两处 home，必然漂移
- `CLAUDE.md` 的 Trigger 触发词和四步入口流程只在该文件里 — 不属于任何 spec、没有 owner
- ADR 有 `Status:` 行，但值集不一致（`Superseded` / `Accepted`），缺少 `Rejected`、`Archived`
- 负知识没有归档 home — 不走的路、已知限制散落在个人记忆里

## Goals / Non-Goals

**Goals:**

1. `CLAUDE.md` 变 symlink，合并它独有的事实到 `AGENTS.md`
2. `AGENTS.md` 成为 Node.js 版本声明的唯一 home
3. ADR 统一使用受控状态词汇
4. 建立 `docs/known-limitations.md` 作为负知识 home

**Non-Goals:**

- 不改任何 JS/CLI 代码、管线、schema 或 run-bundle contract
- 不改 `ppt_maker_harness/AGENTS.md` 或 `ppt_maker_harness/CLAUDE.md`（这两处已在 correct state：CLAUDE.md 是 BOOTSTRAP.md 的 redirect）
- 不加可执行检查脚本（exit non-zero 的 verify 脚本）— 那是后续 change
- 不改变 `docs/adr/` 的文件名或 `docs/` 的子目录结构
- 不为 CLAUDE.md 的 Trigger 词逻辑单独设计触发系统

## Decisions

### D1 — CLAUDE.md 用 symlink 而非 copy

| 方案 | 结论 |
|------|------|
| CLAUDE.md 保持独立但去掉重复行 | 仍有两份文件都为「入口」负责，未来添加规则时不知道写哪里 |
| CLAUDE.md 删掉，只留 AGENTS.md | Claude Code 需要 CLAUDE.md 才能自动加载 |
| **CLAUDE.md → symlink 指向 AGENTS.md** | **选这个**。文件系统强制 one home：编辑 AGENTS.md 自动生效；Claude Code 通过 symlink 正常发现 |

DSH 的 `docs/AGENTS.md` 明确写 `CLAUDE.md symlinks AGENTS.md at root`。这就是那个机制的照搬。

### D2 — CLAUDE.md 独有内容合并进 AGENTS.md 的哪部分

CLAUDE.md 现在有：

```
## Trigger
如果用户提到: **ppt, deck, …** — 进入 PPT 制作模式.

## 入口
1. Read AGENTS.md — repo 级 agent 指引
2. Read ppt_maker_harness/BOOTSTRAP.md — 三步启动
3. Read ppt_maker_harness/charter/AGENT_CONTRACT.md — Agent Contract
4. 按当前 method module / MD Controller guidance 读 ppt_maker_harness/AGENTS.md

## 技术栈
Node.js 22.x、24.x 或 26.x ESM (.mjs). 回归测试: npm test.
```

合并方案：
- **Trigger 词** → 放进 AGENTS.md 头部，作为「这是什么项目」后的第一段。它本来就是「agent 进入仓库时应该知道」的常驻规则。
- **四步入口** → 放进 AGENTS.md「从哪里开始」作为第一步。它现在已经有「做 PPT → 读 BOOTSTRAP」等三路分流，Trigger 后的入口顺序是这条路由的补充。
- **Node.js 版本** → 合并到 AGENTS.md 现有的一行（第 9 行），CLAUDE.md 不再持有。
- **回归测试** → 合并到 AGENTS.md「快速命令」表里。

### D3 — ADR status 标准化格式

现有 `Status:` 行在文件第 3 行（`# title` + 空行后），格式是 `Status: Accepted`。统一改为 `## Status: Accepted`（H2 标题形式），与文件的其他 H2 标题（`## Considered Options` 等）对齐。

受控值集：`Proposed`、`Accepted`、`Superseded`、`Rejected`、`Archived`。

现有 7 个 ADR 的更新：
- `0002`–`0007`：`Status: Accepted` → `## Status: Accepted`（格式统一，语义不变）
- `0001`：`Status: Superseded` → `## Status: Superseded`（格式统一，语义不变）

### D4 — `docs/known-limitations.md` 的定位

放在 `docs/` 下而不是 `docs/adr/` 下，因为负知识不全是 "Architectural Decision Record" 级别的记录——有些只是「这个能力为什么不提供」的日常笔记。与 ADR 的关系：

| 知识类型 | home |
|----------|------|
| 一个正规决定（选 A 不选 B） | `docs/adr/` |
| 已知限制、不提供的功能、不走的路 | `docs/known-limitations.md` |

如果某个负知识后来被重新考虑并做出了正式决定，那个决定进 ADR，已知限制文件里标记为 `→ superseded by ADR-000X`。

**首批条目：**
- 3D 模型/图表动画 — pptxgenjs 不支持
- 字体嵌入 — 需要 LibreOffice 转换，管线不包含
- Puppeteer 渲染 — 否决，太重且 @napi-rs/canvas 够用
- JSON Schema 管设计规则 — 否决，Controller prose 更灵活
- bash 管线 — 绝对禁止的生产依赖

### D5 — 不写的文件

`AGENTS.md` 和 `CLAUDE.md` 的变更只涉及 repo 根目录的两个文件。`ppt_maker_harness/AGENTS.md` 和 `ppt_maker_harness/CLAUDE.md` 已经处于正确的 symlink 状态（`ppt_maker_harness/CLAUDE.md` → 指向 `BOOTSTRAP.md` 的 redirect）。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| symlink 后 Claude Code 的行为变化 | 已验证：Claude Code 通过 symlink 正常解析文件，行为与独立 CLAUDE.md 一致 |
| ADR status 值集可能漏更新 | 所有 7 个 ADR 在 tasks 里逐条列出，apply 时逐条核对 |
| `known-limitations.md` 创建后没人维护 | 本 change 只建立 home 和前几条填充；后续 OpenSpec change 遇到否决决定时有义务往里加。这不是一次性装修，是持续纪律 |
| Trigger 词从 CLAUDE.md 移走可能影响 Claude Code 自动触发 | Claude Code 读取的是文件内容，不是文件名；内容移到 AGENTS.md 后不影响匹配 |

## Migration Plan

纯文档变更。Rollback = 删除 `docs/known-limitations.md` + 恢复 `CLAUDE.md` 为独立文件 + 还原 `AGENTS.md` 的添加内容 + 还原 ADR status 格式。

## Open Questions

_无。_