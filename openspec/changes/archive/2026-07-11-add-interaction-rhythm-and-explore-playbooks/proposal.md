## Why

框架方法论已写「用户做选择题 / gate / pilot」，但协议未固化成硬规则（show ≠ tell、长任务要心跳、信心校准步长），且 COMMANDS 缺「探索」类入口——视觉打磨与 3 页快览只能即兴跑 CLI。小白与强 AI 协作时，第一次 UX 容易闷头长跑、只文字描述、从不 `open` 实物。本 change 把**交互节律**钉进契约，并用两个探索 playbook 作为第一批可执行样板（Change 2 `guard-offpath-migrate-import-ux` 另做旁路迁移护栏）。

## What Changes

- `charter/AGENT_CONTRACT.md`：新增 §11「**交互节律**」（一条铁律内的最短可执行子弹，压 8 原则）；标题「10 条」→「11 条」
- 全仓「10 条铁律」措辞对齐（`BOOTSTRAP.md`、`CLAUDE.md`、根 `CLAUDE.md` 等）
- `BOOTSTRAP.md`：视觉/pilot gate 前必须 `open` 实物；允许 pre-key 降级 show
- 新建 `playbook/iterate-style.md`：style master 打磨 loop（1k → LOCK 升 2k；`round`；栈可切入）
- 新建 `playbook/quick-preview.md`：validate → pilot → review（须 gates 已批；open contact sheet）
- `COMMANDS.md`：插入「探索 & 预览」；划清 ≠ `edit-visual`
- `create-deck` `setup` + `edit-visual` pilot：gate 步强制 show；深度打磨可 `switchPlaybook` → `iterate-style`
- Specs：`framework-charter` + `playbook-execution`
- **落地文案钉死在 design D13 Copy Deck**（§11 原文、playbook 骨架、COMMANDS 表、LOCK 双写）；apply 照抄
- 关闭两份 plan → `_closed_plans/`（migrate 留给 Change 2）

**非 BREAKING**：不改 CLI 代码/行为；不改 state schema；不加 migrate。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `framework-charter`：AGENT_CONTRACT 须含交互节律；废除「内容自 restructure 冻结」；BOOTSTRAP 要求 gate 前呈现实物
- `playbook-execution`：注册探索 playbook；COMMANDS 探索路由；视觉 review 须 show；目录计数 5+1 → 7+1

## Impact

| 影响面 | 说明 |
|--------|------|
| `charter/AGENT_CONTRACT.md` | §11 + 标题条数 |
| `BOOTSTRAP.md` / `CLAUDE.md` / 根 `CLAUDE.md` | open 规则 +「11 条」措辞 |
| `playbook/iterate-style.md` / `quick-preview.md` | 新建 |
| `COMMANDS.md` | +探索段落 |
| `playbook/create-deck.md` / `edit-visual.md` | gate show；setup→iterate-style 指针 |
| `openspec/specs/framework-charter` | archive sync（含 Purpose 若需） |
| `openspec/specs/playbook-execution` | archive sync（Purpose「six files」→ 新计数） |
| `_backlog/plans/*` | 两 plan → CLS |

**Out of scope**：`guard-offpath-migrate-import-ux`；改 `ppt_flow` / pipeline；partial PPTX；合并双闸门；重写旧铁律 §1–10。
