# Design: Page Image owner-issued diagnostics

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| Problem-fact contract 归属 | 新 capability `diagnostic-facts` + 共享模块 `scripts/shared/diagnostic/problem_fact.mjs` | JS 内部契约 |
| 事实 origin 保留 | `resolveVisualBrief()` 按 error family 分流，保留 owner/physical source/logical path/actual/expected | JS（content-parsing 聚合层） |
| Field 定位表 | Page Source-owned 选择失败按确定性 family/code 表定位 `VISUAL IDENTITY` / `SUBTITLE`(+`PAGE CLASS`) / `VISUAL BRIEF` | JS（聚合层声明表） |
| Shared root fan-out | 同一 root 事实只产出一条 root，affected slides 以 subject 附件表达（bounded） | JS（聚合层） |
| Unselected VL record | 结构性无效 = registry-level；clause 语义 = selection-scoped（裁决） | JS（visual-config） |
| Precedence | 固定序：registry 结构 → package 结构 → Page Source fields → per-slide identity → VL → presentation | JS |
| Reference locator | `problem()` 增加 `source`（physical）；`path` 只保留 logical 语义；三处 loader 绑定 | JS（visual-asset-management） |
| Operation next | source/config family → `source_validation` + `edit_source`（non-human），next 永不为同前置条件 `inspect` | JS（operation/CLI） |
| CLI 归因 | 以 `error.problemFacts` marker 识别 family，不再 code/prefix 表推导；迁移 family 的 code 表删除 | JS（CLI） |
| Public 投影 | 物理 source → `source.path`；field → `subject.field`；code → `reason.kind`；safe actual/expected → `reason`；logical path 仅进 bounded message（展示，非机器权威） | JS（CLI，兼容投影） |
| 兼容/cutover | public envelope shape 不变、无 additive field、无新命令/flag；一次原子 cutover，无双写双读 | MD⇔JS protocol |
| `diagnosticFromError` | 保留为 delivery-notes 限定 seam + focused tests + guard 限定 import 域 | JS |
| Guard | 新增 3 类定向检测：第二归因器、退役 VL 路径回流、旧 consumer 合同回流；planted violation 证明 | JS（harness-script-layout） |
| 控制分类 | source/config 硬失败 = exit 1 hard failure；可确定性修复 = `guide`（Agent 经 owner 修复后重跑同一命令）；unknown/unsafe = `hard-stop` fail-closed | MD⇔JS protocol |

## 1. Problem-fact contract（diagnostic-facts）

### 形状与权威

四个 producer family 共用一个最小内部事实 shape，模块：

`ppt_maker_harness/scripts/shared/diagnostic/problem_fact.mjs`

```js
{
  reason: "<registered code>",
  owner: "page-source" | "visual-language" | "presentation" | "reference-material",
  source: { path, line?, column? } | null,   // physical 文件 locator，仅当 producer 确知
  path: "<logical registry/record path>" | null,  // 与 source 不同语义
  subject: { slideId?, field? } | null,
  actual: <safe scalar> | undefined,
  expected: <safe scalar> | undefined,
  message: "<bounded 展示文本>"   // 展示用，不构成机器权威
}
```

- `problem_fact.mjs` 只定义 shape、`attachProblemFacts(error, facts)`（`Object.defineProperty(error, "problemFacts", ...)` 冻结数组）与 `problemFactsFromError(error)`。它**不**构造 public envelope、不解析 `Error.message`、不推断缺失字段；`owner` 未知时留 `null` 并标记 unknown。
- 与 `cli_error.mjs` 的 `attachCliDiagnostic()` 严格分离：那是 delivery-notes 限定的 public diagnostic 附着（§6），本模块是内部事实契约，不允许 source resolver 构造 public schema。
- 权威：`diagnostic-facts` delta spec 是契约的规范；producer capability specs 只引用它（"按 `diagnostic-facts` 契约"），不复制字段表。
- 各 producer 在抛点通过 `attachProblemFacts` 附着事实（§2）。聚合层（`resolveVisualBrief` 重构后）在吸收时保留并补充 aggregation 层已知的 subject/field，不覆盖 producer owner。

