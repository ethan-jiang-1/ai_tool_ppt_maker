## Why

`create-deck` / 探索 playbook 已有 gate + show 节律（Change 1 已 archive），但**旁路「迁移/导入已有 deck」**没有方法论与 playbook。Agent 会即兴闷头搬文件、静默长跑、只文字描述，用户直到要出 PPTX 才发现从没见过任何视觉——交互节律在 off-path 上被绕开。本 change 给迁移/导入套上同一套护栏。

## What Changes

- 新建 `playbook/migrate-import.md`（六节点；early-show；reaffirm-gates；禁止静默）
- 新建 `workflow/00-setup/05-migrate-import-existing-deck.md`（**注意：`04-conventions.md` 已占用**）+ README 索引
- `COMMANDS.md`：「旁路 / 迁移」段
- `BOOTSTRAP.md`：旁路指针一句
- Spec：`playbook-execution`（8 控制器 + classify → 9 文件；旁路路由；migrate 要求）
- backlog：Change 2 保持前景状态

**非 BREAKING**：不改 CLI；不做自动搬家脚本；不替代 `create-deck`。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `playbook-execution`：注册 `migrate-import`；COMMANDS 旁路段；off-path 须 show / checkpoint / 闸门重申

## Impact

| 影响面 | 说明 |
|--------|------|
| `playbook/migrate-import.md` | 新建（Copy Deck D10） |
| `workflow/00-setup/05-migrate-import-existing-deck.md` | 新建 |
| `workflow/00-setup/README.md` | 索引一行 |
| `COMMANDS.md` / `BOOTSTRAP.md` | 路由 + 指针 |
| `openspec/specs/playbook-execution` | archive 时 sync |

**Out of scope**：自动迁移 CLI；任意非 deck 仓库；重开 Change 1；改 `ppt_flow`；partial PPTX。
