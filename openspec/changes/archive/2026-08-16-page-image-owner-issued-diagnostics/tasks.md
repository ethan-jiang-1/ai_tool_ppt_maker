# Tasks: page-image-owner-issued-diagnostics

> 排序依据：specs/source authority → producer/aggregation → operation → CLI → guards/tests。
> 每个任务标注 capability 与完成判据。全部实现使用隔离 fixture，不触碰 production `deck_*`/`dpt_*`，不手改 `_generated/`。

## T1 契约与权威（diagnostic-facts）

- [x] **T1.1** 新建共享模块 `ppt_maker_harness/scripts/shared/diagnostic/problem_fact.mjs`（capability: diagnostic-facts）：shape（reason/owner/source/path/subject/actual/expected/message）、`attachProblemFacts`（冻结数组附着）、`problemFactsFromError`、unknown 标记；模块不构造 public envelope、不解析 `Error.message`。
  - 完成判据：unit tests 证明 attach/read round-trip、冻结、未知 owner 保持 null；模块无 cli_error/ppt_flow import。
- [x] **T1.2** 注册 `diagnostic-facts` 到 `openspec/config.yaml` capability registry（owner_paths 指向该模块）。
  - 完成判据：`openspec doctor` 通过；registry 条目与 main spec 路径一致。

## T2 Producer 附着（WP A）

- [x] **T2.1** `page_image_visual_language.mjs`：`issue()` 产出时按契约附着 problem facts；loader `registry_unavailable`（:408）把 physical 路径放进 `source`；`content_overriding_visual_clause` 等语义检查按 §2.3 从 whole-registry parse 移到 selection 时对所选 record 求值（结构/语义拆分）；未选择 record 的语义违规不阻断页面。
  - 完成判据：unit tests——结构无效 record = registry-level；未选择语义违规 record 不阻断；选择违规 record = selection-isolated；`registry_semantic_digest` 保持 selection-scoped 不变；**更新既有 `test_page_image_visual_language_relationships.mjs:115-131` 的 whole-registry 语义拒绝断言为拆分后行为（parse 接受结构合法 registry；selection 拒绝选中违规 record；未选中不阻断）**。
- [x] **T2.2** `page_image_reference_material.mjs`：`problem()` 增加可选 `source` 字段；三处已绑定 physical path 的加载/校验点（:236/:239/:252）改用 `source`；`resolvePageImageIdentityReference` 运行时失败在 loader 已知时附着 profile registry physical locator。
  - 完成判据：unit tests——registry/role/clause/SHA 失败均携带 physical source + logical path；`path` 不再承载 physical 语义。
- [x] **T2.3** `page_image_presentation.mjs`：`PageImagePresentationError` 构造时把 `code`/`details.source` 并入 problem facts（owner=presentation）；package-load 失败保留 exact physical source。
  - 完成判据：unit tests——缺失 workflow 文件、header-field-forbidden 的 fact 形状正确。
- [x] **T2.4** `page_image_source.mjs` `issue()`/`frontmatterIssue()` 产出时附着 problem facts（owner=page-source）。
  - 完成判据：unit tests——field-level issue 的 fact 形状正确。

## T3 聚合与 origin 保留（WP A/B）

- [x] **T3.1** 重构 `resolveVisualBrief()`（:670-701）：按 error family 分流（identity/VL/presentation），保留 owner/path/actual/expected；应用字段定位表（`VISUAL IDENTITY` / header field + `PAGE CLASS` / `VISUAL BRIEF` / registry owner）；未知错误走 unknown 路径不猜测。
  - 完成判据：unit tests 覆盖——未登记 identity role → `VISUAL IDENTITY`；Framed forbidden subtitle → `SUBTITLE`(+`PAGE CLASS`)；未登记 recipe → `VISUAL BRIEF`；registry clause 语义 → VL owner + logical path；reference clause 语义 → reference owner + registry locator；任何 case 不从 `Error.message` 取 token/owner。
- [x] **T3.2** Shared root 不 fan-out：同一 (owner, reason, source, path) 跨 slide 去重为一条 root + affected slides 附件；去重在 `parsePageImageSource` 的最终收集层（:849 抛错前）完成，`resolveVisualBrief` 保持逐 slide 事实保留；root 不随 slide order/截断改变。
  - 完成判据：unit tests——五页共享 registry fixture 产生稳定 root；truncation 后 root owner/reason/next 不变。
- [x] **T3.3** `createPageImageSourceResolver` 组合点（03-framed:785-805 / 04-pure:605-625）验证：identity → VL → presentation 顺序短路不变；precedence（registry 结构 → package 结构 → Page Source fields → per-slide）确定。
  - 完成判据：integration tests——多失败 fixture 的 root 选择符合固定序。

## T4 Operation recovery（WP C）

- [x] **T4.1** `styleMasterFailure()`：携带 problemFacts 的 error 直接走 `source_validation`/`edit_source` 投影（exact owner fact + 命令相关 rerun 文案）；不再落入 `style_master_*` fallback/自循环 inspect；已知 source defect 永不 internal。
  - 完成判据：unit tests——inspect 失败的 next 不是同前置条件 inspect；plan 失败同理。
- [x] **T4.2** `targetPageImageFailure()`：同 T4.1（image2 plan 等）；`internal/report_internal` 只留给 unknown/unsafe fact。
  - 完成判据：unit tests——已知 source defect 的 category=source_validation；未知 fact fail closed。
