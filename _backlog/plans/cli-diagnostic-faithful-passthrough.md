# Plan: CLI 诊断事实、恢复权威与相邻问题的串行修复路线

> 类型：优先级路线图 + OpenSpec change 队列
> 更新：2026-08-16
> 状态：全部 3 个 change 已实现、验证并 archive；路线图完成
> 当前 OpenSpec：`openspec list --json` 为 `changes: []`
> 总进度：研究里程碑 `2 / 2`；实施 change `3 / 3` ✅

## 最终判断：3 个 change

6 个 change 的管理成本过高。最终建议收敛为 3 个：

1. `page-image-owner-issued-diagnostics`
2. `align-doctor-operation-readiness`
3. `project-validate-source-state`

不能再少的原因：

- Page Image problem fact、operation recovery、public CLI projection、shared-source scope 和 guards 虽然横跨
  多层，但共同服务一个终态，应放在同一个 change 内完成原子切换。
- Doctor operation readiness、runtime dotenv/startup precedence 属于环境/capability 与 secret boundary，
  不是 diagnostic fact contract。
- `validate` 的 source-valid/state-stale observation 是成功事实与 hard-stop 的组合投影，不是 hard-failure
  envelope；它依赖 Change 1 稳定 source-invalid 语义，但不应混入 Change 1。

如果把后两项也塞进 Change 1，一个 change 会同时改变 source authority、public failure schema、环境
加载优先级和 validate observation，无法独立证明 negative path 或安全 cutover。3 个是当前质量不下降的
最小数量。

## 研究依据

本文件是总进度账本。完整证据保存在同名子目录：

- [`README.md`](cli-diagnostic-faithful-passthrough/README.md)：研究索引；
- [`09-synthesis.md`](cli-diagnostic-faithful-passthrough/09-synthesis.md)：问题综合；
- [`10-remediation-priority-and-order.md`](cli-diagnostic-faithful-passthrough/10-remediation-priority-and-order.md)：处置优先级与实施依赖顺序；
- [`11-legacy-trace-relevance.md`](cli-diagnostic-faithful-passthrough/11-legacy-trace-relevance.md)：current-layer legacy audit 与本路线图的吸收/延期边界。

调查证明问题不是“给 `PageImageVisualLanguageError` 加一个 code”，而是同一事实经过四层时失真：

```text
source/config producer
  -> Page Source aggregation
  -> operation recovery owner
  -> public CLI envelope
```

因此 Change 1 必须端到端完成，不能先公开一个半成品 bridge，再靠后续 change 修正 owner 或 scope。

## 执行纪律

1. 同一时间只允许一个本路线图下的 active OpenSpec change。
2. 当前 change 完成实现、验证、main spec 同步和 archive 后，才启动下一个。
3. 每个 change 必须有独立终态，不能依赖下一个 change 才保持 public surface 安全。
4. 勾选框只有在对应证据存在时才从 `[ ]` 改为 `[x]`。
5. 只有新的一手生产阻塞证据才能触发重排；重排先修改本文件并记录理由，不并行开 change。
6. 若 Change 1 design 发现必须做 incompatible public migration，或 unselected-record 语义无法在同一安全
   cutover 内关闭，才允许重新评估拆分；不能因为实现麻烦预先再拆 change。

## 总进度清单

- [x] 完成问题复现、failure inventory、边界模型、public shape、scope、action authority 和历史测试审计。
- [x] 完成“控制面伤害”与“永久实施依赖”两轴排序。
- [x] Change 1：`page-image-owner-issued-diagnostics`（scaffold → proposal → delta specs → design → tasks → 实现 Work Packages A–E → 回归 → main specs 同步 → archive 于 2026-08-16）。
- [x] Change 2：`align-doctor-operation-readiness`（planning → polish → 实现 → 回归 → archive 于 2026-08-16）。
- [x] Change 3：`project-validate-source-state`（planning → 实现 → 回归 → archive 于 2026-08-16）。

当前状态：路线图全部落地（3/3）。后续仅剩 bug 台账 owner 的正式关闭动作（BUG-067/068/069/070
评估记录均已写入本文件）。

