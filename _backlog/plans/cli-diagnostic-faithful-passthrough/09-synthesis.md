# Problem synthesis

## 结论

当前问题不能准确描述成“`PageImageVisualLanguageError` 没有被 CLI 原样透传”。更完整的描述是：

> Page Image 的 source/configuration producer、Page Source 聚合器、operation failure classifier 和
> public CLI schema 没有共享一个稳定的 problem-fact contract；部分事实先在聚合层被错误重定位，
> 剩余事实再因 code-only 分类和 shape-incompatible sanitizer 投影而丢失，最终生成错误 owner、错误
> category 或不可前进的 next action。

这是跨层契约问题，不是单一 fallback 分支或单一 Error class 的局部缺陷。现有证据足以拒绝直接实施
相邻计划中的 Change A 原文，但尚不足以选定新的 internal contract、public schema 或 action-binding
位置。

## 已证实事实

### 1. 失败家族不止一个

已确认至少四个直接相关的 producer family：

- `PageImageSourceError`：只有 `issues[]`；
- `PageImageVisualLanguageError`：只有 `issues[]`；
- `PageImageReferenceMaterialError`：只有 `issues[]`，并常在 Page Source parser 中被重写；
- `PageImagePresentationError`：有顶层 `code/details/issues`，但其 code 未被相关 CLI classifier 分类。

完整形状见 [`02-failure-inventory.md`](02-failure-inventory.md)。因此“给 Visual Language error 加一个
顶层 code”既不覆盖问题范围，也不能解决已有 code 的 presentation failure。

### 2. CLI 之前已经发生事实损失

`resolveVisualBrief()` 的一个 catch 同时包住 identity reference、visual-language selection 和 per-slide
presentation resolution。它只复制下层 issue 的 `code/message`，并把所有失败重新定位到
`slide-specifications.md / VISUAL BRIEF`。

隔离复现已证明这会产生三种不同错误：

- shared reference registry defect 被改写成 slide-local `VISUAL BRIEF` defect；
- 未登记 identity role 被定位到 `VISUAL BRIEF`，而实际选择字段是 `VISUAL IDENTITY`；
- Framed opening 的 forbidden subtitle 被定位到 `VISUAL BRIEF`，而实际修复字段是 `SUBTITLE`，并与
  `PAGE CLASS` 约束相关。

所以 CLI 即使完整公开它收到的 `PageImageSourceError.issues`，也可能忠实传递一个已经不忠实的 locator。
复现与源码链见 [`01-observed-behavior.md`](01-observed-behavior.md)。

### 3. 两个 CLI classifier 依赖顶层 code，并各自产生错误故事

`styleMasterFailure()` 对无 code error 使用 `style_master_operation_failed`。该 fallback 又命中 generic
`style_master_*` branch，得到 `artifact/inspect`；对 `style-master inspect` 本身，这是一条具有相同
失败前置条件的自循环。

`targetPageImageFailure()` 对无 code error 使用 `page_image_operation_failed`，最终得到
`internal/report_internal`。Presentation 保留了 `page_image_presentation_*` code，但没有匹配分类，仍然
进入 `internal/report_internal`。

这证明缺口同时包含 reason extraction 和 owner/action classification，不能只修其中之一。

### 4. 内部 `issues[]` 与 public `issues[]` 不是同一个 schema

真实内部 issue 原样交给 `sanitizeCliDiagnostic()` 后：Page Source 只保留 message/subject/source；Visual
Language、Presentation 和 Reference Material 基本只剩 message。内部 `code/path/actual` 不会自动映射到
public `reason/source/subject`。

因此当前代码里不存在 mechanical raw passthrough。任何 bridge 都必须作 owner、locator、aggregation
和安全语义决定；详见 [`06-public-shape-compatibility.md`](06-public-shape-compatibility.md)。

### 5. problem fact 与 exact next 是两个独立缺口

