## Why

公共接缝面（`harness_architecture.mjs` 已注册的 62 个 public shared interfaces + 7 个 stage `index.mjs`，共 69 个文件）中**没有一个**携带本 change 规定的 Authority 指针契约头：16 个完全没有块注释、31 个契约头位于文件中部、22 个头顶有头但均无指针。coding agent 打开这些文件时拿不到"这个模块承诺什么、权威 spec 在哪"的指路牌，只能反查 openspec spec 逆向工程契约。这与本 repo"文档即控制面"的定位失衡——import 边界有机器守护，接缝的**文档契约**却没有。同时，`ppt_flow.mjs` 头注释与 `harness-script-layout` spec 把 COMMANDS.md 称为 "human-facing command map"，而 `commands-reference` spec 定义它是 "novice-facing discovery reference"——两处权威对同一文件各用一套称谓，是本次外部评估误判 COMMANDS.md 职责的直接诱因。

## What Changes

- **新增要求**：每个已注册公共接缝文件（69 个）必须携带契约头——即文件首个 `/** … */` 块注释（无论位于 import 之上还是之下）——内含至少一行 `Authority: openspec/specs/<capability>/spec.md` 指针，且被指 spec 必须真实存在；头注释是最小指路牌，**禁止复述 requirement**（防止既有"一条规则多处复述"的蔓延回潮）。
- **机器守护**：`harness_architecture.mjs` 新增契约头检查（清单驱动、指针指向的 spec 文件必须真实存在），作为现有 architecture snapshot 校验的一部分；失败为确定性 `guide` 结果——Agent 机械补头后重跑同一检查。
- **回填**：69 个注册文件全部达到合规（16 个新增契约头 + 53 个在既有头内插入 Authority 行），按目录分组成组提交。**只动注释，不动任何结构**——包括 4 个上一 plan 明确"保留不动"的大文件。
- **术语对齐**：修改 `harness-script-layout` 中 "Unified entry names command authorities" requirement 的措辞——COMMANDS.md 的称谓统一为 `commands-reference` 已定义的 "novice-facing discovery reference"，并同步 `ppt_flow.mjs:11` 头注释；消除 "command map" 措辞。
- **明确不做**：不给 internal/ 实现文件加头注释要求；不新建命令枚举文档；不为可执行入口（`env-check.mjs`、`lab_cli.mjs`，其契约归 spec + `--help`）扩展清单。

## Capabilities

### New Capabilities

（无——不引入新 capability。）

### Modified Capabilities

- `harness-script-layout`：
  1. **ADDED** requirement——已注册公共接缝文件的契约头与 Authority 指针，及其 architecture guard 检查与 `guide` 恢复路径；
  2. **MODIFIED** requirement "Unified entry names command authorities instead of re-declaring the inventory"——其中 COMMANDS.md 称谓从 "the human-facing command map" 改为与 `commands-reference` 一致的 "the novice-facing discovery reference"。

## Impact

- **Harness 源码范围**：`ppt_maker_harness/scripts/contracts/harness_architecture.mjs`（新增检查）、69 个脚本文件（仅块注释：16 新增 + 53 行内插入）、`ppt_maker_harness/scripts/ppt_flow.mjs`（1 行头注释）；`tests/contracts/test_harness_architecture.mjs`（守护的阴性/阳性用例）。
- **Control owner**：JS（deterministic check）。无 MD⇔JS protocol 变化，无 CLI 输出变化，无 gate/state/receipt 变化。
- **Run-bundle contract impact**：`none`。不触碰 run-bundle 布局、state、schema 或任何生产路径；`_generated/`、`deck_*` 不受影响。
- **验证面**：`npm test`（core）、`npm run test:sweep`、`openspec validate --all --strict`。
- **Policy 锚点**：`simple-reliable-control.md` Blocking-Rule Burden 五问在 design.md 逐条作答（复用现有 architecture guard 作单一评估器，不新增 checker 模块、不设 warn 过渡态）；控制结果归类 `human-centered-gates.md` 的 `guide`（确定性修复，无新人类决定）；`agent-assistance-and-control.md` 下 Agent 拥有"补契约头"的机械修复，无新增人类确认。