> 进度记录（2026-08-16，post-Change-3-archive）：Change 3 完成实现并 archive 为
> `openspec/changes/archive/2026-08-16-project-validate-source-state/`。main specs 同步 +2/~1
> （cli-surface 新增 validate 投影 requirement；node-specification R18 修正 `--check-gates` →
> `--validate-state` + 新增 additive observation 消费者条款）。
> 实现：`commandValidate` 拆两段投影——stage 1 source-only candidate parse（既有
> `resolveCandidateSource`），失败走 Change 1 problem-fact envelope（`source_validation`/
> `edit_source`）；stage 2 source/state identity 绑定，`TARGET_SOURCE_STATE_IDENTITY_MISMATCH`
> → state-stale envelope（reason `target_source_state_identity_mismatch`、owner rebind next
> （image2 plan invocation）、additive `source_valid: true`）；`sanitizeCliDiagnostic` 增加
> `source_valid` 投影规则（仅字面 true，其余省略）；`state.mjs` 头部注释
> `--check-gates` → `--validate-state`；全仓 `--check-gates` 在实现中清零（spec 仅保留禁止句）。
> 验证：进程矩阵 4/4（source-invalid / state-current / state-stale 无写入 / source 优先于
> stale）、sanitizer 29/29、sweep 652/652、core 通过、`openspec validate --strict` 通过。
> BUG-069 评估记录：public observation（source-valid/state-stale 分离投影）与 consumer 回归
> （`source_valid` 非权威、reason/next 唯一）均通过；按计划评估关闭，正式关闭留给 bug 台账
> owner。H-2 关闭证据：`--check-gates` 不再作为现行 state 入口（spec/实现注释已统一
> `--validate-state`）。M-3（触及范围）关闭证据：R18 内 retired `mode` 表述统一为 selected
> workflow；全仓术语扫荡仍归 legacy audit。

> 进度记录（2026-08-16，post-Change-2-archive）：Change 2 完成实现并 archive 为
> `openspec/changes/archive/2026-08-16-align-doctor-operation-readiness/`。main specs 同步 +4/~1
> （environment-check +2、image-generation +1、style-master-generation +1、cli-surface R13 修正）。
> 实现：新增受限 startup loader `shared/image2/startup_env.mjs`（只读声明 keys：
> `IMAGE2_API_KEY`/`IMAGE2_BASE_URL`/`IMAGE2_PROVIDER_PROFILE_ID`；shell > deck .env > cwd .env
> 补缺；无值输出）；doctor run-bound branch、`image2 authorize/generate`、Style Master
> authorize/generate、env-check 全部统一走该 loader；doctor operation registry 移除隐藏
> `image2-raw` alias 与无 owner readiness 的 `assembly-notes`（accepted =
> {framed-local-refresh, raw-generation, full-build}）；cli-surface R13 的"authorization 不加载
> dotenv"条款修正为"authorize 仅解析受限非秘密 startup env 做 profile identity 检查；credential
> 仍 generate-scoped"。
> 验证：loader unit 6/6、env-check 63/63、sweep 652/652、core 通过、Style Master lifecycle
> 进程套件 4/4（修复其存量 fixture：缺 confirmed profile）、BUG-070 进程回归 3/3（e2e：
> doctor READY → image2 authorize 无 shell export 成功；deck .env mismatch → hard-stop 零
> provider 副作用；Style Master authorize 同源）、`openspec validate --strict` 通过。
> BUG-070 评估记录：真实公开入口回归（doctor raw-generation READY → exact `image2 authorize`
> 同源成功；mismatch 仍 hard-stop）已通过；按计划仅在真实进程边界回归通过后评估关闭，正式关闭
> 留给 bug 台账 owner。M-5 #6/#7 关闭证据：`assembly-notes` 不再 accepted（usage 拒绝），
> `image2-raw` alias 移除（usage 拒绝，唯一名 raw-generation），doctor help/accepted/实际 checks
> 一致。
> 存量未动：`test_process_target_diagnostics.mjs` 13 项在 HEAD 基线即失败（fixture 早于
> confirmed-profile/runtime-selector 要求，失败模式与基线一致）；全量 mock e2e 存在并发抖动
> （基线同样存在 inactive-run/inspection/narrative 偶发失败，单跑全绿）。

