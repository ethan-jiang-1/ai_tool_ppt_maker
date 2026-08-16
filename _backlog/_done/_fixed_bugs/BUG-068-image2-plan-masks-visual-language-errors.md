# BUG-068: `image2 plan` 将已知 visual-language 配置错误降级为 internal

> 严重级别: P1 | 发现: 2026-08-16 | 状态: 已修复（2026-08-16）

## 症状

BUG-067 所述的同一 typed `PageImageVisualLanguageError` 通过公开 raw planning 入口时，执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs image2 plan <run-dir>
```

得到的不是 source/configuration 诊断，而是：

```json
{
  "code": "FAILED",
  "message": "The target Page Image operation failed unexpectedly.",
  "diagnostic": {
    "category": "internal",
    "next": { "action": "report_internal", "requires_human": false },
    "reason": { "kind": "page_image_operation_failed" }
  }
}
```

现场 V8 在修正该 clause 前可稳定复现。此时 provider 没有初始化，且 state 的
`source_epoch`、Style Master selection、pilot evidence 与 progressive raw plan 均未被写入；
该错误是已知的 deterministic source validation failure，不是 internal/unknown outcome。

## 根因

Pure selected-workflow adapter 在 raw-plan candidate compilation 之前解析 Page Image visual
language，并以 `PageImageVisualLanguageError` 表示 registry issue。`image2 plan` 的 CLI
diagnostic 归因链没有识别这个 typed error 或其 `issues[]`，最终通过
`pageImageDiagnosticReasonKind()` 使用 fallback `page_image_operation_failed`，并给出
`report_internal`。

这丢弃了 producer 已知的 source path 和 reason，使 Agent 无法遵循“修最早 source 后重跑同一
checkpoint”的正常调优路径。

相关路径：

- `ppt_maker_harness/scripts/04-pure-image/index.mjs`
  - `resolvePureTargetCandidateSource()` / selected visual-language parse
- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - `pageImageDiagnosticReasonKind()`
  - Image2 target-plan failure producer

## 复现

使用 BUG-067 的临时 invalid `title-pause.provider_clause`，运行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs image2 plan <run-dir>
```

观察到 exit 1、`category: internal`、`reason.kind: page_image_operation_failed` 和
`next.action: report_internal`。随后直接执行 selected Pure resolver，会得到可定位的
`content_overriding_visual_clause` issue；因此该错误在 CLI 包装前已经是已知错误。

期望行为：`image2 plan` 应保留已知 source/configuration failure 的有限 machine-readable
reason 和 path，给出 owner-issued source repair / same-check rerun，而不是 report_internal。
它仍必须在 provider authorization、provider initialization、source epoch 与 raw-plan
publication之前停止。

## 修复关联

本轮现场登记，不修复。建议与 BUG-067 在同一 diagnostic-boundary OpenSpec change 中一起
处理，但保留两个入口各自的 regression test：Style Master lifecycle producer 与 Page Image
target-plan producer 的 fallback 分支不同。

## 修复结果

由 Change 1 `page-image-owner-issued-diagnostics`（2026-08-16 archive）修复：

- `image2 plan` 对已知 source/config defect 发出 `source_validation`/`edit_source`（exact
  owner/locator），`internal`/`report_internal` 只留给 unknown/unsafe fact（fail closed）。
- 回归：`tests/shared/cli/test_process_source_config_diagnostics.mjs` 26/26（含 `image2 plan`
  四 family 矩阵与 secret/oversized/escape 负向安全）。
- 评估记录：`_backlog/_done/_closed_plans/cli-diagnostic-faithful-passthrough.md`（CLS-038）。
