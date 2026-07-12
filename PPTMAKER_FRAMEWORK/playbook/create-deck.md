---
playbook: create-deck
description: 全量创建——从零开始做一个PPT, ~11 nodes
includes: []
---

# Playbook: 全量创建

> 从零开始做一个 PPT. 11 个 node, 按顺序执行.
> **写盘:** 进出节点必须 `writeState`；等人时在当前 node 写 `waiting_for` / `note`（断线后续跑靠盘，不靠聊天）。

## Nodes

### instantiation
→ 创建 run bundle

```yaml
node: instantiation
phase: 00
requires: []
produces: [run_bundle, project-metadata.yaml]
entry:
  - node_status:instantiation:completed
exit:
  - run_bundle_exists
  - deck_guide_created
```

**Step 1 — CLI**: `node scripts/env-check.mjs`
**Step 2 — CLI**: `node scripts/bundle_layout.mjs --init deck_<name> [--deck-type X] [--style Y]`
**Step 3 — CLI**: 写 `_state/state.yaml` 初始状态

### hitl1
→ 人机交互: 确认方向/profile/topics

```yaml
node: hitl1
phase: 00
requires: [instantiation]
produces: [intake_decisions]
entry:
  - run_bundle_exists
exit:
  - intake_complete
  - user_confirmed_direction
```

**Step 1 — MD**: 5 问题 intake (topic/audience/duration/language/key-takeaway). Agent 推荐 2-3 个候选, 用户选.
**Step 2 — MD**: 确认结果写入 state

### setup
→ 配置 research profile + 视觉 preset

```yaml
node: setup
phase: 01
requires: [hitl1]
produces: [color_palette.json, deck_system.txt, style-master-prompt.md]
entry:
  - intake_complete
exit:
  - visual_preset_seeded
```

**Step 1 — MD**: 读 workflow/01-visual/. 推荐 2-3 个 visual preset, 用户选一个.
**Step 2 — CLI**: `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master <run-dir>`（prompt 源：`2_backbone/visual-style/style-master-prompt.md`；转述 client 进度日志）
**Step 3 — Gate**: **必须 open** `2_backbone/visual-style/style_master.jpg`（禁止只描述）。一次满意 → `ppt_flow.mjs approve <run-dir> visual`，并同步 `_state`：`setGate(state, 'visual', 'approved')` + `writeState`，再进 seed-topics。用户要多轮打磨 → `switchPlaybook` 进入 `iterate-style`（勿只改文案过 gate）；回来后 `resumePlaybook`。

### seed-topics
→ 生成初始 topic 列表

```yaml
node: seed-topics
phase: 02
requires: [setup]
produces: [topic_list, block_map]
entry:
  - gate_approved:visual
exit:
  - topics_generated
  - block_map_confirmed
```

**Step 1 — MD**: 读 workflow/02-content/. 生成核心隐喻 + 公式 + Block Map.
**Step 2 — MD**: 用户确认. 更新 state: content_gate → approved

### wave0
→ 基础证据收集

```yaml
node: wave0
phase: 04
requires: [seed-topics]
produces: [slide-specifications.md (L1/L2/L4 filled), foundation-sources]
entry:
  - gate_approved:content
  - gate_approved:visual
exit:
  - slide_specs_l1_l2_l4_complete
  - wave0_sources_collected
```

**Step 1 — MD**: 读 workflow/02-content/. 为每页 slide 填 L1 Meta + L2 Concept + L4 Speaker Note. L3 Image Prompt 留占位.
**Step 2 — CLI**: `node scripts/stage1_build_inputs.mjs --spec <path> --out <dir> --validate`

### wave1
→ 深度证据收集 (L3 Image Prompt 回填)

```yaml
node: wave1
phase: 04
requires: [wave0]
produces: [slide-specifications.md (L3 filled)]
entry:
  - slide_specs_l1_l2_l4_complete
exit:
  - all_l3_prompts_filled
  - stage1_validate_passes
```

**Step 1 — MD**: 读 workflow/03-prompts/. 为每页 slide 写 L3 Image Prompt (参考 style_master.jpg + deck_system.txt).
**Step 2 — CLI**: `node scripts/stage1_build_inputs.mjs --spec <path> --out <dir> --validate`

### wave2
→ 生产管线: pilot → full generation

```yaml
node: wave2
phase: 04
requires: [wave1]
produces: [page_images_full/*.png, header_locked/*.png, .pptx]
entry:
  - all_l3_prompts_filled
exit:
  - pptx_generated
  - speaker_notes_injected
```

**Step 1 — CLI**: `node scripts/unified_pipeline.mjs --run-dir <dir> --stage 1`
**Step 2 — CLI**: `node scripts/ppt_flow.mjs pilot <dir> --resolution 2k --force-images`（使用计划 production profile；自动优先覆盖 1-2 张 content full-page）
**Step 3 — MD**: open contact sheet，检查 header 准确性、清晰度、位置、字号、左对齐、跨页一致性和 body overlap。手工 subset 覆盖不足就补跑。问题页只有用户确认后才升级 `render.header-lock`，并按 Chain B 重生重审。
**Step 4 — CLI**: `node scripts/ppt_flow.mjs approve <dir> header`。partial evidence 必须继续补足；既有 visual approval 不能替代 header evidence。
**Step 5 — CLI**: `node scripts/ppt_flow.mjs build <dir> --resolution 2k --reuse-images`（保留 reviewed hashes，生成未缓存页，再完成 Stage 3/4/5）

### hitl2
→ 人机交互: 审阅 synthesis

```yaml
node: hitl2
phase: 05
requires: [wave2]
produces: [review_decision]
entry:
  - pptx_generated
exit:
  - review_complete
```

**Step 1 — MD**: 用户审阅生成的 .pptx. 三个出口: (a) 满意 → readiness, (b) 要修 → rerun, (c) 方向错 → 回 hitl1

### readiness
→ 最终交付前检查

```yaml
node: readiness
phase: 05
requires: [hitl2]
produces: [final_pptx]
entry:
  - review_decision:proceed
exit:
  - all_checks_pass
```

**Step 1 — MD**: 检查清单: 页数对, gate 全批, 备注注入, 文件完整

### rerun
→ 重跑/修复循环

```yaml
node: rerun
phase: 05
requires: [hitl2]
produces: [fixes_applied]
entry:
  - review_decision:repair
exit:
  - fixes_confirmed
```

**Step 1 — MD**: 按用户反馈分类 → 选 edit-text/edit-visual/edit-notes/restructure-slides. 修完后回到 hitl2 再审

### final
→ 最终报告生成

```yaml
node: final
phase: 05
requires: [readiness]
produces: [final-deliverable.pptx]
entry:
  - all_checks_pass
exit:
  - deck_delivered
```

**Step 1 — MD**: 交付. 更新 state: playbook completed