### 为什么不是 public schema 下沉

`cli-surface` 已声明 public envelope 的字段与发射规则；把 public shape 放进 resolver 会让低层模块同时拥有 transport 语义，且 public 字段（`next.inspect` 等）对 producer 无意义。内部契约只交付"事实"，操作与投影在各自 owner。

## 2. Producer 与聚合改造（WP A/B）

### 2.1 四个 producer 的附着点

| Producer | 文件 | 附着点 |
|---|---|---|
| Page Source | `01-content/internal/page_image_source.mjs` | `issue()` 工厂已含 code/source/subject/actual/expected；错误抛出时（:849）汇总为 problem facts；owner=page-source |
| Visual Language | `02-visual-system/internal/page_image_visual_language.mjs` | `issue()`（:62-71）产出时附着；loader（:401-411 `registry_unavailable` 已知 physical `source`）附着 physical locator；owner=visual-language |
| Reference Material | `02-visual-system/internal/page_image_reference_material.mjs` | `problem()`（:46-54）增加可选 `source`；三处已绑定 physical path 的加载/校验点（:236/:239/:252）把 physical 路径放进 `source`，logical 路径保留在 `path`；`resolvePageImageIdentityReference`（:260-300）运行时失败附着 profile registry physical locator（loader 已知时）；owner=reference-material |
| Presentation | `02-visual-system/internal/page_image_presentation.mjs` | `PageImagePresentationError`（:45-53）构造时把 `details.source`（physical）与 `code` 并入 problem facts；owner=presentation |

字段语义统一：`source` = physical 文件 locator；`path` = logical YAML/registry path；两者不再混放。当前 VL loader 把 physical 放 `source`（:408）、Reference loader 三处放 `path`（:236/:239/:252）——以本契约为准统一为 `source`。

### 2.2 `resolveVisualBrief()` 重构（content-parsing）

现状（:670-701）：一个 catch 把 `registry.resolveSelection(context)` 的任何异常无条件改写为 `VISUAL BRIEF`，只复制 code/message。

重构后：

1. `catch` 后按 error 归属分流（确定性，不解析 message）：
   - `PageImageReferenceMaterialError`（identity 解析）→ 保留 owner=reference-material、`path`/`actual`/`expected`；
   - `PageImageVisualLanguageError`（selection）→ owner=visual-language（registry clause 语义类）或 page-source（未登记 ID 类，见字段定位表）；
   - `PageImagePresentationError`（per-slide projection）→ 保留 `code`/`details`；owner 按字段定位表裁决（`header_field_forbidden` → page-source，其余 per-slide projection 失败 → presentation）；
   - 其余 → 走问题事实契约的 unknown 路径，不猜测。
2. **Page Source-owned 字段定位表**（确定性、按 family+code，不解析 prose）：

   | 错误来源（family/code 范围） | subject.field | 修复 owner |
   |---|---|---|
   | identity：`unregistered_identity_profile/role` | `VISUAL IDENTITY` | Page Source |
   | identity：`identity_subject_count_incompatible` | `IDENTITY SUBJECT COUNT` | Page Source |
   | identity：`identity_restriction_incompatible` | `SUBJECT RESTRICTIONS` | Page Source |
   | identity：`reference_path_escape`、`reference_sha_mismatch` | 无 Page Source field（registry 内容缺陷） | Reference Material（reference 文件 locator） |
   | presentation：`page_image_presentation_header_field_forbidden` | 具体 header field（如 `SUBTITLE`），关联 `PAGE CLASS` | Page Source |
   | presentation：其余 per-slide projection 失败（profile missing/workflow invalid 等） | 无 Page Source field | Presentation（exact package source） |
   | VL selection：`unregistered_visual_recipe/composition/motif/relationship` 等未登记 ID | `VISUAL BRIEF` | Page Source |
   | VL registry clause 语义（如 `content_overriding_visual_clause`） | 无 Page Source field | Visual Language registry |
   | Reference clause 语义（同码可来自 reference） | 无 Page Source field | Reference Material registry |

   该表是聚合层的 locator 声明，不是 CLI 第二归因器（§4 说明边界）。
