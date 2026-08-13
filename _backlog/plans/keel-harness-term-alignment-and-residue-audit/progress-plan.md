# Progress Plan — 落地顺序

> 2026-08-13 | 体检结论 → openspec change 的排期。`plan.md` 是体检计划；本文件是「怎么分批落地」。

## 三轨拆分

| # | 轨道 | 类型 | 内容 | 顺序 |
|---|---|---|---|---|
| C1 | `retire-lifecycle-phase-numbering` | openspec change（代码 + spec + 文档） | 退休 `lifecycle_phase` / "Phase N"，收敛到 `method_module` | 1（用户已选） |
| C2 | `align-harness-terminology-and-authority` | openspec change（文档 + spec） | 术语/权威对齐：CONTEXT 接线 + 调和、CONSTITUTION 陈旧树、schema 补清单、"11 铁律"标签、playbook 描述、intent-route 名、init 命令、workflow 三义、slide_id casing、Protected Zone | 2 |
| H | housekeeping（非 openspec） | 直接改 + 逐项确认 | 删 `.DS_Store`/`.env.saved`/`skills-lock.json`；刷新 `.env.example`、`_backlog` 两个 README、`docs/adr/0005–0007` 状态；处理 2 个 open 项（todo、`_suspeded_plans/`） | 可与 C1 并行 |

## C1 作用域（已 grep 证实）

- `lifecycle_phase` 出现在：
  - `playbook/*.md` frontmatter —— `create-deck.md` 50+ 处（phase 0/1/2/4/5）；`edit-text/edit-visual/edit-notes/restructure-slides/classify-change` 全为 phase 5。**每一处 `lifecycle_phase` 的下一行都已配好 `method_module`** → `lifecycle_phase` 是冗余字段，可安全移除。
  - 代码 `scripts/shared/state/md_controller_reader.mjs` —— 解析 `lifecyclePhase`（:148）+ 校验（:394 `unsupported-phase`、:403 `lifecycle-phase`、:415/:418 `target-lifecycle`）。
  - prose "# Phase N"：`workflow/00-setup|01-content|02-visual-system/README.md`、`scripts/01-content|02-visual-system/internal/README.md`、若干 presets。
  - 守卫正则：`scripts/contracts/harness_coherence.mjs:149`（含 "5 个 Phase" 片段）。
  - 测试：`tests/shared/state/test_md_controller_reader.mjs`、`test_target_authoring_draft_route.mjs`。

### phase → method_module 映射（退休前要固化进文档）

| `lifecycle_phase` | `method_module` |
|---|---|
| 0 | 00-setup |
| 1 | 01-content |
| 2 | 02-visual-system |
| 4 | 05-delivery |
| 5 | 06-iteration |

（旧编号缺 phase 3 —— 这正是两套编号并存造成的坑。）

## 顺序与依赖

1. **C1 先做** —— 代码改动 + 清掉 `workflow/*` 里的 "# Phase N" 标题，避免与 C2 抢同一批文档。
2. **C2 随后** —— 纯文档/spec，依赖 C1 把 workflow 标题改成 method-module 风格后再对齐其余术语。
3. **H 独立** —— 可与 C1 并行；删除/改名类逐项经你确认。

## 状态

- [x] C1 propose（已归档至 `openspec/changes/archive/2026-08-13-retire-lifecycle-phase-numbering/`，主规范已同步）
- [x] C1 apply + archive（focused tests、`npm test`、`openspec validate --all --strict`、`git diff --check` 均通过）
- [x] C2 propose（`align-harness-terminology-and-authority` 的 proposal/specs/design/tasks 已完成并通过 strict validation）
- [x] C2 apply + archive（已归档至 `openspec/changes/archive/2026-08-13-align-harness-terminology-and-authority/`；focused docs-consistency test、`npm test`、`openspec validate align-harness-terminology-and-authority --strict`、`openspec validate --all --strict`、`git diff --check` 均通过，主规范已同步）
- [ ] H 逐项确认 + 执行

## 下一步

术语和权威对齐工作（C1、C2）已经完成；没有 active OpenSpec change。接下来仅剩 H housekeeping，按 `residue-list.md` 的确认顺序推进：

1. 确认旧 deck todo 是归档还是继续维护。
2. 确认 `_suspeded_plans/` 与 sibling `_suspened_bugs/` 是更名，还是保留历史路径并补索引。
3. 以上决定明确后，删除三个零引用的 gitignored 残留，并刷新 `.env.example`、两个 `_backlog` README 与 ADR 0005–0007 的状态。
