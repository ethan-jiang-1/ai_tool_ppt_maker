# Proposal: Page Image owner-issued diagnostics

## Why

Page Image 的 source/config problem facts 在四层传递中丢失或错位：`resolveVisualBrief()` 把
identity reference、visual-language selection 与 per-slide presentation resolution 的所有失败
无条件重写成 `slide-specifications.md / VISUAL BRIEF`（丢弃 registry path、`actual/expected`、
真实 owner）；`styleMasterFailure()` / `targetPageImageFailure()` 只按顶层 `error.code` 分类，
无顶层 code 的 typed errors（`PageImageSourceError`、`PageImageVisualLanguageError`、
`PageImageReferenceMaterialError`）以及未登记分类的 presentation code 落入 fallback——Style
Master 产出具有相同失败前置条件的自循环 `inspect` next，Image2 把已知 source defect 改称
`internal/report_internal`。由于 final valid CLI envelope 是 MD consumer 的控制权威，错误的结构化
next 会把 Controller 导向错误 owner 或不可前进的恢复路径。现在实施：`_backlog/plans/
cli-diagnostic-faithful-passthrough/` 研究已完成（owner/information-loss matrix、public shape
兼容性、source scope/precedence、action authority 均以源码与隔离进程复现证实），这是该路线图
3 个串行 change 中的第一个，必须端到端完成，不能先公开半成品 bridge。

## What Changes

- **新增内部 problem-fact contract**：四个 producer family（Page Source、Visual Language、
  Presentation、Reference Material）共用最小 cross-module problem-fact shape（reason、owner、
  physical source locator、logical path、subject、bounded safe actual/expected），作为独立
  capability 拥有，不把 CLI public schema 下沉到 source resolver，也不从 `Error.message` 解析
  token/owner/category/recovery。
- **修正最早的事实权威（producer/aggregation）**：`resolveVisualBrief()` 不再无条件改写——
  Page Source-owned failure 定位到真实 field（`VISUAL IDENTITY`、`SUBTITLE` 或真正的
  `VISUAL BRIEF`），reference/presentation owner 不再被重写为 slide-local `VISUAL BRIEF`；
  Reference loader 在知道 exact registry path 时绑定 bounded physical owner locator；physical
  source、logical YAML path、Page Source field 与 producer owner 保持不同语义。
- **关闭 scope/aggregation/precedence**：一个 malformed shared source 保留一个稳定 root cause，
  不复制成任意数量 slide-local roots；multi-issue truncation 与 slide order 不改变 root
  owner/reason/next；相同 reason code 来自不同 owner 时可区分；明确 whole-source validation 与
  earliest independent failure 的确定性 precedence；unselected Visual Language invalid record 的
  语义（registry-level vs selection-isolated）写入 owner spec，不由当前实现自行成为规范。
- **绑定 operation recovery**：Style Master 与 Image2 消费同一 producer fact，但各自绑定当前
  checkpoint 的 nearest legal next；`style-master inspect` 的 next 不回到具有相同失败前置条件的
  inspect；已知 source/config fact 进入 source owner repair，不再被称为 lifecycle artifact 或
  internal defect；producer 不拥有 operation invocation，operation owner 不改写 source fact；
  unsupported/invalid/unsafe/oversized fact 继续 fail closed。
- **兼容的 public CLI cutover**：明确 internal fact → public reason/source/subject/issues 的允许、
  转换与省略规则（raw `issues[]` 不直接塞进 sanitizer）；Pure/Framed 的 `style-master
  inspect/plan` 与 `image2 plan` 对四类代表性 failure 各发一个 final envelope、exit 1、stdout
  为空；诊断保留 bounded root fact 与一个 exact next，不泄露 stack、provider body、prompt、
  complete visual clause、parser/fs prose 或 secrets；delegated child passthrough 保持原 contract。
- **修正 MD consumer 合同**：`node-specification` 删除退役 `page-authority-visual-language.yaml`
  路径镜像与“按顶层 `code` + `hint` 决定 recovery”的旧消费者合同，统一消费
  `diagnostic.category/reason/next`；顶层 `code/message/hint` 只保留兼容 summary 职责。
- **删除重复路径并建立 guards**：已迁移的 source/config family 不再由 `ppt_flow.mjs`
  code/prefix sets 重新推导 owner/category/next；`attachCliDiagnostic()` 保留 delivery-notes
  jurisdiction；`diagnosticFromError()` 作为 delivery-notes 限定的受支持 seam 保留（明确
  jurisdiction + focused tests + guard 限定 import 域），不泛化为低层 source resolver 的
  CLI authority；return-category audit 以真实可执行 process evidence 为证据；target
  diagnostic process suite 进入受支持验证层级；architecture guard 有 safely planted
  violation 证明能检测 owner bypass、第二归因器与退役路径/旧消费者合同回流。

