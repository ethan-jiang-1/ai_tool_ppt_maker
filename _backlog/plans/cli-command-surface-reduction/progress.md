# Progress — 进度跟踪

> 本文件是**唯一进度真相**;每次状态变化后更新。
> 阶段: 未开 → proposal → specs → design → tasks → **polish** → apply → validate → archive
> （polish = `/polish-openspec-change`,磨到 evidence-backed 的 `ready for apply`）。
> 总纲见 `README.md`;各 change 范围见 `00/01/02/04`;同步面见 `05`;不做/延后见 `06`;
> 评审原文(含两轮)见 `07`;**C3 已延后（α）,设计预案见 `03`**。

## 总览

| change | 阶段 | 依赖 | 阻塞 | 下一次动作 |
| --- | --- | --- | --- | --- |
| C1 `align-cli-machine-contract` | proposal（spike + 冻结完成） | C0（已归档）;门槛 3 已冻结 | — | specs/design/tasks → polish → apply |
| C2 `split-navigation-and-pagination-commands` | 未开 | C1 | — | — |
| C4 `split-doctor-readiness-probe` | 未开 | C1 | — | — |

## 已延后（α,2026-08-16 人类决定）

| change | 理由摘要 | 预案/重启条件 |
| --- | --- | --- |
| C3 `separate-state-task-projection-rebuild` | 为「非权威协作卡」动 ≈15–20 个 Controller 节点,价值小风险大;C1/C2/C4 不依赖它 | 设计预案 + 评审 6 问 + trigger matrix 保留在 `03`;重启条件在 `06` |

## 开工门槛（未全绿不 open/apply）

**全局规则（人类给定,2026-08-16,适用于 C0/C1/C2/C4 每一个 change;各 change 文件的完成判据
不再重复此条）**: planning artifacts 写好并过人类复核后,必须先跑 `polish-openspec-change`,
至少两轮（全 change 连贯性 + 风险主导）,磨到 **evidence-backed 的 `ready for apply`**
才允许 apply;polish 未达 ready 就报告缺口与待决项,不把未决决定伪装成确定。

- [x] 1. 人类复核修订稿（README + progress + 00–06）并点头（2026-08-16 人类指令：开始推进、静默自主执行；窄决策按已记录倾向在对应 proposal 定，见「执行日志」）
- [x] 2. **C0 开工**: 纯拆分、零行为变化;planning artifacts 过 polish 门（全局规则）
      达 `ready for apply` 后 apply;apply 后 `npm test` + 全部审计 + 冷启动 smoke +
      同 fixture 12 命令逐字节一致 → 才 archive（拆分后 C1 才有 descriptor 载体）
      （2026-08-17 完成并归档；逐字节证据见执行日志，8 命令逐字节 + new-version 路径等价 +
      artifact-view 计时等价；剩余 build/refresh/test 由 vitest 653 精确断言覆盖）
- [ ] 3. **C1 开工前冻结跨 change 边界**（二次评审 #2 + 独立评审 B1,见 `01` §1.5）:
      C1 的 `build`/`image2` owner result 保留**两个分列 effect**（delivery + projection,
      现状一致）,projection 为独立可版本化字段;C1 **不改退出路径**。此契约**不依赖 C3 落地**;
      若将来重启 C3（`03` 预案）,候选 A 按已记录方向把 projection 版本化删除。
      冻结结果写进 C1 proposal 的 scope 边界。
- [ ] 4. C1 的 proposal/specs/design/tasks 写完 → 人类点头 → 过 polish 门（全局规则）
      → 才 apply;C1 design 必须含: partial-effect 恢复闭环、exit 归一协议、
      declaration authority map（`01` §1.5–1.8）。
- [ ] 5. C1 apply 后 `npm test` + `openspec validate --strict` + `05` 完成判据全绿 → 才 archive
- [ ] 6. 每个 change 归档后,下一个才开工（一次一个 active change）
- [ ] 7. C2/C4 各自的 proposal 前分别钉死: plan classification 时序（C2,`02`）、
      run-bound probe profile fence（C4,`04`）。
- [ ] 8. C1 proposal 前做两个 spike（发虚处前置消险）: ① 一个命令的 result 模型 + text/JSON
      双 renderer 原型;② commander 能否从 descriptor 生成完整 help + grammar 校验（不行则
      scope 需加自建 registry,升级人类决策）。C0 proposal 前做模块级副作用/import 顺序审计。

## 每个 change 的 scope 指针

- C0 → `00-split-ppt-flow-command-modules.md`（纯拆分,零行为变化,最安全）
- C1 → `01-align-cli-machine-contract.md`
- C2 → `02-split-navigation-and-pagination-commands.md`
- C4 → `04-split-doctor-readiness-probe.md`
- C3（延后 α,重启时用）→ `03-separate-state-task-projection-rebuild.md`
- 同步面（每个 change 的 tasks 必须覆盖）→ `05-sync-surface-master-checklist.md`
- 不做/延后 → `06-deferred-and-no-go.md`
- 评审原文（§一–九 + §十 二次评审）→ `07-external-design-review.md`