四类 source/config error 均没有统一 machine action。Page Source 的 `repair_hint` 是 prose，不是 public
`next`；Presentation 的 exact source 只在部分 `details` 中；Reference owner 甚至未始终绑定 physical
registry path。

现有 CLI 的多数 next 来自 hard-coded code/prefix mapping。只有 delegated child 已经发出完整 public
diagnostic 时，才存在真正的 exact-next passthrough。详见
[`08-action-authority.md`](08-action-authority.md)。

### 6. source scope 不能由 reason code 推导

同一个 `content_overriding_visual_clause` 可来自 shared Visual Language registry，也可来自 selected
identity reference registry。一个 malformed shared reference registry 在五页 fixture 中被复制成 30 个
slide-local issues；映射到 public bounds 后只保留 20 个并省略 10 个。

这说明诊断至少可能需要区分 root source、logical field/path、affected subjects 和 operation next。
reason code 本身不唯一标识 owner 或 blast radius。详见
[`07-source-scope-and-precedence.md`](07-source-scope-and-precedence.md)。

### 7. 当前失败保持了进程和写入纪律，但没有保持语义

33 次隔离进程调用均 exit 1、stdout 精确为空、stderr 最后一行是一个合法 bounded failure envelope，且
fixture 的目录结构和文件字节不变。这排除了“主要问题是多信封、stdout 污染或失败后写入”的解释。

通用 CLI sanitizer、transaction 和 delegated diagnostic tests 也已经较强。缺失的是
`resolver/parser -> adapter -> ppt_flow classifier -> stderr envelope` 的真实组合契约测试，见
[`05-test-and-history-audit.md`](05-test-and-history-audit.md)。

## 已确认的契约冲突或张力

### 明确的端到端结果冲突

- `content-parsing` 要求 invalid visual ingress 返回 field-level repair；当前公开结果可能是 artifact
  inspect 或 internal report，且 resolver-origin error 可能被定位到错误字段。
- `visual-config` 要求 selected invalid visual source 和 invalid presentation package 返回 bounded
  source/configuration repair；当前公开结果可能是 artifact inspect 或 internal report。
- `visual-asset-management` 要求 invalid identity semantics 返回 owning bounded failure，并要求 invalid
  registry bytes naming registry path；当前 reference failure 可被重写为 `slide-specifications.md /
  VISUAL BRIEF`。
- `cli-surface` 要求 Style Master/Progressive diagnostics 表达 earliest independent failure 和 nearest
  legal owner action；当前 fallback 会制造 inspect self-loop 或把已知 source defect改称 internal defect。

### 尚需解释的规范张力

- Visual Config 同时要求 deterministic selected-record invalidation，并说 unselected registry record
  不应使页面失效；当前 parser 在 selection 前验证整个 registry，未选择的坏 record 也会阻断。需要先
  澄清该句只约束 semantic digest，还是也约束 invalid-record isolation。
- main specs 使用“owner returns repair action”的端到端语言，但低层 source/config errors 没有共同
  machine action。需要明确 action 应在 source owner、adapter/operation owner还是 CLI 组合。
- Style Master/Image2 要求 earliest/smallest independent failure，而 Page Source parser 会聚合多个
  issues。需要定义 root selection、bounded issue preservation 和 precedence 的关系。

这些张力不能通过现有实现行为自行裁决。

## 对原计划假设的审计

### 已得到支持

- Controller 不应从 prose、文件存在性或 raw stderr 重建 recovery。
- unknown、invalid 或 unsafe fact 应继续 fail closed，不能借“保真”公开任意 Error 内容。
- source problem fact、operation recovery 和 public envelope 属于不同权威。
- Pure 与 Framed 都需要公开边界证据。
- BUG-069/070/071/072 与本问题不是同一个机制，不应被并入一次实现。

### 已被证伪或明显不足

