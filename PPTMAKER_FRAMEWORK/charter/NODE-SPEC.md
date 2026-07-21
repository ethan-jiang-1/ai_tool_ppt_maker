# Node 规格宪法

> 本文定义 MD Controller 的 Playbook Node、state schema 与 gate 条件。`playbook/*.md` 是工作流内容、节点顺序与声明的唯一真相源；`scripts/shared/state/md_controller_reader.mjs` 只负责读取、解析、索引和校验，不定义、生成、修改或执行 playbook。

## 规范层级

- **Lifecycle Phase**：`0 → 1 → 2 → 3 → [4 optional/authorized] → 5`
- **Method Module**：`00-setup`、`01-content`、`02-visual-system`、`03-html-production`、`04-image2-refinement`、`05-iteration`
- **Pipeline Stage**：生产脚本 Stage 1–5
- **Playbook Node**：MD Controller 中的有序执行节点

这四个层级不可混称。尤其禁止用旧字段 `phase: 04` 表示 Method Module。

## Node 声明

有序 controller 在 Markdown 中使用 fenced YAML；standalone shared node 使用文档 frontmatter。每个 node ID 必须是全局唯一 kebab-case，且不得占用系统保留 ID `header-review`、`html-content-review`、`html-visual-review`、`html-delivery-review`、`html-production-reset`、`image2-refinement`。只有 `image2-refine` controller 可声明 lifecycle 4/module `04-image2-refinement`，且 entry 必须要求 marked HTML-first 与 current delivery review。

```yaml
node: author-structured-content
lifecycle_phase: 1
method_module: 01-content
requires: [checkpoint-intake]
entry: []
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
produces: [slide-specifications]
```

必填字段：`node`、`lifecycle_phase`、`method_module`、`requires`、`entry`、`exit`。可选字段包括 `produces`。控制后续分支的 GATE node 还必须声明非空、无重复的 `decisions` enum。

`requires` 是唯一 node-to-node 前置机制：runtime 会在显式 `entry` 之前把每项按 `node_done:<id>` 检查。不要在 `entry` 重复前驱完成条件。

## Node body

每个 node 至少包含一个 canonical step；编号从 1 开始单调递增，类型只能是 MD、CLI、GATE：

```markdown
**Step 1 — MD**: 读方法论、做判断或更新源文件。

**Step 2 — CLI**: 运行完整 Node 命令或调用 state API。

**Step 3 — GATE**: 向用户展示可审查产物，记录 typed decision/evidence。
```

禁止 `CLI/State` 等混合标签；需要分别落成 CLI 与 MD/GATE step。

## State Schema v4

State 位于 run bundle 根目录 `_state/state.yaml`，由 `scripts/shared/state/state.mjs` 原子写入。`history.jsonl` 仅供审计，不参与恢复。默认 read 会按检测到的 `production.pipeline` 依序迁移 v1/v2→v3，再在 v3→v4 边界为每个可见 version 用 canonical marker probe 填充 `production_mode.by_version`（`html-first-v1 -> html-only`，markerless `legacy -> image2-only`），且二次读取幂等。post-v4 缺失/非法 mode 视为 corruption，fail closed 而非重新推断。缺失/冲突 marker 或无法一对一映射的旧 node 必须返回 `replacement_required`，保留原 bytes；markerless 旧生产只映射到 `legacy-image2-maintenance`，HTML work 只映射到 HTML controllers。

```yaml
schema_version: 4
pipeline: html-first-v1            # actual-pipeline 兼容投影；不再是路由权威
production_mode:                   # v4：每 version 的权威生产意图（路由 SSOT）
  by_version:
    3_versions/v1:
      mode: image2-only            # html-only | html-then-image2 | image2-only
playbook: create-deck
current_node: author-structured-content
execution_id: exec-...
execution_started_at: 2026-07-12T06:00:00.000Z
started_at: 2026-07-12T05:00:00.000Z   # 整个 workflow 的稳定开始时间
updated_at: 2026-07-12T06:20:00.000Z

nodes:
  author-structured-content:
    status: in_progress
    execution_id: exec-...
    evidence:
      sources-collected:
        met: true
        kind: agent
        at: 2026-07-12T06:15:00.000Z
  checkpoint-final-review:
    status: completed
    execution_id: exec-...
    decision:
      value: proceed
      kind: user
      at: 2026-07-12T06:18:00.000Z

gates:
  content: approved
  visual: approved

playbook_stack:
  - playbook: create-deck
    current_node: rerun
    execution_id: exec-parent
    execution_started_at: 2026-07-12T06:00:00.000Z
    controller_nodes: {}
```

