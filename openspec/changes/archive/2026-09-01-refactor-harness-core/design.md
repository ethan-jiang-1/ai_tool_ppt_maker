## Context

三个巨大的可拆文件混合了多个独立关切，增大了 Coding Agent 的理解与改动成本（详见 `proposal.md` 的 Why）。这是纯代码重组，不改变任何行为、状态格式、CLI 输出或协议。

拆分基于已完成的内部调用图分析：

- `03-framed-image/index.mjs`（2021 行）与 `04-pure-image/index.mjs`（1510 行）是唯一的 "God Index"——项目其他所有 `index.mjs`（01-content: 60 行，02-visual: 49 行）都是纯 re-export 层。两者内部结构是镜像复制的，仅前缀不同（`Framed` vs `Pure`）。
- `shared/cli/command_support.mjs`（2493 行，98 exports）只有 2 个 private 函数，是一个纯 utility 仓库，7 个独立关切彼此几乎无内部调用。
- `shared/state/state.mjs`（3583 行，95 exports）所有写操作都通过单一 CAS 原子 `writeState()`，这是安全的拆分点。

## Goals / Non-Goals

**Goals:**
- 将三个文件的逻辑按职责迁移到细分模块，index 变薄
- 所有 export 签名保持不变，外部 import 路径通过过渡层保持兼容
- `npm test`（core 验证套件）全绿 + 全量 vitest sweep 无新增失败
- 每个新模块文件控制在 ~800 行以内（除个别核心规划器）

**Non-Goals:**
- 不改变任何行为、状态 schema、CLI 输出、诊断协议或 run-bundle contract
- 不修改 `openspec/config.yaml`、任何 spec 文件、宪法文件（本 change 是 Change 1，spec 所有权修复在 Change 2）
- 不重构 `bundle_layout.mjs`、`style_master_plan.mjs`、`page_image_progressive_raw_owner.mjs`、`harness_architecture.mjs`（见 plan 的"保留不动"）
- 不新增测试用例（纯重构，验证靠现有 928 用例）

## Decisions

### 决策 1：三个拆分合并为一个 change

将 03/04 index、command_support、state 三个拆分合并到 `refactor-harness-core` 一个 change。

**理由**：三个拆分操作的文件集完全不重叠（`03-framed-image/` + `04-pure-image/`；`shared/cli/`；`shared/state/`），无冲突风险。OpenSpec 每个 change 有 proposal→specs→design→tasks→apply→validate→archive 的完整周期成本，合并减少 2/3 的编排开销。

**备选**：拆成 3 个独立 change。被否决——文件不重叠，独立 change 只增加开销无收益。

### 决策 2：index.mjs 变纯 re-export 层

03/04 拆分后，`index.mjs` 只做 `export { ... } from "./internal/xxx.mjs"`。

**理由**：与项目其余 `index.mjs`（01-content、02-visual、00-setup）保持一致。外部调用者 `from "../03-framed-image/index.mjs"` 的 import 路径不变，无需改动任何外部文件。

**约束**：`compileFramedTargetRawPlanCandidate` 被 6 个出口调用（build raw plan、build progressive plan、refresh 等），必须进独立的共享模块 `framed_raw_plan.mjs`，不能埋入某个特定出口模块，否则会产生循环依赖。

### 决策 3：state.mjs 保留 re-export 过渡层

拆分后 `state.mjs` 保留核心 I/O（readState/writeState/parseStateYaml/validateState 等），并从 `state_execution.mjs`、`state_identity.mjs`、`state_evidence.mjs`、`state_progressive.mjs` re-export 其余函数。

**理由**：40 个测试文件 + 约 23 个脚本 import 自 `state.mjs`。保留 re-export 层意味着所有外部 import 路径不变，零改动。核心 `state.mjs` 与子模块构成 ESM 循环引用（核心 re-export 子模块、子模块 import 核心 I/O）——因全部模块均为纯函数声明、无顶层副作用消费，运行期安全；已实测可加载。

**CAS 写入约束**：`writeState` 是 CAS 原子写入（带 `expectedStateSha` 前置条件）。所有子模块必须 import 同一个核心 `writeState`，不得各自实现或复制写入逻辑。

### 决策 4：command_support.mjs 用 compat re-export 过渡层

拆分后 `command_support.mjs` 保留核心 adapter 解析（preflightAdapterSource/resolveRunAdapter 等），并 re-export 其余 6 个新模块（cli_diagnostics、cli_image2_response、cli_style_master、cli_status、cli_artifact_view、cli_deadline）。

**理由**：17 个 `commands/*.mjs` + 8 个测试文件 import 自 `command_support.mjs`。compat 层让逐文件迁移成为可能——每迁一个命令到精确模块，跑一次测试，再删除对应 re-export。最终 command_support.mjs 只保留自己的函数。

### 决策 5：拆分边界按"职责"而非"大小"

每个新模块按职责聚合（review 函数进 review 模块、progressive 进 progressive 模块），不按行数硬切。

**理由**：按职责切，模块自解释；按行数切会产生需要跨文件追踪的碎模块。新模块约 200-800 行，仍在单文件可读范围。

### 决策 6：验证策略

- **不新增测试**。这是纯重构，行为不变，现有 928 用例是充分的回归门。
- **每个迁移步骤后跑 `npm test`**（`node tests/contracts/run_development_verification.mjs`，core 套件 ~1s）。
- 对 command_support 和 state 的过渡层，新增一个小的 import smoke 测试（可选）验证 re-export 完整性——如现有架构测试覆盖则可省。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 拆 index.mjs 时 `compileFramedTargetRawPlanCandidate` 跨模块调用断裂 | 已画调用图（被 6 个出口调用），进独立 `framed_raw_plan.mjs`，避免循环依赖 |
| 拆 state.mjs 时 CAS `writeState` 前置条件被破坏 | 核心 `state.mjs` I/O 层不动，子模块只 import，不复制写入逻辑 |
| 拆 command_support 时 18 个命令文件 import 需更新 | compat re-export 过渡层，逐文件迁移，每迁一个跑一次测试 |
| re-export 层遗漏某函数导致运行时 import 失败 | `npm test` 的 import 链会覆盖；迁移完成前不删除过渡层 |
| 镜像拆分（Framed/Pure）只改了一侧导致不对称 | 两个模块按同一 checklist 步骤执行，每侧独立跑测试 |
| 单模块仍超过 800 行（如 style_master_plan 保留 2324 行） | 本 change 不动它——它是"保留不动"清单成员，只有 4 个 export，对外接口极窄 |

## Migration Plan

1. **03-framed-image 拆分**：按 1.1-1.11 步骤，每步后跑 `npm test` 全绿
2. **04-pure-image 拆分**：镜像执行 1.1-1.11（前缀换 Pure），全绿
3. **command_support 拆分**：先建新模块 + compat 层，再逐文件迁移 18 个命令，最后收缩 command_support
4. **state 拆分**：先建新模块 + re-export 层，确认 31 个测试零改动全绿，再清理
5. **最终验证**：`npm test` + `openspec validate --all --strict`（确认不破坏现有 specs）

**回滚策略**：每步的过渡层保留原 import 路径，任意一步失败只需还原该步的文件变动，不影响其他部分。

## Open Questions

无。所有决策均由现有调用图和文件分析确定，可在实施中回答的细节（如具体函数放哪个模块）不改变方案。