3. **Shared root 不 fan-out**：同一 (owner, reason, source, path) 在多个 slide 上重复出现时，聚合为一条 root 事实 + affected slide 列表。公开投影时 root 事实落在 envelope 顶层（`source`/`reason`/`next`），每个受影响 slide 以共享同一 root 事实的 subject 附件形式出现在 bounded `issues[]` 中（上限 20，`omitted_count` 记录），slide order/截断不改变 root。

### 2.3 unselected VL record 裁决（visual-config）

- `parsePageImageVisualLanguage` 保留**结构性** whole-source 校验：YAML 可解析、声明 contract、record shape/schema、clause 语法。任何 record 结构无效 → registry-level defect（命名该 record 的 logical path；physical source 由 loader 提供）。
- **语义**校验（content-authority、forbidden token，即 `content_overriding_visual_clause` 一类）从 whole-registry parse 移到 **selection 时对所选 record 求值**：`resolvePageImageVisualLanguageSelection` 只规范/校验被选择的 records。未选择 record 的语义违规不阻断页面（对应 visual-config delta 的裁决段）。
- 实现注意：当前 clause normalization（page_image_visual_language.mjs:135-170,173-193）在 parse 阶段跑全 registry；需拆分"语法规范化（结构）"与"内容权威检查（语义）"两步，语义步只对选中 record 执行。`registry_semantic_digest` 无需调整——源码（:491-499）证实它已只含所选 recipe/composition/motif/relationship 的 clause hashes（selection-scoped）；变化的只是 parse 期的 whole-registry 语义**拒绝**改为 selection 期。既有单测 `test_page_image_visual_language_relationships.mjs:115-131` 断言 `parsePageImageVisualLanguage` 直接拒绝 `no-readable-text`/`headline` clause，需拆分为"parse 接受结构合法 registry + selection 拒绝选中违规 record + 未选中违规 record 不阻断"（T2.1 完成判据）。
- 设计假设（T2.1 用 full sweep 证实）：仓库当前没有其他消费者依赖 whole-registry 语义拒绝（env-check/doctor/guard 均未发现该依赖）；若 sweep 发现依赖，停在该任务记录证据并回到本设计，不静默扩大范围。

### 2.4 Precedence

固定顺序（与当前调用顺序一致，现将其明确为规范）：selected VL registry 结构 → presentation package 结构 → Page Source field 解析（source 顺序）→ per-slide identity → per-slide VL selection → per-slide presentation projection。诊断取 earliest independent failure 作为 root；其余独立失败可作为 bounded secondary issues。该序写入 visual-config delta（已在 delta 中）。

## 3. Operation recovery 绑定（WP C）

### 3.1 公共分类与 next

四个 family 的 source/config 失败在 Style Master/Image2 命令层统一投影为：

- `category: "source_validation"`、`next.action: "edit_source"`、`next.requires_human: false`（与 Page Design System 既有先例一致，cli-surface R22/R23 已确立该词汇）。
- `source` 与 `next.inspect` 只在 owner 给出一个 exact safe physical locator 时投影（本契约下 producer 已知时必给）；无 locator 的 unknown fact 省略该字段，不默认 `slide-specifications.md`。
- next 的 `default` 文案：`repair <owner> <locator> then rerun <同一命令>`。对 `style-master inspect` 失败，next 不是 inspect 而是 edit_source + 重跑 inspect——消除同前置条件自循环；对 `image2 plan` 同理。

### 3.2 谁绑定 next

- producer 交付 problem fact（owner/reason/locator/field），**不**拥有 invocation；
- operation owner（Style Master / Image2 命令层）消费 fact，绑定"当前 checkpoint 的一个 nearest legal action"——同一 fact 在 `style-master inspect/plan` 与 `image2 plan` 下共享 owner/reason/locator，但 next 的 default 文案与 rerun 目标按命令不同；
- CLI 只做 transport 投影（§4）。三层职责与 `08-action-authority.md` 的边界模型一致。