> 进度记录（2026-08-16，post-archive）：Change 1 完成实现并 archive 为
> `openspec/changes/archive/2026-08-16-page-image-owner-issued-diagnostics/`。main specs 同步 +15/~2/0
> （新增 `diagnostic-facts` main spec；node-specification 2 处 MODIFIED；harness-script-layout 新增 guard
> 要求等）。实施证据：unit 646/646（`npm run test:sweep`）、进程矩阵 26/26
> （`tests/shared/cli/test_process_source_config_diagnostics.mjs`：Pure/Framed × `style-master inspect/plan` ×
> `image2 plan` × 四 family，断言 exit 1、空 stdout、单信封、`source_validation`/`edit_source`、完整 tree
> 字节不变、无 provider call、oversized root 稳定、无 secret 泄漏）、mock e2e 31/31、core `npm test` 通过、
> `openspec validate --strict` 通过、guard planted-violation 6 项通过。核心行为：三命令对损坏 registry
> 发出 `source_validation` + `edit_source`（source 指向真实 registry 文件，不再误指
> `slide-specifications.md`，`style-master inspect` 不再自循环，`image2 plan` 不再称 internal）。
> 已知存量：`test_process_target_diagnostics.mjs` 13 项与 `test_process_style_master_lifecycle_integration.mjs`
> 4 项在 HEAD 基线即失败（progressive raw/credential/async 路径，与 Change 1 无关，已验证 stash 对比）。
> BUG-067/068 评估记录：两项对应的真实进程回归（Style Master inspect/plan 无自循环、`image2 plan` 不称
> internal、无写入、fail-closed）已通过；按计划仅在全部对应回归通过后评估关闭，正式关闭动作留给
> bug 台账 owner，本路线图不再持有。

## 排序依据

| 顺序 | Change | 为什么现在做 | 依赖 | 完成后 |
|---:|---|---|---|---|
| 1 | Page Image owner-issued diagnostics | 同时是最基础和最高控制面伤害：上游事实会丢失，公开 next 又会自循环或指错 owner | 研究结论 | 评估关闭 BUG-067/068，并建立后续 source-invalid 权威 |
| 2 | Align doctor operation readiness | 独立但高影响：doctor READY 与真实 operation capability/startup facts分叉 | Change 1 默认先完成；技术上独立 | 评估关闭 BUG-070，并关闭相关 doctor registry旧痕迹 |
| 3 | Validate source/state projection | 需要先可信地区分 source-invalid 与 source-valid | Change 1 | 评估关闭 BUG-069 |

Change 2 技术上可以独立实施，但默认仍排在 Change 1 后，因为当前最危险的是 valid diagnostic envelope
向 Controller 发出错误动作。若 BUG-070 重新成为当前生产 blocker，只能在没有 active change 时显式重排。

## Change 1：`page-image-owner-issued-diagnostics`

**状态：NEXT**

### 一个终态

所有受支持的 Page Image source/config failure 都从 producer 到 public CLI 保持正确、bounded、
secret-safe 的 root fact；Style Master/Image2 operation owner绑定一个当前 checkpoint 的 nearest legal
action；direct CLI 只做兼容的 envelope projection，不再建立第二个业务归因器。

这个终态同时包含原 6-change 方案中的“事实基础、公开恢复、shared-source scope、guards/cleanup”。它们
不能独立 cutover，所以合并为一个 OpenSpec change，但在 change 内按工作包逐步完成。

### 预期 capability 范围

- `content-parsing`：Page Source field ownership 与 resolver-origin aggregation；
- `visual-config`：Visual Language、presentation package、whole-source scope；
- `visual-asset-management`：reference registry/path/identity facts；
- `style-master-generation`、`image-generation`：operation owner action binding；
- `cli-surface`：public diagnostic、兼容、bounds、exit/stdout/stderr；
- `harness-script-layout`：仅用于必要的依赖/architecture guard；
- `node-specification`：修正当前 visual-language source路径与旧 consumer envelope；不复制 producer schema。

### Work Package A：稳定 problem facts

- [x] 定义四个 producer family 共用的最小 cross-module problem-fact contract，不把 CLI schema下沉到
  source resolver。
- [x] `resolveVisualBrief()` 不再把 identity、visual language 和 presentation failure 无条件改写成
  `VISUAL BRIEF`。
- [x] Page Source-owned failure定位到实际 field，例如 `VISUAL IDENTITY`、`SUBTITLE` 或真正的
  `VISUAL BRIEF`。
- [x] Reference loader 在知道 exact registry path 时保留 bounded physical owner locator。
- [x] Physical source、logical YAML path、Page Source field和 producer owner保持不同语义。
- [x] `node-specification` 不再把退役的 `page-authority-visual-language.yaml` 写成现行 readiness source；路径
  表述复用当前 run-bundle owner，而不是另写字符串 mirror。