无 **BREAKING** public envelope shape：字段、exit/ stdout 规则与 diagnostic schema 保持兼容；
本 change 修正的是这些 family 在失败时发出的 category/reason/source/subject/next 语义。

## Capabilities

### New Capabilities

- `diagnostic-facts`: 内部 source/config problem-fact contract 的唯一权威——四个 producer
  family、聚合器与 operation owner 共享的最小问题事实 shape 与保留/省略规则；与公开 CLI
  envelope（`cli-surface`）和 MD consumer 合同（`node-specification`）严格分离。现有 capability
  均不拥有该跨模块内部契约，置于任一 producer capability 会使该 capability 成为其他 family
  事实的权威（违反"不复制 producer schema"）；这是长期责任，后续 error family 与 operation
  都会消费它。

### Modified Capabilities

- `cli-surface`: Style Master/Image2 对四类 source/config producer failure 的公开投影规则——
  兼容映射、bounded root fact + exact next、无第二业务归因器、fail-closed；`diagnosticFromError`
  的 seam 状态。
- `content-parsing`: Page Source-owned failure 的 field-level origin 保留；`resolveVisualBrief()`
  停止无条件改写；aggregation 的 root/affected-subjects 语义。
- `visual-config`: Visual Language 与 presentation package failure 的 owner-issued facts（logical
  path、exact source locator、safe actual/expected）；whole-source validation 与 earliest
  independent failure 的 precedence；unselected Visual Language invalid record 的规范决议。
- `visual-asset-management`: Reference issue 绑定 bounded physical registry locator；owner 通过
  aggregation 保留；同码异 owner 可区分。
- `style-master-generation`: `style-master inspect/plan` 消费 producer fact 并绑定 nearest legal
  next，不产生同前置条件自循环。
- `image-generation`: `image2 plan` 消费同一 producer fact 并绑定其 operation next；已知 source
  defect 不得被称为 internal。
- `harness-script-layout`: architecture guard 覆盖 owner bypass、第二归因器与退役路径/旧消费者
  合同回流检测（仅必要的 guard 要求）。
- `node-specification`: MD consumer 统一消费 `diagnostic.category/reason/next`；移除退役
  visual-language 路径与 `code`+`hint` 分支合同。

## Impact

- **Harness 源码**：`ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs`、
  `02-visual-system/internal/{page_image_visual_language,page_image_reference_material,
  page_image_presentation}.mjs`、`03-framed-image/index.mjs`、`04-pure-image/index.mjs`、
  `scripts/shared/cli/cli_error.mjs`、`scripts/ppt_flow.mjs`、`scripts/contracts/
  harness_architecture.mjs`，以及新增 shared problem-fact 模块。
- **OpenSpec**：main specs 8 个（上述 Modified）+ `openspec/config.yaml` capability registry（新增
  `diagnostic-facts` 条目）。
- **测试**：`tests/`（unit/integration、`tests/shared/cli/` 进程套件、`tests/contracts/`
  验证路由）、`tests_e2e/`（必要时）；全部使用隔离 fixture，不使用 production `deck_*`/`dpt_*`。
- **Control owner**：MD⇔JS protocol——JS/CLI 拥有 producer facts、envelope 与 exact next 发射；
  MD 只消费 `diagnostic.category/reason/next` 并执行合法机械动作。
- **Run-bundle contract impact**：`none`。不触碰 `deck_*`、state、receipt、journal、lock 或
  `_generated/`；无 migration、无新命令、无新 flag。
- **依赖**：无新 npm 依赖；保持 Node.js ESM。
- **Policy 引用**：
  - `human-centered-gates.md`：对未知/不安全/超限 fact 保持 `hard-stop`（protected invariant：
    source fact identity/integrity、无错误 owner 写入、无 provider call、无 receipt/plan/state
    mutation），恢复路径唯一且 secret-safe；可确定性修复的 source defect 走 `guide`
    （Agent 经 owner 修复后重跑同一 checkpoint）；本 change 不引入 `confirm` 或 waiver。
  - `agent-assistance-and-control.md`：direct control path 单一——problem fact 在 producer 产生，
    operation owner 绑定 next，CLI 只做 transport 投影，MD 不解析 prose、不复制 schema、不建立
    第二恢复权威；删除/合并的重复控制：`ppt_flow.mjs` 的 code/prefix 第二归因器、`resolveVisualBrief`
    的统一改写 catch、`node-specification` 的 `code`+`hint` 消费者分支。
  - `simple-reliable-control.md`：最短闭环（direct fact → 一个确定性检查 → earliest root cause →
    一个 nearest legal next → 重跑同一 checkpoint）；每个独立根因只给一个最近合法动作；新增
    contract/seam 均说明替代的旧归因逻辑，无法证明净简化则缩 scope。
