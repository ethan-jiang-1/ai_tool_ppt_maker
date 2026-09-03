# BUG-072: Progressive Page Image 已进入 pilot review，但 State 仍报告最早的内容编写节点

> 严重级别: P1 | 发现: 2026-08-16 | 状态: 已修复 (2026-08-19)

## 症状

在 exact run `deck_ai_sdlc_bpm_keynote/3_versions/v8` 的 Pure pilot 已全部 materialize、并且
`image2 pilot-review` 已成功写入 current pilot evidence 后，执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs state --json \
  deck_ai_sdlc_bpm_keynote/3_versions/v8
```

同一个 JSON 返回了互相矛盾的两组进度事实：

```json
{
  "current_node": "author-target-page-image-content",
  "eligible_candidates": ["author-target-narrative-sources"],
  "workflow_inspection": {
    "primary_action": {
      "owner": "progressive-raw-owner",
      "action_id": "accept_progressive_pilot",
      "kind": "confirm",
      "requires_human": true
    }
  }
}
```

其 `pilot_evidence_sha256` 为
`1f1d2480ec5e4eaaf184df21a3d2a0fecf29d3ccddacc370f5b37df3fb48073c`。
也就是说，顶层 cursor 和 eligible node 建议 Agent 回到 narrative/page authoring，而 selected
workflow 的 direct owner 明确要求对当前四页 pilot 作 visual decision。此前同一输出还显示
`task_projection.status: not-applicable`；需由修复者确认这是否是 stale controller cursor 导致
projection 无法重建的下游结果。

同一 run 的另一个公开观察入口也被该旧 cursor 污染：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs status \
  deck_ai_sdlc_bpm_keynote/3_versions/v8 --json
```

它返回 `current_node: author-target-page-image-content`、`visual_gate: approved` 和
`raw_images: 0`，但没有返回 current pilot evidence 或 `accept_progressive_pilot` confirm。
这不是第二个独立 bug：`status` 与 `state` 都把 Page Image 的真实 current owner position 遗漏，
只是对人造成了更危险的“本轮已批准且没有 raw work”的假象。

影响是恢复路径不再可信：遵循顶层 `current_node` 的 Agent 可能重复或覆盖上游 source work，
而遵循 `workflow_inspection.primary_action` 的 Agent 才会停在正确的 human visual gate。两者不能
同时表示同一个 current Controller position。

## 已运行的红色检查

以下只读检查已在上述 exact run 上运行并以 exit `1` 结束；它直接断言本 bug 的矛盾组合，而
不是泛化地断言“命令失败”：

```bash
node --input-type=module -e 'import { spawnSync } from "node:child_process"; const r = spawnSync(process.execPath, ["ppt_maker_harness/scripts/ppt_flow.mjs", "state", "--json", "deck_ai_sdlc_bpm_keynote/3_versions/v8"], { encoding: "utf8" }); const s = JSON.parse(r.stdout); const bad = s.current_node === "author-target-page-image-content" && s.eligible_candidates?.includes("author-target-narrative-sources") && s.workflow_inspection?.primary_action?.action_id === "accept_progressive_pilot"; console.log(JSON.stringify({ current_node: s.current_node, eligible_candidates: s.eligible_candidates, primary_action: s.workflow_inspection?.primary_action?.action_id })); process.exit(bad ? 1 : 0);'
```

实际输出：

```text
{"current_node":"author-target-page-image-content","eligible_candidates":["author-target-narrative-sources"],"primary_action":"accept_progressive_pilot"}
```

该检查不依赖 provider、密钥、生成产物内容或时间；修复后应在 fixture 中替换 V8 路径，并保持对
上述三项关系的断言。

## 契约冲突

这不是“workflow inspection 覆盖旧 card 的正常优先级”即可消除的展示问题：

- `openspec/specs/node-specification/spec.md` 的 State API 将 `current_node` 定义为 active
  execution pointer；node transition 必须在开始/结束 work 时持久化。
- `openspec/specs/playbook-execution/spec.md` 要求 exact existing run 从 State/status inspection
  恢复其 active current Controller/node，同时以 shared workflow inspection 为 progress truth。
- `openspec/specs/workflow-inspection/spec.md` 要求 primary action 是当前 exact run 的一项
  nearest legal action，而不是历史字段的补充建议。

在 progressive evidence 已达到 `accept_progressive_pilot` 时，正确的 State cursor 至少应落在
`review-target-pure-pilot`，并把 visual decision 标明为其 current waiting/confirmation condition；
它不得仍把 `author-target-narrative-sources` 暴露为可执行候选。

## 待定位实现边界

现场只证明 read projection 冲突，尚未证明是哪一次写入漏掉 transition。修复者应沿着以下边界
建立 Pure 与 Framed fixture，而不要手改 V8 的 `_state/state.yaml`：

- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - `state --json` 的 controller card projection（当前在约 3830--3845 行返回
    `indexedCard.current_node`）
  - Image2 `pilot-review` 成功后的 State/Controller handoff
- `ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs`
  - evidence ready 后 `accept_progressive_pilot` 的 owner action（约 938--940 行）
- State 的 `setNodeStatus` / `writeState` transition path 及 Page Image task-projection refresh path

不要用“仅在 `state --json` 输出中优先显示 primary action”掩盖问题：`status`、task projection、
durable cursor、gate display 和 node eligibility 必须给出同一 resume position。也不要通过
observation 写入新的 lifecycle state；正确更新应绑定到已有的 successful owner/CLI transition。

## 修复关联

本轮现场登记，不修复。建议建立一个 `pilot-review evidence -> state/status/task projection`
集成回归：先走 current Pure 与 Framed fixture 的 plan/authorized/materialized pilot，成功运行
pilot review，然后断言 cursor 为各自 `review-target-*-pilot`、上游 authoring nodes 不再 eligible、
以及 workflow inspection 和 task projection 一致。再覆盖 `pilot-accept proceed` 后 cursor 正确
移动到 expansion，而不是跳回 content authoring。

## 修复记录

- **2026-08-19** 由 OpenSpec change `progressive-pilot-state-and-diagnostics`（归档于
  `openspec/changes/archive/2026-08-19-progressive-pilot-state-and-diagnostics/`）修复：
  - 新增 State CLI handoff `recordTargetProgressiveCheckpointCliHandoff`：每次成功 image2
    mutation 后沿 active Controller 节点序单调推进 durable cursor 到 owner checkpoint 节点
    （checkpoint 节点恒 `in_progress`，human-gate 附 `waiting_for`），并把 checkpoint 之前
    缺失/在途节点投影为 `completed`——满足 `getEligibleNextNodes` 的位置无关语义，上游
    authoring 节点不再 eligible；
  - `image2.mjs` 每个成功操作后：inspectWorkflow → checkpoint handoff（authorize 先于既有
    authorize handoff）→ task projection refresh（同一 inspection）；
  - `state --json` / `status` / task projection 恢复同一 resume position；`pilot-accept
    proceed` 后 cursor 到 `plan-target-*-expansion`；
  - 观察命令（state/status）永不写 state；lock 失败不改变 cursor/节点/历史。
  - 回归：`tests/shared/workflow/test_progressive_checkpoint_cursor.mjs`（3 用例，含 BUG-072
    红色断言三项关系的 fixture 化）。
