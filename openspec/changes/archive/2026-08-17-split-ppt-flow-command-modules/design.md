# Design: split-ppt-flow-command-modules

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| 拆分形态 | 纯拆分、零行为变化：入口 + `command_support.mjs` + 12 命令模块，只搬不改 | JS |
| 命令模块位置 | `shared/cli/commands/<name>.mjs`（kebab，与命令名一致）；root 段仍为 `shared`（已白名单） | JS |
| 共享胶水 | `command_support.mjs` 收纳跨命令 emit/exit/`runNode`+单例/binding/resolve/status/`buildControllerGateContext`/submit factories/provider transport/错误分类/`refreshProgressiveControllerTaskProjection` | JS |
| 冷启动 | 01-content 懒加载改为 `command_support` 内 memoized `loadContentApi()`；`--help`/`doctor` 不经 handler，永不触发 | JS |
| 内容符号归属 | `collectStatus`（status/state 共用，住 `command_support`）经 `loadContentApi()`；`slides.mjs` 直接 import 01-content + 02-visual-system | JS |
| state 内联体 | L3742–3943 内联 `.action()` 无损提升为具名 `commandState(runDir, opts)` 再搬 | JS |
| seam admission | `PUBLIC_SHARED_INTERFACES` +13；`SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS` 登记 `command_support`→`{01-content/index.mjs}`、`slides`→`{01-content/index.mjs, 02-visual-system/index.mjs}`；manifest `shared/cli` +13 interfaces | JS |
| 测试 import | 2 个 submit factories 从 `ppt_flow.mjs` 改指向 `command_support.mjs`（3 文件） | JS |
| 行为证据 | 同 fixture 12 命令 stdout/stderr 逐字节一致 | JS |

## 1. 目标模块布局

```
ppt_maker_harness/scripts/shared/cli/
├── cli_bootstrap.mjs          (不动)
├── cli_error.mjs              (不动)
├── command_support.mjs        (新: 跨命令共享胶水)
└── commands/
    ├── doctor.mjs  init.mjs  status.mjs  validate.mjs  build.mjs  refresh.mjs
    ├── slides.mjs  new-version.mjs  test.mjs  state.mjs  image2.mjs  style-master.mjs

ppt_flow.mjs → 入口: bootstrap 安装(L20, 保持首条)、路径常量、bundle_layout/production_marker
               静态 import、12 命令 Commander 注册、懒加载分派(动态 await import 命令模块)、
               isMain 双门 + main()。4035 行 → 估计 200–300 行。
```

## 2. 归属分组（机械搬家，不重新归属、不修 owner 渗漏）

### `command_support.mjs`（跨 2+ 命令共享）

- emit/exit：`emitFailed` `emitUsage` `exitUsage` `exitWithCode` `emitCurrentProtocolError`
  `emitExecutionRunVersionMismatch` `emitUnsupportedHarnessBinding` `createGateDiagnostic`
- binding/resolve：`resolveRunHarnessBinding` `resolveRunAdapter` `resolveTargetAuthoringDraftAdapter`
  `preflightAdapterSource` `hasExplicitCliOption`
- `runNode` + `runNode.lastChildResult` 模块级单例（emitFailed/exitWithCode 读写它）
- status 面：`metadataFields` `updateGate` `collectStatus` `enrichStatusWithState` `printStatus`
  `buildControllerGateContext`（export，保持公开）
- provider 面：`resolveImage2Run` `targetImage2Operations` `refreshProgressiveControllerTaskProjection`、
  submit factories（`targetPageImageSubmitFactory` `styleMasterSubmitFactory`，export）、
  `targetPageImageGenerateCredentials` `initializeStyleMasterImage2Transport`
  `styleMasterProviderBytesFromPayload`、错误码/响应分类机制与决策树（`pageImageDiagnosticReasonKind`
  起至 provider 响应解析全套——审计实测为 9 张分类 `Set` + 2 张操作 `Set` + 5 个正则分类函数 +
  3 个决策树函数，非计划的「28 张表」）
- artifact view 面：`artifactReferenceEntry` `artifactUnavailable` `pageArtifactGroup`
  `rebuildTargetPageImageArtifactView`
- `loadContentApi()`（memoized 动态 `import("./01-content/index.mjs")`）

### 各命令模块（handler + 仅本命令私有 helper）

