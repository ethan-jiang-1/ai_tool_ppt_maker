---
playbook: iterate-style
description: 探索——打磨 style master（1k 迭代 → LOCK 升 2k）
includes: []
---

# Playbook: 探索 — 视觉方向打磨

> pre-commitment。不是 post-PPTX 的 `edit-visual`。
> 入口：COMMANDS「探索」或 `create-deck` setup 经 `switchPlaybook`。
> 源文件：`2_backbone/visual-style/style-master-prompt.md` + `style_master.jpg`。
> 参考 checklist：`workflow/01-visual/04-iterate-review-lock.md`。
>
> 推荐时序：本 playbook LOCK visual →（内容就绪）→ `quick-preview` → `build`。
> **写盘:** 进出节点必须 `writeState`；`review-gate` 等人时写 `waiting_for`（如 `user:review-style-master`）+ 可选 `note`。

## 入口模式

| 模式 | 从哪来 | 从哪 node 起 |
|------|--------|--------------|
| A 独立 | COMMANDS「先定视觉」 | `start-iterate` |
| B 栈切入 | `create-deck` setup 审图不满意 | 已有 master → `tweak-prompt`；否则 `start-iterate` |
| C 锁后反悔 | visual 已 approved，用户要大改 | `start-iterate`；开场宣读下方硬规则 |

**模式 C 硬规则（无 un-approve CLI）：**

1. 开场告知：「视觉曾锁定；本轮未再次 LOCK 前，不要跑 `pilot` / `build`。」
2. 不手改 metadata 把 `visual_gate` 改回 pending；不新增 CLI。
3. 迭代照常；旧 `approved` 可暂留文件，行为上视为「重锁中」。
4. 再次 LOCK → 再跑 `approve visual`（幂等）+ 同步 `_state` gates。
5. BACK 且已改过 `style_master.jpg` → 警告图可能与旧锁不一致；建议 LOCK 或从 `1_upstream_raw_material/style-master-iterations/` 恢复。

## Nodes

### start-iterate
→ 读现状、定本轮打磨目标

```yaml
node: start-iterate
phase: 02
requires: []
produces: [iterate_goals]
entry: []
exit: [goals_confirmed]
```

**Step 1 — MD**: 读 `2_backbone/visual-style/style-master-prompt.md` + `style_master.jpg`（若有则 **open**）。无 prompt 则从 preset README 播种到该路径。
**Step 2 — MD**: 模式 C → 宣读硬规则第 1 条。
**Step 3 — MD**: 确认用户最不满意的 1–3 个维度。`setNodeStatus(state, 'start-iterate', 'completed', { round: 0 })`（或保持已有 round）。

### tweak-prompt
→ 按反馈改 prompt

```yaml
node: tweak-prompt
phase: 02
requires: [start-iterate]
produces: [style-master-prompt.md]
entry: [goals_confirmed]
exit: [prompt_updated]
```

**Step 1 — MD**: 大改动先把旧版拷到 `1_upstream_raw_material/style-master-iterations/`。
**Step 2 — MD**: 改 `2_backbone/visual-style/style-master-prompt.md`。
**Step 3 — MD**: 若 `round ≥ 5`，建议换 medium/preset 或接受当前版。

### generate
→ 1k 出图

```yaml
node: generate
phase: 02
requires: [tweak-prompt]
produces: [style_master.jpg]
entry: [prompt_updated]
exit: [master_generated]
```

**Step 1 — CLI**: `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run-dir> --force --resolution 1k`
（长出图：转述 stdout `phase=submit|poll` / `Mirror failed`；勿静默干等。API/502/全挂且未 probe → 白话亮能力，可切 `probe-image-channels`。）
**Step 2 — MD**: `setNodeStatus` 递增 `round`（写在当前 node extra）。

### review-gate
→ 用户看图；LOCK / RETRY / BACK

```yaml
node: review-gate
phase: 02
requires: [generate]
produces: [visual_gate_decision]
entry: [master_generated]
exit: [visual_locked | retry | direction_rejected]
```

**Step 1 — MD**: **必须 open** `2_backbone/visual-style/style_master.jpg`。禁止只描述。
**Step 2 — Gate**:
- **RETRY** → 回 `tweak-prompt`
- **BACK** → 回 Phase 2.1 重选 medium/preset；不 approve；若已改图则按模式 C 第 5 条警告
- **LOCK**（顺序固定）:
  1. `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve <run-dir> visual`
  2. `setGate(state, 'visual', 'approved')` + `writeState`
  3. 可选：`ppt_flow.mjs style-master <run-dir> --force --resolution 2k`
  4. 若有 `playbook_stack` → `resumePlaybook`
