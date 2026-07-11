---
playbook: migrate-import
description: 旁路——迁移/导入已有 deck（强制 show + 闸门）
includes: []
---

# Playbook: 旁路 — 迁移 / 导入

> 把已有资产迁进宪法树。禁止静默长跑、禁止只描述不 open、禁止「以前做过了」就跳过 gate。
> 方法论：`workflow/00-setup/05-migrate-import-existing-deck.md`。
> §11 全程有效。

## 迁法 A / B / C（intake 必须让用户认）

| 代号 | 策略 | 适用 |
|------|------|------|
| **A 新 init + 迁入** | `ppt_flow init deck_NEW …`，再把源资产拷/映射进新树 | 源很乱、或非 `deck_*` 命名 |
| **B 原地升三层** | 已有 `deck_*`，把扁平/`_build` 映射到 `2_backbone` + `3_versions/v1` + `_generated` | 旧框架 run bundle |
| **C 素材导入** | 只有 PPTX/图/markdown 碎片 → init 后填 `1_upstream` + 再走内容/视觉 | 无完整旧 bundle |

## Nodes

### intake-source
→ 定源、目标、迁法

```yaml
node: intake-source
phase: 00
requires: []
produces: [migration_plan]
entry: []
exit: [strategy_chosen]
```

**Step 1 — MD**: 确认源路径与目标 `deck_*` 名。
**Step 2 — MD**: 给出迁法 **A / B / C** + 推荐 + 理由；用户选。
**Step 3 — MD**: 写清成功标准（结构对齐、early-show 完成、gates 重申）。

### align-bundle
→ 对齐/校验宪法树

```yaml
node: align-bundle
phase: 00
requires: [intake-source]
produces: [run_bundle_aligned]
entry: [strategy_chosen]
exit: [structure_ok]
```

**Step 1 — MD**: 心跳——告知用户正在对齐结构。
**Step 2 — CLI**: 策略 A/C → `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_<NAME> --deck-type … --style …`；策略 B → `node PPTMAKER_FRAMEWORK/scripts/bundle_layout.mjs --check <run-dir> --structure-only`。缺目录按宪法补，不自创结构。

### inventory-map
→ 盘点与映射

```yaml
node: inventory-map
phase: 00
requires: [align-bundle]
produces: [asset_map]
entry: [structure_ok]
exit: [assets_mapped]
```

**Step 1 — MD**: 列出源资产 → 目标路径映射表（旧 `style/`→`2_backbone/visual-style/`；slide 源→`3_versions/v1/slide-specifications.md`；`_build`→`_generated` 等）。
**Step 2 — MD**: 用户确认映射后再搬；每完成一类资产 checkpoint 一次。禁止静默搬完再汇报。
**Step 3 — MD**: 提醒：绝不手改 `_generated/` 当源。

### early-show
→ 第一步看得见的赢

```yaml
node: early-show
phase: 00
requires: [inventory-map]
produces: [first_visible_win]
entry: [assets_mapped]
exit: [user_saw_artifact]
```

**Step 1 — MD**: 若存在 `style_master.jpg`（目标或源）或样张 → **必须 open**。
**Step 2 — MD**: 否则降级 show：open `2_backbone/visual-style/style-master-prompt.md` / 展示 `bundle_layout` 树 / 打开旧 PPT 首页（环境允许时）。
**Step 3 — Gate**: 有可展示图却只文字描述 → **不得** completed。

### reaffirm-gates
→ 重申 content + visual

```yaml
node: reaffirm-gates
phase: 00
requires: [early-show]
produces: [gates_reaffirmed]
entry: [user_saw_artifact]
exit: [gates_ok]
```

**Step 1 — MD**: content——**open** `3_versions/v1/slide-specifications.md`（或等价大纲）；用户认方向。
**Step 2 — MD**: visual——**open** `2_backbone/visual-style/style_master.jpg`（若无则说明并建议 `iterate-style`）。
**Step 3 — CLI/State**: 用户满意 → `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve <run-dir> content` 与/或 `visual`，并 `setGate` + `writeState`（双写）。
**Step 4 — MD**: 视觉不满意 → `switchPlaybook(iterate-style)`；回来后 `resumePlaybook`。

### handoff
→ 下一步

```yaml
node: handoff
phase: 00
requires: [reaffirm-gates]
produces: [next_action]
entry: [gates_ok]
exit: [handed_off]
```

**Step 1 — MD**: 推荐 `quick-preview`（gates 已批）或说明何时 `build`。
**Step 2 — MD**: 若用户要全量生图：先说明耗时与 checkpoint 计划；禁止静默开长 Stage 2。