### 3.3 已迁移 family 不再走 lifecycle classifier

`styleMasterFailure()` / `targetPageImageFailure()` 对携带 `problemFacts` marker 的 error 直接进入 source/config 投影分支（§4.1），不再匹配 `style_master_*` / `page_image_*` code 前缀或 fallback（`style_master_operation_failed` / `page_image_operation_failed` / `internal/report_internal`）。因此已知 source defect 永不被称为 internal；unknown/unsafe fact 才 fail closed 为 bounded internal（§7）。

## 4. Public CLI 投影（WP D）

### 4.1 投影规则（cli_error.mjs 或新投影 helper，归 cli-surface）

输入：`error.problemFacts`（内部契约）+ 既有 envelope 基础设施。规则：

| 内部事实 | public 投影 | 省略规则 |
|---|---|---|
| physical source locator | `diagnostic.source` / issue `source` `{path,line,column}` | 无 exact locator 时省略；path 超 2048/含 CRLF/secretish 时省略 |
| subject (slide/field) | issue `subject {kind:"slide", id, field}`；root 的 affected slides 为 subject 附件 | 未知时省略 |
| reason code | `reason.kind`（顶层 root）+ issue `reason.kind` | 未登记 code 走 unknown |
| safe actual/expected | `reason.actual`/`reason.expected`（标量，≤16 项） | 完整 clause、role clause、SHA、profile object、OS error 文本、parser/fs prose 永不投影 |
| logical path | 仅并入 bounded `message`（展示文本） | 不作为机器字段 |
| message | bounded 展示文本（≤1024 chars） | secretish 过滤、超长截断 |

- **raw `issues[]` 不直接进 sanitizer**：每个内部 issue 先按上表转换为注册 public issue shape（message/subject/source/reason/lineage），再交给 `sanitizeCliDiagnostic()`；转换发生在 projection helper 内，有 focused 测试。
- 顶层 `code`/`message`/`hint` 继续作为兼容 summary 输出（envelope 必填），不承担 recovery authority。
- 单信封、exit 1、stdout 为空由 `cli_bootstrap.mjs` 既有机制保证，无改动。

### 4.2 兼容性

- public envelope schema 不变：无新增字段、无新命令、无新 flag、无 category/action 新值（`source_validation`/`edit_source` 均已注册）。
- MD consumer 合同变化（node-specification 两处 MODIFIED）是本 change 的一部分：M-4 旧 `code`+`hint` 分支删除、H-1 退役路径删除。playbook/`charter/NODE-SPEC.md` 中的旧消费表述同步更新（test_diagnostic_recovery_handoff.mjs 校验）。
- cutover 原子性：四个 family + consumer 合同 + guards 在同一 change 内完成；不保留双写/双读/新旧两套 recovery authority。切失败时保持 secret-safe fail-closed。

## 5. CLI 归因边界（WP D/E）

- **删除**：`ppt_flow.mjs` 中对已迁移 family 的 code/prefix 推导路径——具体为 fallback 分支的触发条件（携带 problemFacts 的 error 不再落入 `style_master_operation_failed` / `page_image_operation_failed` / `internal` fallback），以及为这四类 family 新增的任何 code 集合。`FRAMED_SOURCE_VALIDATION_CODES`、`PAGE_DESIGN_SYSTEM_*`、`FRAMED_ENVIRONMENT_CODES`、`FRAMED_INTERNAL_CODES` 等**非**这四个 family 的既有集合保留（它们属于既有已分类路径）。
- **保留**：CLI 对 public transport/schema/version、category/action 词汇、redaction、bounds、lineage、invocation confinement、exit/stdout/stderr 的 ownership（这是合法 public projection，不是第二归因器）。
- marker 识别：`problemFactsFromError(error)` 非空 → 走 source/config 投影分支。该识别是契约驱动，与 error class 名、code 前缀无关。