- [x] 不从 `Error.message` 解析 token、owner、category 或 recovery。

### Work Package B：关闭 scope、aggregation 和 precedence

- [x] 一个 malformed shared source保留一个稳定 root cause，不被复制成任意数量的 slide-local roots。
- [x] Root source、logical locator和 affected slides/selections保持不同语义。
- [x] Multi-issue truncation或 slide order不能改变 root owner、reason或 next。
- [x] 相同 reason code来自 Visual Language 与 Reference Material时仍可区分 owner和 repair source。
- [x] 明确 whole-source validation 与 earliest independent failure 的 deterministic precedence。
- [x] 裁决 unselected Visual Language invalid record 是 registry-level failure还是 selection-isolated，并写入
  owner spec；不能让当前实现自行成为规范。

### Work Package C：绑定 operation recovery

- [x] Style Master 与 Image2 消费同一 producer fact，但各自绑定当前 operation 的一个 nearest legal next。
- [x] `style-master inspect` 的 next不能回到具有相同失败前置条件的 inspect。
- [x] Known source/config fact进入 source owner repair，不再被称为 lifecycle artifact或 internal defect。
- [x] Source producer不拥有 Style Master/Image2 invocation；operation owner不改写 source fact。
- [x] Unsupported、invalid、unsafe 或 oversized fact继续 fail closed，不猜 source、retry或 action。

### Work Package D：做兼容的 public CLI cutover

- [x] 明确 internal fact到 public reason/source/subject/issues的允许、转换和省略规则；raw `issues[]` 不能
  直接塞进 sanitizer。
- [x] 枚举 MD consumer和测试依赖；优先使用现有 public shape，确需 additive field时先定义版本、兼容
  和 cutover证据。
- [x] Pure/Framed 的 `style-master inspect/plan` 与 `image2 plan` 对四类代表性 failure发出一个 final
  envelope、exit 1、stdout为空。
- [x] Diagnostic保留 bounded root fact和一个 exact next；不得泄露 stack、provider body、prompt、
  complete visual clause、parser/fs prose或 secrets。
- [x] Delegated child diagnostic passthrough保持原 contract，不与同进程 domain error混为一谈。
- [x] `node-specification` 删除“MD Controller 按顶层 `code` + `hint` 决定 recovery”的旧消费者合同，统一
  消费 `diagnostic.category/reason/next`；顶层 `code/message/hint` 只保留兼容 summary 职责。
- [x] Cutover失败时保留 secret-safe fail-closed；不保留双写、双读或旧新两套 recovery authority。

### Work Package E：删除重复路径并建立 guards

- [x] 已迁移 source/config family不再由 `ppt_flow.mjs` code/prefix sets重新推导 owner/category/next。
- [x] 保留 `attachCliDiagnostic()` 已有 delivery-notes jurisdiction；不得把它泛化成低层 source resolver
  的 CLI authority。
- [x] `diagnosticFromError()` 要么在明确 jurisdiction 和 tests 下成为受支持 seam，要么 retire。
- [x] Return-category audit可追溯到真实、可执行的代表性 process evidence，而不只验证 probe文件存在。
- [x] Target diagnostic process suite进入不会被 core/sweep结果误解的受支持验证层级。
- [x] Architecture guard有 safely planted violation，证明能检测 owner bypass、第二归因器或逃逸 guard scope。
- [x] Current-layer guard能拒绝退役 visual-language path和旧 consumer `branch on code/hint` 合同重新进入
  main specs/current guidance。
- [x] Guard owner、freshness trigger和旧分类路径 retirement evidence写入 design/tasks。

### Change 1 完成判据

- [x] 四个 producer family在 single-root 与 shared/multi-page fixture中保持正确 owner/origin/locator。
- [x] Reference defect不再被误定位为 `slide-specifications.md / VISUAL BRIEF`。
- [x] Identity role failure定位到 `VISUAL IDENTITY`；Framed header conflict定位到真实 header/class field。
- [x] 五页 shared registry fixture产生稳定 root diagnosis，bounds不改变根因。
- [x] Pure/Framed、三个公开命令的 category/reason/source/subject/issues/next回归通过。
- [x] `style-master inspect/plan` 不自循环；`image2 plan` 不把已知 source defect称为 internal。
- [x] 完整 fixture owner roots字节不变，无 receipt/plan/state mutation，无 provider call。
- [x] Secret-like、absolute escape path、parser prose、complete clause和 oversized fixture均安全退化。
- [x] Old-entry retirement和 planted negative guard均有通过证据。
- [x] Legacy audit 的 H-1、M-4 在当前层关闭，且没有扩展到无关术语/schema/deck清扫。
- [x] BUG-067、BUG-068 只在全部对应回归通过后评估关闭（评估记录见上文进度记录；正式关闭留给 bug 台账 owner）。

