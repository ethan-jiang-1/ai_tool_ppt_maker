## Why

`create-deck` / 探索 playbook 已有 gate + show 节律（Change 1），但**旁路「迁移/导入已有 deck」**没有方法论与 playbook。Agent 会即兴闷头搬文件、静默长跑、只文字描述，用户直到要出 PPTX 才发现从没见过任何视觉——交互节律在 off-path 上被绕开。本 change 给迁移/导入套上同一套护栏。

## What Changes

- 新建 `playbook/migrate-import.md`：旁路迁移 MD Controller（intake → 对齐 bundle → 盘点映射 → **早期 show** → 重申 gates → handoff）
- 新建方法论页（建议 `workflow/00-setup/04-migrate-import-existing-deck.md`）：何时用、与 `create-deck` 边界、旧布局对照、禁止裸奔
- `COMMANDS.md`：新增「旁路 / 迁移」路由段
- `BOOTSTRAP.md`：一句指针——已有 deck 迁入走 `migrate-import`，勿当 `create-deck` 静默重做
- Specs：`playbook-execution`（注册第 8 个 MD Controller；COMMANDS；off-path 须遵守 show/心跳）
- 更新 `_backlog/plans/README` Change 2 状态；无新 plan 可关（原理已在 CLS-001）

**非 BREAKING**：不改 CLI；不做自动搬家脚本；不替代 `create-deck`。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `playbook-execution`：增加 `migrate-import` playbook 与 COMMANDS 旁路路由；明确 off-path 仍须 show / checkpoint / 闸门重申

## Impact

| 影响面 | 说明 |
|--------|------|
| `playbook/migrate-import.md` | 新建 |
| `workflow/00-setup/04-migrate-import-existing-deck.md` | 新建方法论 |
| `COMMANDS.md` / `BOOTSTRAP.md` | 路由 + 入口指针 |
| `workflow/00-setup/README.md` | 链到新页（若有索引） |
| `openspec/specs/playbook-execution` | archive 时 sync（控制器计数 7→8 + classify） |

**Out of scope**：自动迁移 CLI；全量改写旧 bundle 布局工具；重开 Change 1；partial PPTX；改 `ppt_flow` 行为。