## 待人类窄决策（不阻塞复核,在对应 change 的 proposal 定）

1. `artifacts` 裸名 vs `artifacts rebuild`;`paginate apply` 是否保留 `--apply`
   （倾向: plan/apply 两 operation,去双重 apply）
2. exit 归一协议（`01` §1.7）: `ppt_flow test` 透传数值型 child status,还是把
   JS-controlled hard failure 规范化为 1（signal 保留 130/143,child status 进 diagnostic）;
   倾向后者（Agent 面协议更简单,child status 有界保留）
3. `probe` 绑 run（`04`）: `probe <run-dir> [--smoke|--vendors]`,保留 pre-POST profile fence;
   成功仅 connectivity
4. 复核时确认: 4-change 拓扑（C0 先行,C3 延后 α）、C1 承载 inventory 治理、
   preflight=`<run-dir>` 位置参数、clean-break 边界、Task Mandate 为 cost/confirmation 权威
   （对齐已归档 `_backlog/plans/fold-style-master-cost-into-task-mandate/`）
5. （随 C3 一起延后）: `task-projection rebuild` 命名、`state` 完整 grammar
   （show/validate/repair-known-execution-mismatch）——重启 C3 时再定

## 更新规则

- 每完成一个 change 阶段（含 polish 的 ready/not-ready 结论）,更新总览行 + 勾选门槛;
- change 归档后把该行移入下方「已归档」小节,保留记录;
- 全部归档 → 按 `_backlog/plans/README.md` 流程关闭本 plan。

## 已归档

| change | 归档时间 | 结果 |
| --- | --- | --- |
| C0 `split-ppt-flow-command-modules` | 2026-08-17 | `openspec/changes/archive/2026-08-17-split-ppt-flow-command-modules/`；npm test + 全审计 + `--all --strict`（27 specs）绿；入口 4035→约 370 行 + `command_support.mjs` + 12 命令模块；`harness-script-layout` main spec 已同步（ADDED 命令模块 seam requirement） |

## 执行日志（2026-08-16 人类指令：静默自主推进）

- 门槛 1 由人类「开始推进」指令满足，勾选；C0 进入 proposal 阶段。
- 窄决策处置：proposal 时按 `progress.md` 已记录倾向定，此处逐条回填，供人类事后复核。
- C0 前置审计（门槛 8）完成：4035 行/12 命令/bootstrap `:20`/`runNode.lastChildResult` 单例/
  冷启动快路径 `:78–82` 核实；三处与计划不符已吸收（28 表实为 ~9 表+分类函数；测试漏报
  `styleMasterSubmitFactory`；`state` 无具名 handler 需无损提升）。
- C0 工件（proposal/specs/design/tasks）写完，`openspec validate --strict` + `--all --strict`
  （28 specs）+ `git diff --check` 全绿，`npm test` 基线绿。
- C0 polish 2 轮（连贯性 + 风险主导）：修正 `state` 退出机制（保持 `process.exitCode` 自然退出，
  不加 `process.exit`）、foundation 接口枚举（去 00-setup）、外部消费者核实（`buildControllerGateContext`
  无外部引用、`styleMasterSubmitFactory` 仅 1 测试消费）。结论：**ready for apply**。
- C0 apply 完成：入口 4035→约 370 行；`command_support.mjs`（2317 行共享胶水）+ 12 命令模块落地；
  seam 授权（`PUBLIC_SHARED_INTERFACES` +13、`SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS`
  登记、manifest `shared/cli` +13）；3 测试 import 修正；诊断守护改扫命令 seam（`command_support`+
  `commands/*` 替代 `ppt_flow.mjs`）。修复 4 处拆分期 bug：`state.mjs` 漏 `join`、`style-master.mjs`
  漏 `hasExplicitCliOption`、`styleMasterFailure`/`styleMasterNextInvocation` 交叉依赖归并进
  `command_support`、`commandInit`（唯一同步 handler）漏 `export`。
- C0 验证：`npm test`（core + 全审计）绿；`openspec validate --strict` + `--all --strict`（28 specs）
  + `git diff --check` 绿；`--help`/`doctor`/`init`/`slides list`/`state --json`/`style-master inspect`/
  `validate`/`image2 plan` 8 命令 stdout/stderr 逐字节一致，`new-version` 仅 fixture 路径差异；
  `image2 artifact-view` 计时原版 3.4s ≈ 拆分 3.4s（无性能回归）。
- **已知非阻塞**：`npm run test:sweep`（vitest 全量，opt-in tier）在 76 文件并行下，图像密集型
  artifact-view 测试 9 个 30s 超时——实为既有负载争抢（fixture 构建 13.3s + 命令 3.4s 无争抢合计
  ~17s，原版同样超时），非本 change 回归；core `npm test` 不受影响。
- C1 前置（门槛 8 + 3）完成：两个 spike 结论 + 冻结记录在 `08-c1-spike-notes.md`；C1
  `openspec new change` + proposal 写完。窄决策 #2（exit 归一）按已记录倾向定「normalize to 1 +
  child status 有界进 diagnostic」，已写入 proposal §7，供人类事后复核。