### Change 1 生命周期

- [x] `openspec new change "page-image-owner-issued-diagnostics"` scaffold完成。
- [x] Proposal 完成并确认 WHY、capabilities、control owner、run-bundle impact和 protected invariants。
- [x] Delta specs 完成。
- [x] Design 完成 authority、surface grade、compatibility/cutover、negative path、recovery和guard决策。
- [x] Tasks 完成，并按 specs/source authority -> producer/aggregation -> operation -> CLI -> guards/tests排序。
- [x] Work Package A 完成并通过 focused tests。
- [x] Work Package B 完成并通过 scope/precedence tests。
- [x] Work Package C 完成并通过 owner-action tests。
- [x] Work Package D 完成并通过 Pure/Framed process tests。
- [x] Work Package E 完成并通过 architecture/negative-control tests。
- [x] `openspec validate page-image-owner-issued-diagnostics --strict --no-interactive` 通过（planning 与实施后均通过）。
- [x] 必要 regression通过，main specs同步并 archive。

## Change 2：`align-doctor-operation-readiness`

**状态：ARCHIVED（2026-08-16）**

### 一个终态

每个公开、accepted 的 doctor operation都由真实 owner readiness支撑；Image2 raw-generation、
authorize/generate 和相关 Style Master provider operations使用同一个受限 startup loader与同一环境
优先级。READY不再与实际 operation capability或启动事实分叉。

### 预期 capability 范围

- `environment-check`：readiness使用的 runtime source；
- `image-generation`、`style-master-generation`：provider boundary startup；
- `notes-injection` / `pptx-assembly`：仅当 `assembly-notes` 继续保留为公开 doctor operation时修改；
- `cli-surface`：只在公开 diagnostic或命令行为变化时修改。

### 必须解决

- [x] 显式 process environment优先；deck `.env` 只补缺；project/cwd `.env` 只补仍缺字段。
- [x] Loader只读取已声明 runtime keys，不输出值或 secrets。
- [x] 所有宣称 ready/executable 的相关入口共享同一来源和 precedence。
- [x] Doctor operation registry只有公开、真实实现的 operation：移除隐藏 `image2-raw` alias；
  `assembly-notes` 要么获得真实 readiness checks，要么从 accepted/help surface移除。
- [x] Missing、invalid和 profile mismatch在 grant/attempt/provider request之前 hard-stop。
- [x] 不相关 CLI不因该 change隐式读取 dotenv或改变行为。

### Change 2 完成判据

- [x] 无 shell export时，doctor READY 后 exact authorize/generate解析同一 matching profile。
- [x] Shell > deck > project/cwd precedence有正反测试。
- [x] Missing/invalid/mismatch保持 secret-safe hard-stop和零 provider side effect。
- [x] Style Master provider operations与 Image2使用同一受限 startup source。
- [x] Legacy audit 的 M-5 #6/#7 关闭，doctor help、accepted operation和实际 checks一致。
- [x] BUG-070 只在真实公开入口回归通过后评估关闭。

### Change 2 生命周期

- [x] `openspec new change "align-doctor-operation-readiness"` scaffold完成。
- [x] Proposal 完成。
- [x] Delta specs 完成。
- [x] Design 完成 precedence、source scope、secret boundary和negative path。
- [x] Tasks 完成。
- [x] Implementation 完成。
- [x] Doctor/Style Master/Image2 process regression通过。
- [x] `openspec validate align-doctor-operation-readiness --strict --no-interactive` 通过。
- [x] Main specs同步并 archive。

## Change 3：`project-validate-source-state`

**状态：ARCHIVED（2026-08-16）**

### 一个终态

`validate` 在保留 source/state identity stale hard-stop 的同时，机器可消费地表达 source parsing已经成功；
source-invalid仍优先返回 Change 1 建立的真正 source problem。

### 预期 capability 范围