- [x] **T4.3** 删除 `ppt_flow.mjs` 中已迁移四 family 的 code/prefix 推导路径（fallback 触发条件），保留非四 family 既有集合（FRAMED_*、PAGE_DESIGN_SYSTEM_*、capability/budget 等）。
  - 完成判据：grep 审计——四 family issue code 不再出现在分类常量/前缀集合；`npm run test:sweep` 既有分类器测试通过。

## T5 Public 投影（WP D）

- [x] **T5.1** 投影 helper（cli_error.mjs 或共享模块内，归 cli-surface）：problem facts → 注册 public issue shape（message/subject/source/reason/lineage）；物理 source → `source.path`；field → `subject.field`；code → `reason.kind`；safe actual/expected → `reason`；logical path 仅进 bounded message；raw `issues[]` 不直接进 sanitizer。
  - 完成判据：unit tests——四个 family 的代表性 issue 投影正确；secret-like/absolute escape/complete clause/parser prose 被省略或 bounded；超限熔断后 root 不变。
- [x] **T5.2** envelope 行为回归：exit 1、stdout 空、stderr 最后一行单 JSON envelope、字节上限。
  - 完成判据：复用 `parseFailure()` 断言——全部通过。
- [x] **T5.3** `attachCliDiagnostic`/`diagnosticFromError` 保留为 delivery-notes 限定 seam：jurisdiction 文档注释 + focused tests（round-trip、非法值 fail-closed）。
  - 完成判据：unit tests 通过；`cli_error.mjs` 注释声明 jurisdiction。

## T6 Consumer 修正（node-specification，H-1/M-4）

- [x] **T6.1** MODIFIED `ctx parameter provides run bundle paths to conditions`：场景中的退役 `page-authority-visual-language.yaml` 改为 run-bundle owner 解析的当前 canonical 源；不重建路径字符串 mirror。
  - 完成判据：spec 同步后 grep 无退役路径；`npm test` 通过。
- [x] **T6.2** MODIFIED `CLI ⇔ MD failure protocol uses JSON envelopes`：删除 `code`+`hint` 分支合同，统一 `diagnostic.category/reason/next`（顶层 summary 仅兼容）；同步 `charter/NODE-SPEC.md`/playbook 中旧消费表述（触及范围内）。
  - 完成判据：`tests/contracts/test_diagnostic_recovery_handoff.mjs` 通过；文本审计无 `code`+`hint` 恢复分支表述。

## T7 测试矩阵（WP D/E）

- [x] **T7.1** 新增进程套件 `tests/shared/cli/test_process_source_config_diagnostics.mjs`：Pure/Framed × `style-master inspect/plan` × `image2 plan` × 四 family 矩阵；断言 exit 1、空 stdout、单信封、category=source_validation、reason/source/subject/next（exact）、无写入（完整 fixture tree 字节快照）、无 provider call。
  - 完成判据：矩阵全部通过；无写入断言用完整 tree snapshot。
- [x] **T7.2** 负向安全 fixtures：secret-like message、absolute escape path、parser/fs prose、complete visual clause、oversized multi-issue（>20 issues / >16KB）——均 bounded 退化或 fail-closed，不泄露、root 不变。
  - 完成判据：所有负向 case 通过；sentinel 不泄漏断言（复用现有 sentinel 模式）。
- [x] **T7.3** mock e2e 增加一个 invalid visual source 失败 fixture（`tests_e2e/shared/workflow/` 现有结构内）断言公开 envelope。
  - 完成判据：`npm run test:mock-e2e` 通过。

## T8 Guards 与层级（WP E）

- [x] **T8.1** `harness_architecture.mjs` 新增定向 evaluator：第二归因器检测（已迁移 family 的 code 表/前缀分支）、退役 `page-authority-visual-language.yaml` 回流（按内容扫描 ACTIVE_SURFACE_ROOTS，改名/换文件不可逃逸）、旧 consumer `code`+`hint` 恢复合同回流；`attachCliDiagnostic`/`diagnosticFromError` import 域限定 05-delivery。
  - 完成判据：planted violation 正反用例全部通过（violation 被拒、修复后通过、改名逃逸被拒）。
- [x] **T8.2** process 套件层级登记：`run_selected_verification.mjs` 支持 `process` tier（`vitest.process.config.mjs`）；`COMMANDS.md`/help 验证层级描述明确 core ≠ process ≠ sweep；`development-verification-core.json` 不含 process 套件。
  - 完成判据：`node tests/contracts/run_selected_verification.mjs process` 运行新套件；core 通过不被误读为 process 覆盖。
- [x] **T8.3** return-category audit probe 指向真实可执行 test case（`probe.test` 解析到实际 case），不再仅验证文件存在。
  - 完成判据：audit 测试通过；每个新命令/失败 family 有真实 case 引用。

## T9 收尾验证

- [x] **T9.1** 全量回归：`npm test`、`npm run test:sweep`、process tier、`npm run test:mock-e2e`。
- [ ] **T9.2** `openspec validate page-image-owner-issued-diagnostics --strict --no-interactive` 通过；`openspec doctor` 通过。
- [ ] **T9.3** main specs 同步（archive 流程）：8 个 modified + 1 个 new capability；`openspec/config.yaml` registry 更新；`openspec archive` 前确认无未决项。
- [ ] **T9.4** 对照路线图 Change 1 完成判据逐项核对（owner/locator、无自循环、无写入、负向安全、guard 证据、BUG-067/068 评估条件）。
  - 完成判据：判据清单全部勾选；BUG-067/068 仅在对应回归通过后评估关闭（评估记录写入路线图文件，不直接改 bug 状态）。