### Execution working set

顶层 `nodes` 只包含当前 execution 的 controller working set，加上独立 freshness contract 管理的系统保留记录（`header-review`、`html-content-review`、`html-visual-review`、`html-delivery-review`、`html-production-reset`）。controller record、evidence 与 decision 都必须匹配当前 `execution_id`；旧 execution 不能授权新 execution。HTML records 只能存在于 `nodes[reserved_id].by_version["3_versions/vN"]`，并绑定 normalized `run_version` 与 nullable current reset ID。

- `startPlaybook`：顶层启动新 execution；清理旧 controller records，保留系统记录。未完成 execution 只有显式 `{replace:true}` 才能替换；stack 非空时禁止调用。
- `switchPlaybook`：把 parent 的 `{playbook,current_node,execution_id,execution_started_at,controller_nodes}` 深拷贝进 stack，再创建干净 child execution。
- `resumePlaybook`：丢弃 child controller working set，恢复五字段 parent snapshot，同时保留最新系统记录。
- legacy pointer-only stack 无法恢复 provenance 时，heal 成安全阻塞 snapshot，并记录诊断；禁止猜测归属。

### Status enums

Node status 只能是 `pending`、`in_progress`、`completed`、`skipped`、`failed`。Gate status 只能是 `pending`、`approved`、`waived`。writer 拒绝其他值；heal 把非法持久值降级为阻塞的 `pending` 并保留诊断。重启 completed node 会清掉旧 `completed` 时间；完成 node 会清掉不兼容的 failure 字段。

### Typed evidence 与 decision

Evidence 形状：`{met:true, kind:"user"|"agent"|"cli", at:<ISO>, note?:<string>}`。

Decision 形状：`{value:<declared enum>, kind:"user"|"agent"|"cli", at:<ISO>, note?:<string>}`。

用 `setNodeEvidence` 与 `setNodeDecision` 写入；decision value 必须存在于 canonical node 的 `decisions` enum。legacy boolean/scalar 只可保守迁移为 `kind: agent`，绝不能伪造用户批准。

## Production Mode (v4 SSOT)

每个 canonical run version 的生产意图由 `_state/state.yaml` 的 `production_mode.by_version["3_versions/vN"].mode` 唯一记录，封闭词表为 `html-only`、`html-then-image2`、`image2-only`。`project-metadata.yaml` 的 `production_mode`/`production_mode_run_version` 仅是非权威镜像；缺失或漂移时 status 报告可修复 drift，但绝不能用 metadata 覆盖 state。

封闭映射（由 `scripts/shared/run-bundle/production_mode.mjs` 单一拥有，调用方不得私存映射表）：

| mode | pipeline | page authority | refinement | style-master |
|------|----------|----------------|------------|--------------|
| `html-only` | `html-first-v1` | html | disabled | reserved-html-adapter |
| `html-then-image2` | `html-first-v1` | html | required | reserved-html-adapter |
| `image2-only` | `legacy-image2-first` | image2 | not-applicable | current |

`legacy-image2-first` 是 markerless whole-page 分支的**规范化名称**，绝作为 source frontmatter 写入。新 deck 的 omitted-mode 默认为 `image2-only`（`ppt_flow init --mode` 可显式选择 HTML 路径）。`html-only <-> html-then-image2` 是同管道原子切换；`html-* <-> image2-only` 跨管道切换返回 `transition_required`，不就地改写。

Controller frontmatter 可声明 `supported_production_modes`；node 可声明 `production_modes`（其子集）。canonical index 按权威 mode 计算 active node 集：inapplicable node 不标 `skipped`、不删记录，只是不在 active 工作集内。`skipped` 仍只表示显式人工 bypass。

## CLI ⇔ MD 协议

