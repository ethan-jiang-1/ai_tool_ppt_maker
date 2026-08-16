# 公开 CLI 进程级测试与 Git 历史审计

> 审计基线：`f4255f789074300c221e6e70dc24670047bac9a9`（2026-08-16）
> 范围：公开 `ppt_flow.mjs` 进程边界、相关模块/适配器测试、测试选择机制，以及可达于当前 `HEAD` 的 Git 历史。
> 本文只描述已观察到的覆盖和历史，不接受原计划中的 Change A/B/C，也不提出实现方案。

## 摘要

1. 仓库对 `pptmaker-cli-diagnostic` 的通用信封、字段清洗、单信封输出、child diagnostic
   passthrough、截断和 secret-safe fail-closed 已有较强测试；这些测试主要验证 CLI 基础设施，
   并未让真实 `PageImageVisualLanguageError`、`PageImageSourceError`、
   `PageImagePresentationError` 或 `PageImageReferenceMaterialError` 穿过公开命令边界。
2. `style-master` 和 `image2` 已有真实子进程测试，但当前覆盖集中在 lifecycle stale、usage、
   Framed text fit、runtime、provider、grant/mandate、reconcile、Page Design System 和 canonical-input
   overflow。视觉 registry、Page Source visual ingress、presentation package、reference material
   的代表性失败没有公开进程级回执断言。
3. 上述四类失败并非“完全没有测试”：registry/source/reference 有 resolver 或 parser 单测，
   presentation 还有 adapter 级无写入测试。缺失的是跨越
   `resolver/parser -> workflow adapter -> ppt_flow classifier -> stderr envelope` 的组合契约。
4. 历史显示这不是近期单点回归。issue-only 的视觉错误形状在 Page Authority/Image2 首次接入时
   已存在；`targetPageAuthorityFailure()` 与 `styleMasterFailure()` 后来按顶层 `error.code` 分类，
   两者在 2026-08-01 已同时存在。2026-08-08 的 Page Image 重命名与 integrated-page 内容保护
   保留了这一形状组合。
5. 当前测试“登记”并不等于逐命令行为已被执行。return-category audit 为每个命令生成一个
   probe 名称，但只验证 probe 文件存在；默认 `npm test` 也不运行这些视觉/CLI 进程测试。

## 口径

本文把“公开 CLI 进程级覆盖”限定为同时满足下列条件的测试：

- 通过 `node ppt_maker_harness/scripts/ppt_flow.mjs ...` 启动独立进程；
- 断言公开 exit status、stdout、stderr 最终 diagnostic envelope；
- 对相关失败断言 category/reason/next，而不只断言内部异常类型或 message；
- 在该失败声称无写入时，验证相应公开副作用边界。

例如，target diagnostic suite 的 `runFlow()` 确实启动 `ppt_flow.mjs` 子进程，
[`parseFailure()`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L338) 断言 exit 1、
空 stdout、恰好一个最终信封和信封字节上限。相反，直接调用
`parsePageImageVisualLanguage()`、`buildPureTargetRawPlan()` 或
`resolvePageImageIdentityReference()` 的测试属于模块或 adapter 覆盖，不计为公开 CLI 进程级覆盖。

## 已有公开进程覆盖

