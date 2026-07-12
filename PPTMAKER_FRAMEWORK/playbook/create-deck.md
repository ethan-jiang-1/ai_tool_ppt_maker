---
playbook: create-deck
description: 从初始化到交付的完整 deck workflow
includes: []
---

# Playbook: Create Deck

节点顺序：instantiation → hitl1 → setup → seed-topics → wave0 → wave1 → wave2 → hitl2 → readiness/rerun → final。

## Nodes

### instantiation

```yaml
node: instantiation
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [run-bundle, deck-guide]
entry: []
exit: [run_bundle_exists, deck_guide_created]
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor`。

**Step 2 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_<name> --deck-type <type> --style <style>`，不手工复制 preset。

**Step 3 — CLI**: 用 `createInitialState` + `writeState` 写入 schema v2 初始状态。

### hitl1

```yaml
node: hitl1
lifecycle_phase: 0
method_module: 00-setup
requires: [instantiation]
produces: [confirmed-intake]
entry: []
exit:
  - user_evidence:intake-confirmed
  - user_evidence:direction-confirmed
```

**Step 1 — MD**: 完成 topic/audience/duration/language/key-takeaway intake，并给出有理由的方向候选。

**Step 2 — GATE**: 用户确认 intake 和方向后分别记录 user evidence。

### setup

```yaml
node: setup
lifecycle_phase: 2
method_module: 01-visual
requires: [hitl1]
produces: [visual-system, style-master]
entry: []
exit:
  - visual_preset_seeded
  - style_master_exists
  - gate_approved:visual
  - user_evidence:style-master-reviewed
```

**Step 1 — MD**: 读取 `workflow/01-visual/`；确认 medium/preset，生成或迭代 style master。

**Step 2 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run-dir>`。

**Step 3 — GATE**: 必须 open `style_master.jpg`；满意后 `approve <run-dir> visual`、同步 state gate，并记录 `style-master-reviewed`。需要多轮时使用 `switchPlaybook(iterate-style)`。

### seed-topics

```yaml
node: seed-topics
lifecycle_phase: 1
method_module: 02-content
requires: [setup]
produces: [core-metaphor, core-formula, block-map]
entry: []
exit:
  - gate_approved:content
  - evidence:topics-generated
  - user_evidence:block-map-confirmed
```

**Step 1 — MD**: 读取 `workflow/02-content/`，生成核心隐喻、公式和 Block Map。

**Step 2 — GATE**: 用户确认 Block Map 后批准 content gate；记录 agent/user evidence。

### wave0

```yaml
node: wave0
lifecycle_phase: 1
method_module: 02-content
requires: [seed-topics]
produces: [slide-specifications-l1-l2-l4]
entry: [gate_approved:content, gate_approved:visual]
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
  - evidence:sources-collected
```

**Step 1 — MD**: 为每页完成 L1 Meta、L2 Concept、L4 Speaker Note；L3 保持明确占位。

**Step 2 — MD**: 收集并标注所需来源，记录 `l1-l2-l4-complete` 与 `sources-collected`（kind `agent`）。

### wave1

```yaml
node: wave1
lifecycle_phase: 2.7
method_module: 03-prompts
requires: [wave0]
produces: [validated-slide-specifications]
entry: []
exit:
  - slide_specs_valid
  - evidence:l3-prompts-filled
```

**Step 1 — MD**: 读取 `workflow/03-prompts/`，依据锁定的 visual system 填完所有 L3 IMAGE PROMPT。

**Step 2 — CLI**: 运行 Stage 1 使用的同一 validation contract，ERROR 清零后记录 `l3-prompts-filled`（kind `agent`）。

### wave2

```yaml
node: wave2
lifecycle_phase: 3
method_module: 04-production
requires: [wave1]
produces: [page-images, reviewed-header-evidence, final-pptx, notes-receipt]
entry: [gate_approved:content, gate_approved:visual]
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot <run-dir> --resolution 2k --force-images`。

**Step 2 — GATE**: Open contact sheet，审查 full-page header；运行 `approve <run-dir> header`，partial coverage 必须补足。

**Step 3 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir> --resolution 2k --reuse-images`，完成 Stage 3/4/5。

### hitl2

```yaml
node: hitl2
lifecycle_phase: 4
method_module: 05-iteration
requires: [wave2]
produces: [review-decision]
decisions: [proceed, repair, redirect]
entry: []
exit: [user_decision_recorded]
```

**Step 1 — MD**: 用户审阅最终 PPTX；说明 proceed、repair、redirect 三个明确出口。

**Step 2 — GATE**: 用 `setNodeDecision` 记录用户 decision。`redirect` 重置 hitl1 及其下游；不得伪装成 proceed。

### readiness

```yaml
node: readiness
lifecycle_phase: 4
method_module: 05-iteration
requires: [hitl2]
produces: [delivery-checklist]
entry: [node_decision:hitl2:proceed]
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
  - gate_approved:content
  - gate_approved:visual
  - evidence:delivery-checks-passed
```

**Step 1 — MD**: 检查页数、gates、PPTX、notes receipt、header review 和文件完整性。

**Step 2 — CLI**: 通过后记录 `delivery-checks-passed`（kind `agent`）。

### rerun

```yaml
node: rerun
lifecycle_phase: 4
method_module: 05-iteration
requires: [hitl2]
produces: [completed-repair]
entry: [node_decision:hitl2:repair]
exit: [evidence:repair-completed]
```

**Step 1 — MD**: 按反馈选择 edit-text/edit-visual/edit-notes/restructure-slides，并用 `switchPlaybook` 进入嵌套执行。

**Step 2 — CLI**: 子 playbook 完成并 `resumePlaybook` 后记录 `repair-completed`（kind `agent`），再重置并返回 hitl2。

### final

```yaml
node: final
lifecycle_phase: 4
method_module: 05-iteration
requires: [readiness]
produces: [delivered-deck]
entry: []
exit: [evidence:deck-delivered]
```

**Step 1 — MD**: 交付最终 PPTX、说明版本和可迭代入口。

**Step 2 — CLI**: 记录 `deck-delivered`（kind `agent`）并持久化完成状态。
