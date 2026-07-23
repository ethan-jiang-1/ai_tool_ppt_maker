---
playbook: probe-image-channels
description: 离线数清 Image2 通道，披露提交次数并确认后逐家探测
supported_pipelines: [whole-page-image2-v1]
includes: []
---

# Playbook: 图像通道体检

本 playbook 只证明 Image2 channel health，不批准 style-master、build 或页面 refinement，也不创建生产 authorization/state。当前 credential SSOT 通常只解析一个 entry；这里不暗示存在新的多供应商配置格式。

## Nodes

### intake

```yaml
node: intake
lifecycle_phase: 0
method_module: 00-setup
requires: []
produces: [offline-image2-presence, probe-plan]
entry: []
exit: [user_evidence:provider-submit-confirmed]
```

**Step 1 — CLI**: 离线运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --image2`，读取 secret-safe 的 resolved vendor count。此命令不产生 provider submit；若 presence 未就绪，先修复并重跑，不进入 live probe。

**Step 2 — MD**: 告知用户 `doctor --probe-vendors` 将对每个 resolved entry 恰好提交 1 次，明确说出总 submit 数、可能计费、将展示进度与报告，并说明不会自动修改 `.env` 或 `_lessons/`。

**Step 3 — GATE**: 询问是否同意这次 live probe。只有明确同意才记录 `provider-submit-confirmed`；拒绝或未回答时不得调用 `--probe-vendors` 或 `--smoke`，也不得改用 style-master 试通。

### run-probe

```yaml
node: run-probe
lifecycle_phase: 0
method_module: 00-setup
requires: [intake]
produces: [probe-report]
entry: []
exit: [evidence:probe-finished]
```

**Step 1 — CLI**: 运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --probe-vendors`。耗时较长时保持后台运行并持续转述 `probing i/N`、submit heartbeat 和 Summary；成功或失败均记录完整 report evidence，不重复提交失败 entry。

### show-report

```yaml
node: show-report
lifecycle_phase: 0
method_module: 00-setup
requires: [run-probe]
produces: [human-readable-report]
decisions: [finish, configure]
entry: []
exit:
  - user_decision_recorded
  - user_evidence:report-acknowledged
```

**Step 1 — MD**: 展示 OK/FAIL、mode、elapsed 与安全错误摘要，不展示 API key。明确说明 report 只证明刚才的通道健康，不批准任何生产调用。

**Step 2 — GATE**: 用户只要报告时选择 `finish`，到此结束且不写文件。用户希望保留已验证组合时选择 `configure`，再进入单独的 confirm-write；live probe 的确认不能自动授权写配置。

### confirm-write

```yaml
node: confirm-write
lifecycle_phase: 0
method_module: 00-setup
requires: [show-report]
produces: [routing-update]
decisions: [write, skip]
entry: [node_decision:show-report:configure]
exit:
  - user_decision_recorded
  - evidence:write-handled
```

**Step 1 — MD**: 展示拟写入 deck-root `.env` 的 key/URL 目标（不回显 key）和 `_lessons/image2-proven.yaml` 的非密钥内容。`_lessons/` 是通用 retained-lessons surface，Image2 文件只是其中一个条目。

**Step 2 — GATE**: 用户选择 `write` 或 `skip`。未明确选择 `write` 时不修改任何文件；probe 本身绝不自动写配置。

**Step 3 — CLI**: 写入后只离线运行 `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --image2` 验证已保存的 presence，不自动运行 `doctor --smoke`。

只有当保存组合未被刚才报告覆盖，或用户明确要求再测时，才可以另行提议 `doctor --smoke`。提议时必须重新披露“向第一家提交 1 次、可能计费”并重新取得确认；上一次 probe/write 的确认不能复用。