- MD → CLI：先过 entry gate，再执行 CLI step。
- CLI 成功：exit 0；需要的 durable evidence/state 由负责该动作的调用方写入。
- CLI 硬失败：非零 exit，以 stderr 最后一个有效 JSON envelope 为控制消息；producer schema、bounds 与发射规则由 capability `cli-surface` 唯一拥有。
- MD 仅在完整支持并校验 `diagnostic.version` 后使用 structured evidence；legacy/unsupported/malformed nested data 退回 top-level summary。非零但无有效末行 envelope 按外部中断/崩溃处理，不从 partial output 猜原因。
- `diagnostic.next.requires_human:true` 必须停下交给人；自动 invocation 直接传 `program`/`args` 且 `shell:false`。不发明省略的 path/id/line/cause/approval；lineage 是证据，不是修改所有 artifact 的许可，`_generated/` 永不手改。
- parent-wrapped failure 以 parent code/where/next 为控制权，保留的 child source/subject/reason/lineage/issues 仅作因果证据；不寻找第二个 child envelope，不执行被丢弃的 child next。
- HTML controller resume 先消费 `ppt_flow state <run-dir> --json` 的 bounded `html_resume_guidance`。它给出 `guide|confirm|hard-stop`、recommended command、nullable continuation command、protected invariant 和 independent evidence completeness；Controller 直接执行显示的 owner command，不从 prose 推断 approval/waiver，也不手写 record。
- HTML final review 只调用 `ppt_flow state <run-dir> --record-delivery-review proceed|repair|redirect`；不再调用 `setNodeDecision` 做第二次写入。`proceed --force --reason` 仅在 producer 表明 reviewable artifacts 已当前时可作为 evidence continuation；`state --validate-state` 是只读检查，不能自动 heal、seed 或修复 state。
- 新 run bundle 通过根 `AGENTS.md` / `CLAUDE.md` → `deck-guide.md` 发现这些 consumer 规则。
- State 写入：只改本动作负责的字段；temp 文件必须与 `_state/state.yaml` 同目录，再 atomic rename。

### 结构 preview/receipt consumer 规则

- UI、status、selector candidate 与用户复述统一显示 `position · formal slide_id · title`。`position` 是当前快照投影，`slide_id` 是跨版本身份；MD 不把页序号写成持久身份，也不复制 producer 的 selector/plan wire schema。
- MD 按引用消费 `slides` preview、edit receipt 与 structural impact receipt，并在内存/state note 中保留确认过的 `plan_sha256`；用户只确认 before/after，不负责抄写或管理 hash。
- Apply 必须重放同一个 preview 并传 exact hash。stale base/hash mismatch 时重新生成 preview；禁止替旧计划 rebase、猜测新 selector 或在 `_generated/` 补状态。
- `requires_human:true`、selector ambiguity、正文页码 warning 或新增内容/成本选择必须停下。其他确定性冲突由 Agent 修复或重新 preview。
- Structural apply/materialization 是 renderer-free 授权域；HTML receipt 的 `needs_local_materialization` 只说明后续本地工作，legacy receipt 的 `needs_render` 才表示后续昂贵工作。Generated Image Rebuild 必须是用户知情后的独立调用。
- 结构变化若无法在一个版本内清晰收敛，consumer 使用逃生阶梯：新 preview → 新 vNext → 新 deck。新 deck 适用于受众、主叙事或设计系统已经分叉，不用于逃避普通小改。

## State API

- READ/HISTORY：`readState`、`writeState`、`statePath`、`historyPath`、`appendHistory`、`readHistory`
- QUERY：`getNodeStatus`、`getCurrentNode`、`getCompletedNodes(state,nodeIds?)`、`getPendingNodes(state,nodeIds?)`、`isNodeCompleted`、`isPlaybookComplete(state,nodeIds?)`、`getGateStatus`、`isGateApproved`
- VALIDATE：`checkEntry`、`checkExit`、`getMissingConditions`、`validateState`、`getEligibleNextNodes`
- WRITE：`setNodeStatus`、`resetNode`、`skipNode`、`setGate`、`setNodeEvidence`、`setNodeDecision`、`startPlaybook`、`switchPlaybook`、`resumePlaybook`

传入 canonical node-ID list 时，尚未写入或 execution-mismatched 的 node 都按 pending 处理；系统记录和 controller 外节点不影响 playbook completion。

## Gate Conditions Catalog

未知 condition 必须 fail closed，返回 `unknown`；不得当作“人工判断后默认通过”。`requires` 由 runtime 单独按 `node_done:<id>` 强制执行。

### Deterministic artifact conditions

