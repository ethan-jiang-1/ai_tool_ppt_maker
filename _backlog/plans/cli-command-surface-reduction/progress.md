# Progress — 进度跟踪

> 本文件是**唯一进度真相**;每次状态变化后更新。
> 阶段: 未开 → proposal → specs → design → tasks → apply → validate → archive。
> 总纲见 `README.md`;各 change 范围见 `01–04`;同步面见 `05`;不做/延后见 `06`;评审原文见 `07`。

## 总览

| change | 阶段 | 依赖 | 阻塞 | 下一次动作 |
| --- | --- | --- | --- | --- |
| C1 `align-cli-machine-contract` | 未开 | — | 待人类复核修订稿 | 复核点头后 `openspec new change` |
| C2 `split-navigation-and-pagination-commands` | 未开 | C1 | — | — |
| C3 `separate-state-task-projection-rebuild` | 未开 | C1 | 评审 6 问未闭合（在 design 闭合） | — |
| C4 `split-doctor-readiness-probe` | 未开 | C1 | — | — |

## 开工门槛（信心门槛——未全绿不 open change）

- [ ] 1. 人类复核修订稿（README + progress + 01–06）并点头
- [ ] 2. C1 的 proposal/specs/design/tasks 写完 → 人类点头 → 才 apply
- [ ] 3. C1 apply 后 `npm test` + `openspec validate --strict` + `05` 完成判据全绿 → 才 archive
- [ ] 4. 每个 change 归档后,下一个才开工（一次一个 active change）
- [ ] 5. C3 特别门槛: 评审 6 问在 design 全部闭合,否则 C3 不 open

## 每个 change 的 scope 指针

- C1 → `01-align-cli-machine-contract.md`
- C2 → `02-split-navigation-and-pagination-commands.md`
- C3 → `03-separate-state-task-projection-rebuild.md`
- C4 → `04-split-doctor-readiness-probe.md`
- 同步面（每个 change 的 tasks 必须覆盖）→ `05-sync-surface-master-checklist.md`
- 不做/延后 → `06-deferred-and-no-go.md`
- 评审原文 → `07-external-design-review.md`

## 待人类窄决策（不阻塞复核,在对应 change 的 proposal 定）

1. `artifacts` 裸名 vs `artifacts rebuild`;`task-projection` vs `task-projection rebuild`
   （评审倾向动作可见的名字）
2. `paginate apply` 是否保留 `--apply`（倾向: plan/apply 两 operation,去双重 apply）
3. 复核时确认: 4-change 拓扑、C1 承载 inventory 治理、probe=connectivity-only、
   preflight=`<run-dir>` 位置参数、clean-break 边界

## 更新规则

- 每完成一个 change 阶段,更新总览行 + 勾选门槛;
- change 归档后把该行移入下方「已归档」小节,保留记录;
- 全部归档 → 按 `_backlog/plans/README.md` 流程关闭本 plan。

## 已归档

（空——尚无 change 开工）