| 测试面 | 已覆盖的公开行为 | 与本问题的边界 |
|---|---|---|
| CLI 信封基础设施 | closed code/category/action set、严格 schema、字段清洗和总量上限、secret sentinel 移除，见 [`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L50) | 使用构造的 diagnostic 或 synthetic executable；不经过四类真实视觉错误 |
| child passthrough | 保留合法 child 的 category/subject/source/reason/issues/next；无效、缺失、截断 child fail closed，见 [`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L303) | 这是 subprocess producer envelope 的测试；四类视觉错误发生在 `ppt_flow` 同进程调用栈内 |
| direct process transaction | 失败前 stdout/stderr 被丢弃、只留一个最终信封；provider credential/prompt/body/stack 不泄漏，见 [`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L455) | 证明通用输出隔离，不证明真实视觉 issue 的字段投影或 owner 归属 |
| CLI surface | Style Master 和 Image2 成功路径、usage、undeclared protocol hard-stop，见 [`test_cli_surface.mjs`](../../../tests/contracts/test_cli_surface.mjs#L78) 和 [`test_cli_surface.mjs`](../../../tests/contracts/test_cli_surface.mjs#L181) | fixture 的 Visual Language、Page Source 和 presentation 都是合法输入 |
| Style Master process | stale source successor、current-plan mismatch、usage、unknown submission、provider/environment 和 selection 投影，见 [`test_process_style_master_cli.mjs`](../../../tests/contracts/test_process_style_master_cli.mjs#L90) | 唯一 registry 修改是合法的 `quiet depth -> quiet luminous depth`，用于产生 stale selection，不触发 registry parse failure |
| target Image2 diagnostics | Page Design System UTF-8、canonical-input overflow、Framed text fit、runtime、task mandate、provider、async、reconcile、invalid media 等，见 [`test_process_target_diagnostics.mjs`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L371) | 包含多种真实 owner failure，但没有四类视觉 source/config producer error |
| mock journey | Pure/Framed 成功生命周期、provider profile source pending、prompt budget、runtime profile mismatch，见 [`test_mock_target_workflow_journey.mjs`](../../../tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs#L437) | 证明相邻 source/capability failure 可穿过公开 CLI；没有 invalid visual registry/source/presentation/reference fixture |

### 已有测试真正保证了什么

target suite 对它实际覆盖的失败有统一公开断言：

- [`parseFailure()`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L338) 要求 status 1、空
  stdout、单一最终信封和大小限制；
- [`expectOwnerAction()`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L349) 要求精确
  category/reason/action，且拒绝 `force`、waiver 和 retry 暗示；
- Page Design System case 同时覆盖 Pure 和 Framed，并断言 exact selected source path，见
  [`test_process_target_diagnostics.mjs`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L371)；
- generic CLI tests 验证合法 child `issues` 和 exact `next` 可保留，见
  [`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L327)。

因此当前缺口不是“测试框架无法表达这类断言”，而是这些真实 producer failure 没有进入上述公开
进程矩阵。

## 四类失败的覆盖矩阵