## 6. `attachCliDiagnostic` / `diagnosticFromError` seam（WP E）

- 现状事实（源码审计）：`attachCliDiagnostic` 仅被 `05-delivery/internal/notes_runtime.mjs`（:230/:247/:261）使用；`diagnosticFromError` 无调用者；仓库无任何 `error.cliDiagnostic` 读取者。
- 决策：**保留这对 helper 为 delivery-notes 限定的受支持 seam**（与路线图"保留 attachCliDiagnostic 已有 delivery-notes jurisdiction"一致）：jurisdiction 写入 `cli_error.mjs` 文档注释与 delta spec；补 focused tests（attachment/retrieval round-trip + 非法值）；新增 architecture guard 规则：`attachCliDiagnostic`/`diagnosticFromError` 的 import/使用只允许出现在 `05-delivery/` 及其 shared/cli 定义处，source resolver、aggregator、`ppt_flow.mjs` 分类器禁止使用（planted violation 证明）。
- 备选（不选）：整体 retire 两者并清理 notes_runtime——会越过 Change 1 的 capability 边界（notes-injection/pptx-assembly 属 Change 2 范围），且 plan 明确保留该 jurisdiction。

## 7. Fail-closed 与 negative path（WP D）

- unknown/unsafe/oversized fact：不猜 source、不 retry、不 force。未知 owner/reason → bounded `internal`/`report_internal`（fail closed），但**已知** source defect 永不落入 internal（§3.3）。
- secret-like / absolute escape path / parser prose / complete clause：投影时省略或替换为 bounded 摘要（SECRETISH_RE + 字段级白名单），envelope 仍有效。
- 超限：issues >20、text >1024、diagnostic >16KB 时按 `cli_error.mjs` 既有熔断顺序退化，root 不变，`omitted_count`/`truncated` 保留。
- 无写入：失败路径不产生 receipt/plan/state/journal/generated mutation；无 provider call。进程级回归以 fixture tree 字节快照证明（复用 `test_process_target_diagnostics.mjs` 的 immutable snapshot 模式，扩展到完整 fixture tree）。

## 8. MD consumer 修正（node-specification，WP D 吸收 H-1/M-4）

- H-1：`ctx parameter provides run bundle paths to conditions` 场景中的退役路径 `page-authority-visual-language.yaml` 改为经 run-bundle owner 解析的当前 canonical 源（`page-image-visual-language.yaml`），不重建路径字符串 mirror；guard 防回流。
- M-4：`CLI ⇔ MD failure protocol uses JSON envelopes` 的 `code`+`hint` 分支合同改为统一消费 `diagnostic.category/reason/next`（与既有四部分 handoff 要求一致）；顶层 summary 不承担 recovery。
- 不在 `node-specification` 复制 public diagnostic schema（引用 `cli-surface`）。
- 本 change 不处理 H-2（`--check-gates`，Change 3 范围）。

## 9. Architecture guard 与测试层级（WP E）

### 9.1 Guard 新增

在 `harness_architecture.mjs` 增加一个定向 evaluator（如 `evaluateDiagnosticOwnerGuardConformance`）+ fs 枚举扩展：

1. **第二归因器检测**：扫描 `ppt_flow.mjs` 分类器区域，禁止对已迁移 family 的 code 集合/前缀重新推导 owner/category/next（检测模式：携带 problemFacts 的 error 路径出现 code-prefix 分支、或新增包含四 family issue code 的常量集合）。planted violation：一个伪造的 code 表分支。
2. **退役 VL 路径回流检测**：按内容扫描 implementation（`ppt_maker_harness/scripts/`）与 current guidance（`charter/NODE-SPEC.md`、`playbook/`、`BOOTSTRAP.md`）中的 `page-authority-visual-language.yaml` 字面量；**`openspec/specs` 的规范禁止句豁免**（delta/main spec 中"不得引用退役路径"的规范文本不构成回流，guard 不扫 specs 中的禁止句）；planted violation + 修复后通过 + 改名/换文件不能逃逸（按内容扫描而非路径）。
3. **旧 consumer 合同回流检测**：扫描 current-layer specs/guidance 中"branch on top-level `code` + `hint` for recovery"的表述；planted violation 证明。