| 模块 | handler | 私有 helper（随迁） |
|---|---|---|
| `doctor.mjs` | `commandDoctor` | `buildEnvSearchDirs`（现状未调用，原样保留）、`ENV_CHECK` 路径派生 |
| `init.mjs` | `commandInit` | — |
| `status.mjs` | `commandStatus` | —（用 `collectStatus`/`enrichStatusWithState`/`printStatus`/`resolveRunAdapter`） |
| `validate.mjs` | `commandValidate` | `emitSourceValidationFailure` `emitSourceStateStaleEnvelope` |
| `build.mjs` | `commandBuild` `commandPageImageBuild` | — |
| `refresh.mjs` | `commandRefresh` `commandPageImageRefresh` | — |
| `slides.mjs` | `commandSlides` | `readCanonicalSlideSource` `renderSlidesResult` `collectDeckHistoryIds` `slideTransaction` `atomicWriteCurrentSource` `validateProjectedSlideSource` `targetStructuralBaseSlidePlan` `parseTargetStructuralReceipt` `narrativeVisualSystem` `enrichTargetPageImageStructuralPlan` `projectConfirmedSlideTransaction` `applyConfirmedSlideTransaction` `ensureConfirmedApply` `slideOperationsFor` |
| `new-version.mjs` | `commandNewVersion` | — |
| `test.mjs` | `commandTest` | —（用 `runNode`） |
| `state.mjs` | `commandState`（提升） | —（状态观察/validate/repair 逻辑随迁，含 exit 2 特例） |
| `image2.mjs` | `commandImage2` `commandTargetPageImageImage2` | 入口参数校验 helper（`progressiveUnsupportedOption` `requiredPageImageHash` `requiredPilotSlideIds` `requiredProgressiveDecision`） |
| `style-master.mjs` | `commandStyleMaster` | `styleMasterNextInvocation` `styleMasterUnexpectedOption` `requiredStyleMasterPlanHash` `requestedStyleMasterCandidateCount` `styleMasterFailure` |

`STYLE_PRESETS_SORTED`/`DECK_TYPES_SORTED` 仅用于注册 `.requiredOption()` 描述文案，留在入口。
`collectStatus` 内的 `parseSlideDocument` 是 status/state 的共享内容依赖，经 `loadContentApi()`。

## 3. 冷启动快路径与内容 API

现状 L78–82：模块顶层按 `process.argv` 判断 `directRootEntry`/`rootCommand`，仅 `doctor`/`--help`/`-h`
跳过 `await import("./01-content/index.mjs")`，其余全部静态 import 始终全量加载。

拆分后：入口不再 import 01-content。`command_support.mjs` 提供 memoized
`loadContentApi()`（`contentApiPromise ??= import("./01-content/index.mjs")`）。`--help` 不触发任何
handler（不 import 命令模块）；`doctor` handler 不调用 `loadContentApi()`；`status`/`state` 经
`collectStatus` 调用、`slides` 直接调用。等价性：内容加载时机从「模块求值」移到「handler 首次使用」，
但任何用到内容的命令都在使用前 `await` 加载；`doctor`/`--help` 仍零加载。边界（唯一时序差异）：
01-content 若自身 import 失败，现状在模块求值期失败、拆分后在 handler 内失败——两者都走
`cli_bootstrap` 安装的 envelope + 非零退出，stdout/stderr 对已测路径逐字节一致。

## 4. `runNode.lastChildResult` 单例

模块级单例（L427 初始化、L132/352 读、L368/405/409/418/1520 写）与 `runNode`、`emitFailed`、
`exitWithCode` 同搬进 `command_support.mjs`，保持同一模块级绑定；`doctor`/`test` 从
`command_support` import `runNode`。不拆散、不复制。

## 5. `state` 内联体提升（零形状改动）

L3742–3943 的 `.action()` 内联体无损提升为 `async function commandState(runDir, opts)`（`opts` 含
`json`/`validateState`/`repairKnownExecutionMismatch`）。**退出机制逐字保留**：内联体现用
`process.exitCode = 1; return;`（失败提前 return）与纯 `return;`（成功），靠自然退出——绝不改为
`process.exit()`（`process.exit` 是强制同步退出，与现状的自然退出不等价，可能截断未刷写的 stdout）。
提升后 `commandState` 内部保持同款 `process.exitCode = 1; return;`，入口注册 action 仅
`await commandState(runDir, opts);`，**不加** `process.exit(code)`。保留：mutual-exclusion 校验、
`setCliOutputMode("json")` 时序、`resolveRunHarnessBinding`、exit 2 的 `exitCliError(..., 2)` 特例、
`registerCliJsonReport` + JSON/文本投影。这是纯搬移，无形状改动。

## 6. seam admission（architecture guard）

`harness_architecture.mjs` 三处：

1. `PUBLIC_SHARED_INTERFACES` 追加 13 项：`shared/cli/command_support.mjs` + 12 个
   `shared/cli/commands/<name>.mjs`（保持按路径排序）。入口 import 命令模块/`command_support` 才不
   触发 `root-private-shared-import`。
2. `SHARED_PUBLIC_FOUNDATION_METHOD_MODULE_INTERFACE_IMPORTS`（当前空 Map）追加：
   - `shared/cli/command_support.mjs` → `new Set(["01-content/index.mjs"])`
   - `shared/cli/commands/slides.mjs` → `new Set(["01-content/index.mjs", "02-visual-system/index.mjs"])`
   这是「命令模块 import foundation index」的许可边界；未登记则触发
   `shared-foundation-method-module-import`。
3. `tests/contracts/source-test-ownership.json`：`shared/cli` owner 的 `interfaces` 追加 13 项（有序）；
   否则 `missing-interface-owner`（`REQUIRED_MANIFEST_INTERFACES` 展开 `PUBLIC_SHARED_INTERFACES`）。

