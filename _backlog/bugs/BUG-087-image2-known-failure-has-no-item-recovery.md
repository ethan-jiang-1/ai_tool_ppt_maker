# BUG-087: Image2 `known_failure` 成功退出，但失败页没有明确恢复动作

> 严重级别: P2 | 发现: 2026-08-19 | 状态: 活跃

## 症状

在 `deck_ai_org_transform_keynote/3_versions/v1` 的 Pure Pilot 中，首张
`AiLeap` 提交后，provider 返回了 HTML-like 响应而不是合法 JSON。Harness 正确地
没有把它物化成图片，并把该页记为 `known_failure`；但命令仍以退出码 0 返回，且
唯一下一步仍是笼统的“提交下一项”。

这会产生两个用户可见问题：

- 一次真实提交失败后，交互表面看起来仍像普通成功，用户不知道当前已经少了一页。
- owner 没有给出针对 `AiLeap` 的明确恢复动作：是允许重试、建立 repair batch，还是
  必须先排查 provider route，当前输出无法判断。

## 复现

1. 对已有有效 Pure raw plan 与 Pilot batch 的 run 执行
   `ppt_flow image2 generate <run-dir> --plan-hash <sha> --batch-hash <sha>`。
2. 让 provider 返回非 JSON 的 HTML-like 响应。
3. 观察结果：item outcome 为 `known_failure`，provider failure classification 为
   `invalid_json`，进程退出码为 0；`next_action` 仍为通用
   `generate_progressive_raw_item`，没有失败页恢复动作。

## 影响

当前 Pilot 的 `AiLeap` 没有图片，批次最多提交数已经发生一次真实消耗。继续调用
`generate` 可以生产其他仍未提交页面，但无法从当前回执知道该失败页如何合法恢复，
最终会形成部分完成的 Pilot。

## 期望

- `known_failure` 必须在成功交接层明确说出失败页、剩余可继续范围和失败页的唯一合法
  恢复动作。
- 如果允许重试，应由 owner 发出 attempt-bound 的 retry/repair action；如果不允许，
  应明确要求创建何种新 batch 或执行何种 route 诊断。
- CLI 的退出语义应能让自动化区分“本次已物化一页”和“本次 provider 已知失败”，
  不能都表现为普通成功。

## 修复关联

与 BUG-082 的“成功输出违反交接契约”相关，但本问题更具体：这是 item-level provider
失败后的生命周期与恢复动作缺失，不只是输出文案问题。