- **“共同根因只是一类 Visual Language typed error 被 CLI 重写”**：不足。Page Source、Presentation、
  Reference Material 也受影响，并且部分信息在 CLI 前已经丢失。
- **“workflow owner 已经同时掌握明确事实和 exact next”**：不足。source/config producer 多数只有
  problem facts，没有 machine next；部分 owner locator 也不完整。
- **“structured bridge 可以保留既有 path/token/source fact”**：未成立。token 只存在于 message prose；
  logical `path` 与 physical source locator 不是同一语义；Reference physical path 并非始终在 issue 上。
- **“内部 issues 可以忠实传入现有 public issues”**：已证伪。两个 shape 不兼容，raw object 传递会把
  大部分结构化事实丢成 prose。
- **“顶层 code 足以让 CLI 不再维护第二个归因器”**：已证伪。Presentation 有 code 仍被误分类；相同
  code 也可能属于不同 source owner。
- **“Change A 可直接覆盖未来 typed source failure”**：范围过宽。不同 producer 的 safety、locator、
  aggregation 和 action authority 尚未形成共同 contract。

### 仍是候选目标，而不是设计

“CLI 不应维护第二个业务归因器”仍是合理目标，但不能被解释为删除所有 CLI mapping。Public envelope
shape、redaction、operation 名称和 public action vocabulary 本来就属于 direct CLI；真正需要消除的是
CLI 对缺失或已损坏 domain facts 的猜测。哪些 mapping 是合法 public projection，必须等 ownership
contract 明确后才能判断。

## 尚未回答的问题

进入设计前仍有五组关键未知：

1. **Problem-fact contract**：每个 producer 的最小稳定 facts 是什么；多 issue 如何选择 root reason。
2. **Locator model**：physical file、logical YAML path、Page Source field、producer owner 和 affected slides
   是否需要独立表达。
3. **Public safety**：message、actual/expected、forbidden token、parser/fs error 和 absolute path 的允许与
   丢弃规则是什么。
4. **Action authority**：source fact 与 Style Master/Image2 operation next 在哪一层组合；同一 fact 在不同
   command 下哪些字段必须相同、哪些可以不同。
5. **Precedence and scope**：whole-source validation、selected-record isolation、shared-source fan-out 和
   earliest independent failure 如何共同决定一个 bounded envelope。

更细的问题清单见 [`04-open-questions.md`](04-open-questions.md)。

修复的控制面紧迫度与永久实施依赖不是同一个排序；两轴分析见
[`10-remediation-priority-and-order.md`](10-remediation-priority-and-order.md)。

## 进入设计前的退出条件

只有下列结果都有明确、可测试的答案，才适合开始 OpenSpec proposal/design：

1. 为四个 producer family 和 resolver-origin rewrite 建立完整 owner/information-loss matrix。
2. 决定 stable internal problem facts，并明确哪些字段可投影到 public surface、哪些必须省略。
3. 区分 physical locator、logical path、source field 和 affected subject，或者明确证明现有 public shape
   可无歧义表达它们。
4. 明确 aggregation、root-cause selection、issue bounds 和 multi-source precedence。
5. 明确 source/config problem fact 与 operation-specific next 的组合权威。
6. 决定 public schema 是保持兼容映射还是需要 additive versioned shape，并确认 consumer 不复制 schema。
7. 固定 Pure/Framed、Style Master/Image2 的最小真实进程矩阵，断言 category/reason/locator/issues/next、
   单信封、空 stdout、完整 owner-root 无写入、无 provider call 和 unsafe fact fail-closed。
8. 明确需要修改的 main capabilities。当前证据至少涉及 `cli-surface`、`content-parsing`、
   `visual-config` 和 `visual-asset-management`；只有 consumer consumption contract 变化时才涉及
   `node-specification`。

当前 `openspec list --json` 为 `changes: []`。在上述退出条件满足前，不应创建一个以原 Change A 文案
为既定设计的 active change。