| 失败家族 | 当前内部事实形状 | 已有非进程覆盖 | 缺少的公开进程路径 |
|---|---|---|---|
| Visual Language registry | `PageImageVisualLanguageError.issues[]`；类本身没有顶层 `code`，见 [`page_image_visual_language.mjs`](../../../ppt_maker_harness/scripts/02-visual-system/internal/page_image_visual_language.mjs#L34) | 单测拒绝 retired authority、`no-readable-text` 和 `headline` provider clause，见 [`test_page_image_visual_language_relationships.mjs`](../../../tests/02-visual-system/test_page_image_visual_language_relationships.mjs#L115) | Pure/Framed 的 `style-master inspect`、`style-master plan`、`image2 plan` 没有 invalid registry 的 exit/stdout/envelope/no-write 断言 |
| Page Source / `VISUAL BRIEF` | `PageImageSourceError.issues[]`；类本身没有顶层 `code`，见 [`page_image_source.mjs`](../../../ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs#L81) | parser 单测覆盖 invalid IDs、字段、Provider Content、visual ingress 和 text-free clause，见 [`test_page_image_source.mjs`](../../../tests/01-content/test_page_image_source.mjs#L202) 和 [`test_page_image_source.mjs`](../../../tests/01-content/test_page_image_source.mjs#L270) | 没有把真实 `PageImageSourceError` 送入 Style Master/Image2 公开 classifier 并断言 field-level repair envelope |
| presentation package | `PageImagePresentationError` 有顶层 `code/details/issues`，见 [`page_image_presentation.mjs`](../../../ppt_maker_harness/scripts/02-visual-system/internal/page_image_presentation.mjs#L45) | package 单测覆盖 missing/malformed/cross-file invalid；Pure adapter 还断言 missing/malformed source 在 receipt/plan/state 写入前停止，见 [`test_pure_deck_visual_system.mjs`](../../../tests/02-visual-system/test_pure_deck_visual_system.mjs#L94) 和 [`test_pure_page_image_core.mjs`](../../../tests/04-pure-image/test_pure_page_image_core.mjs#L125)；Framed adapter 有 malformed profile 无 publication 测试，见 [`test_framed_workflow.mjs`](../../../tests/03-framed-image/test_framed_workflow.mjs#L771) | 没有公开 `style-master inspect/plan` 或 `image2 plan` 的 presentation error envelope 断言；也没有验证 diagnostic 是否指向实际 presentation source |
| identity reference material | `PageImageReferenceMaterialError.issues[]`；类本身没有顶层 `code`，见 [`page_image_reference_material.mjs`](../../../ppt_maker_harness/scripts/02-visual-system/internal/page_image_reference_material.mjs#L27) | direct resolver 单测覆盖 registry unavailable、role missing、path、SHA、role clause 和 compatibility，见 [`test_page_image_reference_material.mjs`](../../../tests/02-visual-system/test_page_image_reference_material.mjs#L101) | 没有 invalid reference fixture 经过 source resolver、adapter 和公开 CLI；没有公开断言真实 reference owner path/issue 是否保留 |

仓库级搜索也支持这一边界判断：四个 Error 类名及其代表性 issue code 在 `tests/`、`tests_e2e/`
中的命中均落在上述 unit/adapter 文件，未落在 `test_process_*`、`test_cli_surface.mjs` 或 mock
target journey 的失败断言中。

### 这些缺口对应现有规范边界

这四类 producer failure 已经落在公开规范描述的 owner-repair 语义内：

- Visual Config 要求 registry clause 不能成为内容权威，并要求 invalid visual source 返回 bounded
  source repair action，见 [`visual-config/spec.md`](../../../openspec/specs/visual-config/spec.md#L50)；
- presentation package 的 missing、malformed、cross-file inconsistent source 必须在 raw planning 前停止，
  并返回 source/configuration repair，见
  [`visual-config/spec.md`](../../../openspec/specs/visual-config/spec.md#L65)；
- invalid `VISUAL BRIEF` 必须返回 field-level visual repair，并且不能创建 receipt、adapter route 或
  provider input，见 [`content-parsing/spec.md`](../../../openspec/specs/content-parsing/spec.md#L179)；
- Style Master hard failure 必须使用 producer-owned envelope 和 nearest legal owner action，见
  [`cli-surface/spec.md`](../../../openspec/specs/cli-surface/spec.md#L95)。

因此缺少公开进程测试会留下一个具体不可观察区：模块测试能证明 producer 拒绝了输入，但不能证明
CLI 最终仍表达了同一个 owner-repair 语义。

### Reference error 还有一个未被组合测试覆盖的转换

reference resolver 产生的 `issues[]` 会进入 Page Source 的 registry callback；
[`resolveVisualBrief()`](../../../ppt_maker_harness/scripts/01-content/internal/page_image_source.mjs#L670)
逐条取 `detail.code/message`，重新构造指向 Page Source `VISUAL BRIEF` block 的
`PageImageSourceError` issue。现有 reference 单测直接调用 resolver，现有 Page Source 单测使用合成
registry；没有测试把真实 reference material error 经过这次转换后再送入公开 CLI。因此当前测试
不能回答原 reference source owner、Page Source field owner、或两者的公开表达应是什么。

## 当前断言层面的具体空白

### 1. 没有真实视觉 issue passthrough 断言

generic sanitizer 能接收 `issues`，但没有真实 Visual Language/Page Source/Reference error 的进程测试
断言：

- `diagnostic.issues` 是否存在；
- issue code 是否仍为 producer code；
- issue subject/source/path 是否仍指向拥有事实的输入；
- forbidden token 是否以受限结构化事实出现，而不是依赖 exception prose；
- Pure 与 Framed 是否得到同一 producer fact、但各自 operation 合法的公开 recovery。

### 2. 已覆盖 source failure 不等于已覆盖无写入

target suite 定义的 [`immutableSnapshot()`](../../../tests/shared/cli/test_process_target_diagnostics.mjs#L304)
只包含 State、若干 derived path、raw root 文件名和 progressive history。Page Design System 与
canonical-input overflow case 断言了 envelope，但该 case 本身没有调用 `expectUnchanged()`；它也
不覆盖 registry、presentation 和 reference source bytes。Style Master suite 有全树 base64 snapshot
helper，见 [`test_process_style_master_cli.mjs`](../../../tests/contracts/test_process_style_master_cli.mjs#L42)，
但它只用于 stale-plan/usage 等已列 case，没有 invalid visual source case。

所以对本问题涉及的失败家族，目前没有“命令前后完整 fixture tree 字节相同”的公开进程证据。

### 3. success/stale registry drift 与 invalid registry 是不同路径

当前 Style Master process test 在
[`test_process_style_master_cli.mjs`](../../../tests/contracts/test_process_style_master_cli.mjs#L109)
把合法 clause 从 `quiet depth` 改为 `quiet luminous depth`。该测试验证 selection stale 后
`image2 plan` 返回 `target_style_master_stale`，随后 `style-master inspect/plan` 能建立 successor。
它不会触发 `PageImageVisualLanguageError`，因此不能覆盖 invalid registry 的 classifier 行为。

## 覆盖登记和实际执行之间的差异

### Return-category audit 只验证文件存在

[`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L243) 为每个 direct
executable 和每个 `ppt_flow` command 构造 help/usage/contextual/delegated 等 probe。对命令的
contextual probe，它生成诸如 `ppt_flow <command> contextual behavior` 的测试名，并统一指向
`tests/contracts/test_cli_surface.mjs`。但是最终校验只检查：

- record 具有预期 category key；
- 每项有 `probe` 或 `notApplicable`；
- `probe.file` 是存在的文件。

见 [`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L262) 和
[`test_process_cli_error.mjs`](../../../tests/shared/cli/test_process_cli_error.mjs#L277)。它没有验证
`probe.test` 确实对应一个 test case，也没有执行该 command/failure。实际
`test_cli_surface.mjs` 只有三个顶层 case，起始于
[`line 41`](../../../tests/contracts/test_cli_surface.mjs#L41)、
[`line 78`](../../../tests/contracts/test_cli_surface.mjs#L78) 和
[`line 181`](../../../tests/contracts/test_cli_surface.mjs#L181)。

因此这份 audit 是覆盖元数据完整性检查，不是逐命令、逐 error family 的行为覆盖证明。

### 默认和选择性测试命令不会自动覆盖全部进程测试

- [`package.json`](../../../package.json#L8) 的 `npm test` 运行 core verifier；当前 core inventory
  只有 development-verification admission 和 harness architecture 两个 entry，见
  [`development-verification-core.json`](../../../tests/contracts/development-verification-core.json#L1)。
- `npm run test:sweep` 使用默认 Vitest config；该 config 明确排除所有名为
  `test_process_*.mjs` 的文件，见 [`vitest.config.mjs`](../../../vitest.config.mjs#L8)。
- `npm run test:focused -- <path>` 一次只接收一个 test path；若静态 closure 命中 visual engine，
  dispatcher 会拒绝，见 [`run_selected_verification.mjs`](../../../tests/contracts/run_selected_verification.mjs#L47)。
  对 `tests/shared/cli/test_process_target_diagnostics.mjs` 的实测结果是 exit 2：
  `focused verification rejects visual-engine closures; long local render tests are not retained`。

这不表示这些测试无法直接由 Vitest 运行；它表示当前 package-level 默认/core/focused 路由不会自动
把 target diagnostic process suite 纳入一次常规验证结论。

## Git 历史

下列提交均为当前 `HEAD` 的祖先。

| 日期 / commit | 相关变化 | 对本问题的含义 |
|---|---|---|
| 2026-07-28 `ae14fa1` | 首次引入 Page Authority Image2 pipeline。`PageAuthorityVisualLanguageError` 和 reference/source 同类错误使用 `issues[]`、无顶层 `code`；当时 `commandPageAuthorityImage2()` catch 已从 `error.code` 生成 reason | issue-only producer 与 code-only CLI 分类的形状差异从初始 pipeline 即存在；当时未知原因被归到通用 provider/repair-prerequisite，而不是保留 issue fact |
| 2026-08-01 `91a2bd7` | 引入结构化 `targetPageAuthorityFailure()`、`styleMasterFailure()` 和 Style Master process tests。两个 classifier 都读取 `error?.code`；target unknown 进入 `internal/report_internal`，Style Master fallback 进入 `style_master_* -> artifact/inspect` | 当前两种不同错误回执的基本分叉在此时已形成；不是 8 月 15/16 的局部改动 |
| 2026-08-05 `b304dd6` | 扩展 relationship registry、selection 和 source binding；相关实现同时触及 visual-language producer、Pure/Framed composition 和 target runtime，但没有修改 `ppt_flow` classifier；测试新增 relationship module coverage | registry/source 语义面扩大，但没有同步增加公开 Style Master/Image2 process failure case |
| 2026-08-08 `15dc9fe` | Page Authority 重命名为 Page Image，加入 integrated-page provider clause 内容保护，包括 `headline` 等 forbidden token；`PageImageVisualLanguageError` 仍只有 `issues[]`，CLI 仍按顶层 `error.code` 分类 | 直接触发本次现场问题的内容保护与既有 classifier 形状组合在此提交落地 |
| 2026-08-08 `15dc9fe`（测试侧） | process target fixture 将旧的 `no-readable-text` / `no-labels` 合法输入改为 `no-logo`；unit test 新增 text-free / `headline` rejection | process suite 被迁移到新的合法 success fixture，但没有新增一个 invalid clause 的公开失败断言 |
| 2026-08-09 `57cd6b8` | 新增合法 visual registry/source drift 的 Style Master successor process test | 覆盖了 stale lifecycle recovery，但 mutation 保持 registry 合法，未触发 typed registry error |
| 2026-08-11 `6aad0d0` | 引入 `PageImagePresentationError` 和 presentation package 单测；该提交在 target failure routing 的相关 diff 中只调整既有 Framed source-validation 文案，没有增加 `page_image_presentation_*` 分类 | presentation failure 有 producer/adapter coverage，但没有新增 presentation 公开 process classifier case |
| 2026-08-15 `a8ecfab` | Page Design System source 增加显式 CLI 分类，并在 target process suite 中增加 Pure/Framed source UTF-8 和 canonical-input overflow case | 证明同一时期相邻 source type 是以“producer code + classifier + process assertion”一起落地的；视觉 registry/presentation/reference 没有同等边界覆盖 |
| 2026-08-15 `9004e98` | 新增 135 行 Page Image reference material direct resolver test | reference failure 的模块覆盖变强，但该提交在相关路径中没有修改 `ppt_flow` 或 process test |

### 关键历史片段

可用下列一手命令复核上表：

```bash
git show ae14fa1:PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/page_authority_visual_language.mjs
git show ae14fa1:PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs
git show 91a2bd7:PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs
git show 91a2bd7:tests/contracts/test_process_style_master_cli.mjs
git show --stat b304dd6
git show 15dc9fe:ppt_maker_harness/scripts/02-visual-system/internal/page_image_visual_language.mjs
git show 15dc9fe:ppt_maker_harness/scripts/ppt_flow.mjs
git show 15dc9fe:tests/shared/cli/test_process_target_diagnostics.mjs
git show --stat 57cd6b8
git show --stat 6aad0d0
git show --stat a8ecfab
git show --stat 9004e98
```

## 历史解释的边界

现有证据支持以下判断：

- 这是长期存在的跨层组合缺口，而不是某个最近 commit 单独把一个正确公开 diagnostic 改坏；
- producer 单测、adapter 无写入测试、CLI sanitizer 测试和部分 process classifier 测试分别存在，
  但没有测试把这四层组合起来；
- child diagnostic passthrough 的测试不能直接证明同进程 typed error 的忠实传递，因为前者起点已经是
  完整、受支持的 CLI envelope，而后者起点只是内部 Error/issue fact；
- 当前测试证据不足以决定哪些内部字段可公开、source owner 如何表达、或 operation owner 应绑定哪一个
  exact next。这些属于边界/公开形状研究，不应从测试缺口本身反推实现。

## 后续仍需回答的测试问题

这些是研究问题，不是实施任务：

1. 公开契约要求的最小矩阵是否必须同时覆盖 Pure/Framed、Style Master inspect/plan、Image2 plan，
   还是由共享 producer fact 加少量 operation-specific case 即可证明？
2. 对 source-owned failure，“无写入”应比较哪些 owner roots：仅 State/derived/raw，还是完整 fixture tree？
3. process test 需要断言哪些字段保持相同，哪些字段必须由 operation owner 重新绑定，哪些字段必须因
   secret/path/prose 风险而省略？
4. return-category coverage 元数据的“probe”究竟是文档索引，还是预期成为可执行、可验证的具体测试引用？
5. target diagnostic process suite 应归入哪一个受支持验证层级，才能让其通过/未运行状态不会被 core
   或 sweep 结果误解？

## 审计命令

本次使用的主要只读查询：

```bash
rg -n 'PageImageVisualLanguageError|PageImageSourceError|PageImagePresentationError|PageImageReferenceMaterialError' tests tests_e2e
rg -n 'spawnSync|spawn\(' tests tests_e2e
rg -n '^\s*(it|test)\(' tests/shared/cli tests/contracts tests_e2e/shared/workflow
git log --follow -- <relevant-file>
git log -S'<symbol-or-code>' -- <relevant-paths>
git blame -L <start>,<end> <file>
git show <commit>:<path>
node tests/contracts/run_selected_verification.mjs focused tests/shared/cli/test_process_target_diagnostics.mjs
```
