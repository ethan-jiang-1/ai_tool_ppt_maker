# Progress — 进度跟踪

> 本文件是**唯一进度真相**;每次状态变化后更新。
> 阶段: 未开 → proposal → specs → design → tasks → **polish** → apply → validate → archive
> （polish = `/polish-openspec-change`,磨到 evidence-backed 的 `ready for apply`）。
> 总纲见 `README.md`;各 change 范围见 `00–04`;同步面见 `05`;不做/延后见 `06`;
> 评审原文(含两轮)见 `07`。

## 总览

| change | 阶段 | 依赖 | 阻塞 | 下一次动作 |
| --- | --- | --- | --- | --- |
| C0 `split-ppt-flow-command-modules` | 未开 | — | 待人类复核修订稿 | 复核点头后 `openspec new change` |
| C1 `align-cli-machine-contract` | 未开 | C0;先冻结跨 change 边界(见门槛 3) | 待人类复核修订稿 | 复核点头后 `openspec new change` |
| C2 `split-navigation-and-pagination-commands` | 未开 | C1 | — | — |
| C3 `separate-state-task-projection-rebuild` | 未开 | C1 | 6 问未闭合(design gate,见门槛 7) | — |
| C4 `split-doctor-readiness-probe` | 未开 | C1 | — | — |

## 开工门槛（未全绿不 open/apply）

**全局规则（人类给定,2026-08-16,适用于 C0–C4 每一个 change;各 change 文件的完成判据
不再重复此条）**: planning artifacts 写好并过人类复核后,必须先跑 `polish-openspec-change`,
至少两轮（全 change 连贯性 + 风险主导）,磨到 **evidence-backed 的 `ready for apply`**
才允许 apply;polish 未达 ready 就报告缺口与待决项,不把未决决定伪装成确定。

- [ ] 1. 人类复核修订稿（README + progress + 00–06）并点头
- [ ] 2. **C0 开工**: 纯拆分、零行为变化;planning artifacts 过 polish 门（全局规则）
      达 `ready for apply` 后 apply;apply 后 `npm test` + 全部审计 + 冷启动 smoke +
      同 fixture stdout 逐字节一致 → 才 archive（拆分后 C1 才有 descriptor 载体）
- [ ] 3. **C1 开工前冻结跨 change 边界**（二次评审 #2,见 `01` §1.5）: 采用 C3 候选 A——
      `build`/target `image2` checkpoint 的 projection refresh 不进入 C1 的 owner result;
      C1 的 `build` result 只拥有 delivery。冻结结果写进 C1 proposal 的 scope 边界。
- [ ] 4. C1 的 proposal/specs/design/tasks 写完 → 人类点头 → 过 polish 门（全局规则）
      → 才 apply;C1 design 必须含: partial-effect 恢复闭环、exit 归一协议、
      declaration authority map（`01` §1.5–1.8）。
- [ ] 5. C1 apply 后 `npm test` + `openspec validate --strict` + `05` 完成判据全绿 → 才 archive
- [ ] 6. 每个 change 归档后,下一个才开工（一次一个 active change）
- [ ] 7. **C3 design gate**（二次评审 #1 修正,见 `03`）: C1 归档后即可 open C3;
      但 proposal/specs 之后设 design gate——评审 6 问全部闭合前,不得写 tasks、不得 apply。
- [ ] 8. C2/C3/C4 各自的 proposal 前分别钉死: plan classification 时序（C2,`02`）、
      `state` 完整 grammar（C3,`03`）、run-bound probe profile fence（C4,`04`）。

## 每个 change 的 scope 指针

- C0 → `00-split-ppt-flow-command-modules.md`（纯拆分,零行为变化,最安全）
- C1 → `01-align-cli-machine-contract.md`
- C2 → `02-split-navigation-and-pagination-commands.md`
- C3 → `03-separate-state-task-projection-rebuild.md`
- C4 → `04-split-doctor-readiness-probe.md`
- 同步面（每个 change 的 tasks 必须覆盖）→ `05-sync-surface-master-checklist.md`
- 不做/延后 → `06-deferred-and-no-go.md`
- 评审原文（§一–九 + §十 二次评审）→ `07-external-design-review.md`

## 待人类窄决策（不阻塞复核,在对应 change 的 proposal 定）

1. `artifacts` 裸名 vs `artifacts rebuild`;`task-projection` vs `task-projection rebuild`;
   `paginate apply` 是否保留 `--apply`（倾向: plan/apply 两 operation,去双重 apply）
2. `state` 完整 grammar（二次评审 #6）: 推荐 `state show <run-dir> [--json]` /
   `state validate <run-dir>` / `state repair-known-execution-mismatch <run-dir>`
   （避免 `validate` 与父命令 `<run-dir>` 位置参数争位）
3. exit 归一协议（二次评审 #7,`01` §1.7）: `ppt_flow test` 透传任意 child status,还是把
   JS-controlled hard failure 规范化为 1（signal 保留 130/143,child status 进 diagnostic）;
   倾向后者（Agent 面协议更简单,child status 有界保留）
4. `probe` 绑 run（二次评审 #4,评审已修正自身倾向,`04`）: `probe <run-dir> [--smoke|--vendors]`,
   保留 pre-POST profile fence;成功仅 connectivity
5. 复核时确认: 5-change 拓扑（C0 纯拆分先行）、C1 承载 inventory 治理、preflight=`<run-dir>`
   位置参数、clean-break 边界、Task Mandate 为 cost/confirmation 权威（对齐已归档
   `_backlog/plans/fold-style-master-cost-into-task-mandate/`）

## 更新规则

- 每完成一个 change 阶段（含 polish 的 ready/not-ready 结论）,更新总览行 + 勾选门槛;
- change 归档后把该行移入下方「已归档」小节,保留记录;
- 全部归档 → 按 `_backlog/plans/README.md` 流程关闭本 plan。

## 已归档

（空——尚无 change 开工）