guard 测试沿用 `tests/contracts/test_harness_architecture.mjs` 的 `issueCodes(...).toContain(...)` 模式。

### 9.2 测试层级

- **Unit**：problem-fact 模块、字段定位表、VL 结构/语义拆分、Reference locator、聚合 dedupe、投影转换表。
- **Process**（受支持层级）：新增 `tests/shared/cli/test_process_source_config_diagnostics.mjs`（或扩展 `test_process_target_diagnostics.mjs`），覆盖 Pure/Framed × `style-master inspect/plan` × `image2 plan` × 四 family 的完整矩阵；断言 exit 1、空 stdout、单信封、category/reason/source/subject/next、无写入（完整 tree snapshot）、无 provider、secret/oversized/escape 负向安全。复用 `parseFailure()`/`expectOwnerAction()` 风格 helper。
- **层级登记**：`run_selected_verification.mjs` 增加受支持 `process` tier（`vitest.process.config.mjs`），`COMMANDS.md`/help 的验证层级描述明确 core ≠ process ≠ sweep；`development-verification-core.json` 不把 process 套件纳入 core（避免 core 通过被误读为完整回归）。return-category audit 的 probe 更新为真实可执行 test case 引用（`probe.test` 指向实际 case，而非仅文件存在）。
- **Guard**：§9.1 的 planted violation 测试。

## 10. Policy 合规

- **human-centered-gates.md**：已知 source/config defect = 可确定性修复 → `guide`（Agent 经 owner 修复后重跑同一命令；Task Mandate 覆盖，无重复人类确认）；unknown/unsafe fact = `hard-stop`（fail-closed，protected invariant：source fact identity/integrity、无错误 owner 写入、无 provider call、无 receipt/plan/state mutation；恢复路径唯一：报告 + 安全修复/上报）；本 change 不引入 `confirm`/waiver/force。
- **agent-assistance-and-control.md**：direct control path 单一——producer 产生 fact → operation owner 绑定 next → CLI transport 投影 → MD 只消费 `diagnostic.category/reason/next`。删除/合并的重复控制：`resolveVisualBrief` 统一改写 catch、`ppt_flow` 对四 family 的 code/prefix 推导、`node-specification` 的 `code`+`hint` 消费者分支。新增 marker 不是第二控制器（它是事实的 transport，不产生 pass/fail 判定）。
- **simple-reliable-control.md**：最短闭环（direct fact → 一个确定性检查 → earliest root cause → 一个 nearest legal action → 重跑同一 checkpoint）已逐条落实：每个独立根因一个 next；新增 contract/seam 均说明替代的旧归因逻辑（§5/§8）；`diagnosticFromError` 备选（retire）评估后因 scope 边界不选，但 jurisdiction+tests+guard 构成净简化。无法证明净简化的部分（如为 fan-out 新增 public 字段）已主动缩 scope（用既有 `issues[]` + subject 附件表达）。

## 11. 验证策略

- unit：契约模块、定位表、VL 拆分、Reference locator、聚合、投影（`tests/`，`npm run test:sweep` 覆盖无 `test_process_` 前缀的 unit）。
- integration：聚合/投影/分类器组合（无进程）。
- process：§9.2 矩阵（`tests/shared/cli/`，受支持 tier）。
- e2e：mock journey 增加一个含 invalid visual source 的失败 fixture 断言（`tests_e2e/shared/workflow/`，仅在现有 mock 结构内扩展，不新增 provider）。
- guard：planted violation 正反用例。
- 回归：`npm test`（core：admission + architecture）、`npm run test:sweep`（unit/integration）、target/process tier、mock e2e。
- 全部使用隔离 fixture（`initBundle` tmpdir），不触碰 production `deck_*`/`dpt_*`。