- `cli-surface`：public validate output、exit和兼容；
- source validation / workflow inspection 的既有 owning capability，由 proposal按实际 evaluator确认；
- `node-specification` 只定义 consumer如何使用公开 observation，不复制 producer schema。

### 必须解决

- [x] Source-invalid：source problem优先，不能被 state identity mismatch覆盖。
- [x] Source-valid + state-stale：exit保持 nonzero，state owner hard-stop和 exact next保留，同时公开稳定的
  source-valid observation。
- [x] `node-specification` 不再把不存在的 `--check-gates` 写成现行 state入口；实现注释与 help统一到
  当前 `--validate-state` / owner-owned operations。
- [x] 本 change触及的 requirement统一使用 selected workflow / production identity，不继续传播 retired
  `mode` / `source-mode pair` 作为现行权威。
- [x] 不授予 raw planning、provider work、state rebind或绕过 stale identity 的权限。
- [x] 明确 human text、JSON/non-JSON compatibility和 MD consumer行为。

### Change 3 完成判据

- [x] Source-invalid、source-valid/state-current、source-valid/state-stale三类矩阵有公开进程测试。
- [x] Source-valid observation不能被解释为整条 validate成功或 provider授权。
- [x] State stale hard-stop和 owner next保持唯一。
- [x] Legacy audit 的 H-2 与本 change触及范围内的 M-3关闭；不借机做全仓术语扫荡。
- [x] 无 state/receipt/plan/provider side effect。
- [x] BUG-069 只在 public observation和 consumer回归通过后评估关闭。

### Change 3 生命周期

- [x] `openspec new change "project-validate-source-state"` scaffold完成。
- [x] Proposal 完成。
- [x] Delta specs 完成。
- [x] Design 完成 observation surface、compatibility、authority和negative path。
- [x] Tasks 完成。
- [x] Implementation 完成。
- [x] Validate/consumer process regression通过。
- [x] `openspec validate project-validate-source-state --strict --no-interactive` 通过。
- [x] Main specs同步并 archive。

## Bug 对应关系

| Bug | 本路线图位置 | 关闭条件 |
|---|---|---|
| BUG-067 | Change 1 | Style Master inspect/plan 的真实 Pure/Framed failure不再自循环，owner fact和 exact next通过进程回归 |
| BUG-068 | Change 1 | `image2 plan` 不再把已知 source defect称为 internal，且 process/no-write/fail-closed回归通过 |
| BUG-069 | Change 3 | Source-valid/state-stale observation、nonzero hard-stop和 consumer行为全部通过 |
| BUG-070 | Change 2 | Doctor与实际 runtime入口使用同一 precedence，并在真实进程边界通过 |
| BUG-071 | 不纳入 | 仍需独立定义 live writer、submitted outcome与 reconcile时间语义 |
| BUG-072 | 不纳入 | 仍需独立处理 durable cursor与 owner projection |

## 全路线图共同约束

- 所有验证使用 isolated fixtures，不把 production `deck_*` 或 `dpt_*` 当测试资产。
- 不手改任何 `_generated/`、state、receipt、journal或 lock。
- Public CLI field、exit path、stdout JSON、stderr diagnostic先由 `cli-surface` spec拥有。
- MD consumer只消费 producer公开事实和 exact next，不解析 prose、不复制 producer schema。
- Unknown/unsafe fact始终 fail closed；不得用 force、retry、waiver或历史成功结果掩盖 source defect。
- 每个新增 contract或 seam必须说明它替代/删除的旧归因逻辑；不能只增加第四层 adapter。
- 每个 change必须包含 focused negative coverage，证明前置失败短路、无错误 owner写入、无 provider call。
- Legacy audit finding只有在改变同一 fact authority、public entry、consumer control或本 change guard时才
  吸收；纯术语、schema mirror、无关 dead code和 deck清理继续由原 audit计划拥有。
- Run-bundle contract默认应为 `none` 或 compatible；若任何 change需要 migration，必须停止并单独取得决策。

## 每次更新进度时必须做什么

1. 更新文件顶部状态、当前 change和实施 change计数。
2. 更新“总进度清单”对应 checkbox。
3. 更新当前 change的 work package、生命周期与完成判据 checkbox。
4. 写明 OpenSpec change目录和最新 strict validation结果。
5. Change archive后才把下一项从 `BLOCKED/QUEUED` 改为 `NEXT`。
6. 若重排，记录新证据、决策者、原因和恢复默认顺序的条件。
