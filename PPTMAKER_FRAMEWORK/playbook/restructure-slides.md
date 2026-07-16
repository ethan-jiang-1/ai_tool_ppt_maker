---
playbook: restructure-slides
description: 结构变更——稳定身份 preview、确认提交、零远端发布与验证
includes: [classify-change]
---

# Playbook: 结构变更

## Nodes

### classify-change (shared)

确认增/删/重排意图。对话可以说“第 7 页”或“UX gap 那页”，但 Agent 必须先用 `ppt_flow slides resolve` 绑定到同一快照的正式 ID；位置只代表当前顺序，跨版本引用使用 ID。新增页的 mnemonic ID 由 Agent 根据内容命名，采用 5–8 个 ASCII 字母、恰好两个 BlockCase 语义块，优先 5–6 个字母，如 `UXGap`、`AICost`，不得把命名题甩给用户。

### new-version

```yaml
node: new-version
lifecycle_phase: 4
method_module: 05-iteration
requires: [classify-change]
produces: [new-version-dir]
entry: [run_bundle_exists]
exit: [evidence:new-version-created]
```

**Step 1 — MD**: 调用 `ppt_flow slides list/resolve` 展示 `position · slide_id · title`，再运行对应的 `move`、`delete`、`insert` 或 `apply-plan` preview。向用户展示 before/after、正文页码语义 warning 与预计 vNext；Agent 在内部保留完整 preview 和 `plan_sha256`，不要求用户抄 hash。selector 歧义、warning 需要内容判断、或 diagnostic `requires_human:true` 时停下确认。

**Step 2 — CLI**: 用户确认同一个 preview 后，原样重放该操作并同时传 `--apply --plan-sha256 <confirmed-hash>`。CLI 必须拒绝 bare apply、stale source 或 hash drift；发生 stale 时重新 preview，不把旧计划 rebase 到新源。提交通过 owned hidden staging 原子发布干净 vNext，并记录 edit receipt 与 `new-version-created`（kind `cli`）。

### regenerate-affected

```yaml
node: regenerate-affected
lifecycle_phase: 4
method_module: 04-production
requires: [new-version]
produces: [updated-pptx]
entry: []
exit:
  - pptx_generated
  - speaker_notes_injected
  - header_review_current
```

**Step 1 — MD**: 读取 edit/impact receipt。结构 apply 只授权 source/control vNext，不授权远端生图。先运行 renderer-free materialization：只按 stable ID + engine + `raw-render` kind + generation fingerprint/profile + byte SHA 物化可验证 raw；`legacy-located` 不算可复用证据。目标版本拥有自己的 raw manifest，Stage 3/contact sheet/PPTX/notes 都在目标本地重建。

**Step 2 — CLI**: 若 `needs_render=[]`，完成 Stage 3、带 `position · ID · title` 标签的 contact sheet、Stage 4 与 Stage 5，远端调用必须为零。若 receipt 返回 `needs_render`，先报告明确 ID、预计成本和 review 范围；只有用户已授权 Generated Image Rebuild 后，才用 `ppt_flow refresh --kind visual --only <ids>` 显式生成这些页。结构授权绝不能扩张成生图授权；verified approval 可按 ID/profile/raw SHA 在目标重建，waiver 不可沿用。

### verify-restructure-output

```yaml
node: verify-restructure-output
lifecycle_phase: 4
method_module: 05-iteration
requires: [regenerate-affected]
produces: [verified-structure]
entry: []
exit: [user_evidence:structure-change-verified]
```

**Step 1 — MD**: Open 最终 PPTX，按 `position · slide_id · title` 核对目标顺序、删除集合、插入内容、assembly receipt、notes-v2 ID 对齐、target-owned raw/final manifests，以及源版本未变。正文中的自然语言页码 warning 必须逐条人工确认。

**Step 2 — GATE**: 用户确认后记录 `structure-change-verified`（kind `user`）。若同一版上结构与语义约束已互相牵制，停止继续打补丁：小范围回退到新的 vNext；方案分叉或变化很大时建议另建版本；受众、主叙事或设计系统已分叉时建议新 deck，并说明原因与成本。