| Condition | 类型 / 数据源 | 精确检查 |
|---|---|---|
| `run_bundle_exists` | filesystem / `ctx.deckDir` | run bundle 目录存在 |
| `deck_guide_created` | filesystem | `<deckDir>/deck-guide.md` 存在 |
| `visual_preset_seeded` | filesystem | `2_backbone/visual-style/color_palette.json` 存在 |
| `style_master_exists` | filesystem | `2_backbone/visual-style/style_master.jpg` 存在 |
| `slide_specs_exists` | filesystem | `<runDir>/slide-specifications.md` 存在 |
| `slide_specs_valid` | Stage 1 validation | 调用 Stage 1 同一 side-effect-free validator；零错误、无 L3 placeholder、render-required 字段齐全 |
| `pptx_generated` | filesystem | `_generated/ppt/` 恰有当前非 backup PPTX 产物 |
| `speaker_notes_injected` | receipt | 校验 `_generated/qa/notes_injection.json` schema v1、contained paths、当前 input/PPTX SHA-256 与 count equality |
| `header_review_current` | header review contract | 按当前 profile 与 execution classification scope 检查 relevant `full-page` IDs 的 reviewed hashes/fingerprint；无 relevant full-page 时才 vacuous pass |
| `html_content_review_current` | HTML review evidence | 当前 run version/reset 的完整 approvable content plan 与 fingerprint 证据 |
| `html_visual_review_current` | HTML review evidence | 当前 recipe coverage、page dependencies、effective/forced artifacts 与 approvable visual plan |
| `html_delivery_current` | HTML delivery evidence | current contact sheet、assembly-v2、notes-v3、delivery digest 与 accepted final review |
| `html_reset_clear` | HTML reset fence | 无 `deletion_pending` reset，或当前 owner 已完成显式 reset transaction |

### State/gate condition families

| Condition | 数据源 | 规则 |
|---|---|---|
| `gate_approved:<name>` | `state.gates` | status 为 `approved` 或 `waived` |
| `node_completed:<id>` | active node record | 同 execution 且 status 为 `completed` |
| `node_done:<id>` | active node record | 同 execution 且 status 为 `completed` 或 `skipped`；`requires` 自动使用此条件 |
| `node_status:<id>:<status>` | active node record | 同 execution 且精确 status 匹配 |

### Typed evidence/decision families

| Condition | 允许位置 | 规则 |
|---|---|---|
| `evidence:<key>` | 当前 node exit only | 当前 node 同 execution 的有效 evidence，任意 provenance |
| `user_evidence:<key>` | 当前 node exit only | 同上，但 `kind:user` |
| `decision_recorded` | 当前 node exit only | 当前 node 有有效 typed decision |
| `user_decision_recorded` | 当前 node exit only | 当前 node 有 `kind:user` 的 typed decision |
| `node_evidence:<required-node>:<key>` | downstream entry | source 必须在 `requires` 中、同 execution、status=`completed`；skipped 不供 evidence |
| `node_decision:<required-node>:<value>` | downstream entry | 同上，且 value 精确匹配 upstream `decisions` enum |

如果 downstream 使用 `node_decision:<node>:<value>`，upstream 必须声明该 value、包含 GATE step，并以 `decision_recorded` 或 `user_decision_recorded` 退出。

## 完整 Node 示例

````markdown
```yaml
node: authoring-slides
lifecycle_phase: 1
method_module: 02-content
requires: [seed-topics]
entry: []
exit:
  - slide_specs_exists
  - evidence:l1-l2-l4-complete
  - evidence:sources-collected
produces: [slide-specifications]
```

# authoring-slides: Foundation Shared Reference

**Step 1 — MD**: 读 `workflow/01-content/05-create-content-assets.md`，完成 L1/L2/L4 与来源收集。

**Step 2 — CLI**: 用 `setNodeEvidence` 记录 `l1-l2-l4-complete` 与 `sources-collected`，再 `writeState`。
````

Registry validator 必须对 checked-in `playbook/controller-manifest-v3.json` 声明的 10 个有序 controllers、1 个 shared node、43 个全局唯一 nodes 做零错误校验：parse、ID/reserved collision、supported pipeline ownership、includes/requires、dependency order/cycle、metadata、step grammar、condition catalog、decision enum 与 impossible self-entry。
