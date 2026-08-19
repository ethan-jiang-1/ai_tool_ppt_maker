# BUG-074: initial draft workflow selection is misclassified as current protocol invalid

> 严重级别: P1 | 发现: 2026-08-19 | 状态: 活跃

## 症状

新建 v1 Page Image draft 的 State 正确处于无 production identity 的 authoring 状态。
在人类已经选择 `pure` 后，若按 source 文档把 `production.workflow: pure` 直接写入
`3_versions/v1/slide-specifications.md`，随后运行 `ppt_flow state <run-dir> --json`
会得到 generic `CURRENT_PROTOCOL_INVALID` / `IDENTITY_MISSING`，而不是继续引导到
初始 narrative page-plan candidate/apply 的合法路径。

这会让正常的 workflow selection 看起来像 state 或 protocol 损坏。

## 根因

`resolveTargetAuthoringDraftRoute` 只把 `workflow: null` 视为 draft route；一旦 source
marker 记录了 `framed|pure`，inspection 就切换到 durable identity 路径，而 fresh v1
尚未通过 narrative plan apply 建立 `production_identity.by_version`。因此 source 已
选择但尚未 materialize 的合法中间态没有被建模，最终落入 generic current-protocol
hard-stop。

## 复现

1. 初始化 fresh `deck_*` v1，使 `production_identity.by_version` 为空。
2. 在 v1 source frontmatter 中加入：
   `production.workflow: pure`。
3. 运行：
   `node ppt_maker_harness/scripts/ppt_flow.mjs state <deck>/3_versions/v1 --json`
4. 观察失败回执：
   `where: ppt_flow.state.identity`、`reason.kind: current_protocol_invalid`、
   durable `production_identity` 仍为空。
5. 正确的初始路径应允许 candidate 携带 selected workflow，并由
   `paginate apply` 原子发布 target source 与初始 State identity。

## 修复关联

待拆为 Page Image authoring lifecycle follow-up：明确 workflow selection 的 source
中间态，或让 state/inspection 将“fresh v1 + selected workflow + no identity”路由到
owner 的 narrative-plan/apply 初始化动作，而不是泛化为协议损坏。禁止用手写 state
作为修复。
