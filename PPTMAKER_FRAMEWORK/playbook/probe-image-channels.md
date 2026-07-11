---
playbook: probe-image-channels
description: 环境——逐家探测 Image2 画画通道（doctor --probe-vendors）
includes: []
---

# Playbook: 环境 — 画画通道体检

> 仪器面：`ppt_flow doctor --probe-vendors`。本 playbook 负责对话编排：告知 → 跑探针 → 给人看报告 → **确认后**才写 `.env` / lesson。
> **禁止**探针自动写 `.env`。只要报告、不改配置 → 可走短路径（intake 后直跑 doctor，跳过 confirm-write）。
> §11：症状时刻白话亮能力——用户不必背旗标名。

## Nodes

### intake
→ 确认要体检什么、是否可能写配置

```yaml
node: intake
phase: 00
requires: []
produces: [probe_plan]
entry: []
exit: [probe_scope_agreed]
```

**Step 1 — MD**: 用白话说明：会逐家试你配的画画通道（可能要一两分钟），给出每家通/不通、耗时，以及建议的 `IMAGE2_VENDORS` 顺序；**不会**偷偷改 `.env`。
**Step 2 — MD**: 问清目标——只要报告，还是通了以后可能改路由顺序？本 session 若已跑过 probe，复述上次 Summary，问是否重跑。

### run-probe
→ 跑 `doctor --probe-vendors`

```yaml
node: run-probe
phase: 00
requires: [intake]
produces: [probe_report]
entry: [probe_scope_agreed]
exit: [probe_finished]
```

**Step 1 — MD**: 心跳——「正在逐家探测，stdout 会有 `probing i/N`」。
**Step 2 — CLI**（长跑可后台；转述进度，勿静默干等）:

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --probe-vendors
```

勿与 `--smoke` 同开（互斥）。缺凭据时先修静态 doctor / `.env`，再重跑本 node。

### show-report
→ 给人看懂 Summary

```yaml
node: show-report
phase: 00
requires: [run-probe]
produces: [human_saw_report]
entry: [probe_finished]
exit: [report_acknowledged]
```

**Step 1 — MD**: 转述 OK / FAIL、mode（sync|async）、elapsed；贴出 Suggested `IMAGE2_VENDORS=`（无密钥）。
**Step 2 — MD**: 若只要报告 → 结束（短路径）；若要改配置 → 进 confirm-write。

### confirm-write
→ 人确认后再写路由 / lesson

```yaml
node: confirm-write
phase: 00
requires: [show-report]
produces: [routing_updated]
entry: [report_acknowledged]
exit: [write_done_or_skipped]
```

**Step 1 — MD**: 展示拟写入的 `IMAGE2_VENDORS` 行（KEY_ENV **名** only）与可选 `_lessons/image2-proven.yaml`（`via: vendors`；**无 key**）。等人说「写」才动。
**Step 2 — MD**: 写入 deck 根（优先）或 repo 根 `.env`；lesson 服从 `_lessons/README`。拒绝则跳过，保留报告结论。
**Step 3 — MD**: 可选廉价门禁：`doctor --smoke`（只探第一家）确认门禁绿。
