# BUG-020: 框架缺少 user-override 机制，gate 不通过时无法强制继续

> 严重级别: P0 | 发现: 2026-07-21 | 状态: 已修复 (2026-07-21)

## 症状
html-first-v1 deck 在 gate approval / delivery review 不通过时，框架没有任何 `--force` 或
`--skip-gate` 机制让用户显式选择"我知情，继续往前走"。

具体阻塞链：
- `ppt_flow build` 被 gate approval 卡死 → 没有 `--skip-approval`
- `ppt_flow image2 plan` 被 delivery review 卡死 → 没有 `--force`
- `ppt_flow state --record-delivery-review proceed` 被 missing receipt 卡死 → 没有 `--skip-evidence`

每一层都把"校验不通过"等同于"不可继续"，不给人类决策者留下 override 入口。

## 根因
框架的 gate/approval/delivery review 三层校验在设计上没有区分两个概念：
1. **证据缺失**（receipt 不存在 / hash 不匹配）— 需要警告
2. **用户拒绝继续**（用户看过警告后仍然选择 proceed）— 应该允许

当前实现把 1 和 2 合并为同一个 `FAILED` 出口，不给 `--force` 路径。这与 AGENT_CONTRACT 第 12 条
"Gates are guides, not roadblocks" 矛盾。

## 设计原则
> 框架应该辅助用户达成目标，而不是用校验锁死流程。用户强行要求继续时，框架顶多质疑一下，
> 最终还是应该遵循——毕竟这是个打磨的过程。

建议每个阻塞点增加 `--force` flag：
- `ppt_flow approve --force` — 跳过 evidence 校验，直接记录用户决定
- `ppt_flow build --force` — 跳过 gate approval，直接组装 PPTX
- `ppt_flow image2 plan --force` — 跳过 delivery review，直接出 refinement plan
- `ppt_flow state --record-delivery-review proceed --force` — 跳过 receipt 校验

`--force` 的行为：
1. 打印所有校验失败项（透明度）
2. 在 state 中记录 `force: true` + `forced_reason: "user insisted after warning"`
3. 继续执行

## 复现
任何 html-first-v1 deck 在 pilot 后、未完成 approve 的情况下：
1. `ppt_flow build` → 被 content/visual gate 卡死
2. 尝试 `ppt_flow build --force` → 不存在此选项
3. 用户只能手工修改 state.yaml 和 manifest — 极度脆弱且不可维护

## 修复关联
已由 OpenSpec change `make-html-production-guided-and-recoverable` 修复并归档。
影响范围横跨 `ppt_flow.mjs` 的 approve/build/image2/state 四个命令。
建议作为横切关注点统一实现 `--force` 机制。