不变量：`ROOT_WHITELIST` 无需新增（`shared` 已在）；`EXECUTABLE_INVENTORY` 不变（命令模块不得带
direct-entry indicator：无 `#!`、无 `cli_bootstrap.mjs?entry=`、无 `.parse(process.argv)`、无
`installStandaloneFailureEnvelope(`——这些全部留在入口）；`cli_return_audit.mjs`（数据表，按命令名）、
`harness_document_command_audit.mjs`（spawn `--help`，注册留在入口）零改动。

## 7. 路径派生（零行为变化硬约束）

搬进 `command_support.mjs`/命令模块的代码若引用 `__filename`/`__dirname`/`HARNESS_DIR`/`ENV_CHECK`，
必须重派生为**字节等价**的入口路径，不得静默指向新模块：

- `command_support.mjs` 自算 `__dirname`，导出 `HARNESS_DIR`（`resolve(__dirname, "../../..")`，等于
  今日入口的 `HARNESS_DIR`）与 `PPT_FLOW_ENTRY`（`join(HARNESS_DIR, "scripts", "ppt_flow.mjs")`）。
- `emitSourceStateStaleEnvelope` 的 `next.invocation.args: [__filename, "image2", "plan", route.run_dir]`
  改用 `PPT_FLOW_ENTRY`（绝对路径等价，JSON 输出逐字节一致）。
- `ENV_CHECK`（`join(HARNESS_DIR, "scripts", "00-setup", "env-check.mjs")`）随 `doctor.mjs` 用
  `command_support` 导出的 `HARNESS_DIR` 重派生。
- 其余 `__filename` 仅用于 `isMain` 判断与 help/usage 文本，全部留在入口。

## 8. 测试 import 修正（3 文件、2 符号）

- `targetPageImageSubmitFactory`（L2410）、`styleMasterSubmitFactory`（L2576）→ `command_support.mjs`。
- 修正 `tests/03-framed-image/test_framed_workflow.mjs:89`、`tests/04-pure-image/test_pure_workflow.mjs:89`
  （`targetPageImageSubmitFactory`）、`tests/shared/image2/test_style_master_raw_binding.mjs:16–17`
  （两符号）的 import 源为 `../../ppt_maker_harness/scripts/shared/cli/command_support.mjs`。
- `buildControllerGateContext`（L609）保持 export（无测试引用，但属公开 API）。
- 测试文件不在架构 guard 的 import-edge 校验范围内（guard 只校验 scripts 域），修正后零风险。

## 9. 计划修正（前置审计发现，已吸收）

1. 「28 张错误码分类表」→ 实为 9 张错误码/响应分类 `Set` + 2 张操作 `Set` + 5 个正则分类函数 +
   3 个决策树函数；不影响拆分，仅内部描述校正。
2. 测试漏报 `styleMasterSubmitFactory` → 已纳入 §8。
3. `state` 无具名 handler → §5 提升。

## 10. 验证策略

零行为变化 change，不新增测试资产；验证靠**现有测试 + 审计 + 逐字节证据**三层：

- **unit/integration**：`npm test` 全绿（现有 spawn 测试 + 3 个修正 import 的测试）。评估结论：不新增
  unit/integration——本 change 不引入新行为，逐字节验收比新测试更能证明「零变化」。
- **审计**：`harness_architecture`（seam admission 后必须绿）、`harness_coherence`、
  `harness_document_command_audit`、`cli_return_audit`、`test_process_docs_consistency` 全绿。
- **冷启动 smoke**：拆分前后 `--help` 耗时同数量级（不回退）。
- **逐字节证据（核心判据）**：拆分前后对同一 fixture run bundle 跑全部 12 命令——`init` 用新建 deck
  根、`slides` 用 list/resolve、`image2` 用 plan/artifact-view 等无提交形态、`style-master` 用 inspect、
  其余按最小合法参数——stdout/stderr 逐字节一致。
- `git diff --check` + `openspec validate split-ppt-flow-command-modules --strict` 全绿。

## 11. 风险与回退

- **bootstrap import 顺序**：`import "./shared/cli/cli_bootstrap.mjs?entry=ppt_flow.mjs"` 保持入口首条
  静态 import，先于任何可能抛错的 import。
- **顶层 `await import` 快路径**：入口不再有顶层 01-content import；等价性见 §3。
- **`runNode.lastChildResult` 单例**：§4 同模块搬迁。
- **`isMain` 双门**：留在入口；命令模块不复制入口判定。
- **错误码表归属**：机械搬进 `command_support`，不在 C0 修归属。
- **provider transport 双决策树**（image2/style-master）：同搬 `command_support`，不拆。
- **JSON stdout 契约**：`registerCliJsonReport`/`console.log(JSON.stringify(...))` 逐字保留，
  `setCliOutputMode` 调用时序不变。
- **回退**：单 commit 拆分，`git revert` 即回 4035 行单文件形态；无跨 change 状态残留。
