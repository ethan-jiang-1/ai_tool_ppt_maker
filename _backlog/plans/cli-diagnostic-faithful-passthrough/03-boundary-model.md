# Boundary model

## 四个不同权威

```text
source/config producer
  owns: problem kind, exact source/field/path facts, actual/expected when safe by contract
        |
        v
operation owner
  owns: current checkpoint, affected lifecycle scope, nearest legal action
        |
        v
direct CLI producer
  owns: public envelope schema, bounds, redaction, exit/stdout/stderr discipline
        |
        v
MD Controller / runtime Agent
  owns: four-part human handoff; must consume exact producer next
```

这四层不能互相替代：

- source producer 不天然拥有 Style Master 或 progressive raw lifecycle recovery；
- operation owner 不应重写 source path、field 或 typed reason；
- CLI 不应从 prose/prefix 猜出前两层没有提供的语义；
- Controller 不得从 raw stderr 或文件存在性重建 recovery。

## Spec 对边界的约束

### CLI routing

`cli-surface` 明确要求 shared routing 消费 state/workflow owner result，而不是从参数、rendered output
或 metadata 重建 mode/gate/authorization/recovery/completion；见
`openspec/specs/cli-surface/spec.md:34-44`。

它对 child-process passthrough 的规定更严格：只有 child 已发出 valid supported diagnostic 时才保留
其 category/operation/subject/reason/issues/exact next；不可信 child output 必须 fail closed，不能复制
prose 或猜 category，见同 spec `:46-75`。

这个 child 条款不能自动证明任意同进程 `Error` 已经是 public diagnostic。当前四个 error family 的
形状不同，也没有共同声明 `category` 或 `next`。

### Style Master 和 progressive image2

Style Master hard failure 应报告 earliest independent failure 和 nearest legal owner action，consumer
不得从 prose/file presence 推导第二条恢复路由；见 `cli-surface/spec.md:95-112`。同 spec 对
`style-master inspect/plan` 明确禁止 opaque internal error 和 self-referential inspect loop，见
`:132-140`。

Progressive image2 也要求 smallest independent root cause 和 one nearest legal owner action，Controller
只消费该 action，见同 spec `:142-150`。

### Source/configuration owners

- invalid visual-language source：Visual Config 返回 existing bounded source repair action，
  `visual-config/spec.md:50-63`。
- invalid presentation package/schema/cross-file binding：返回 bounded source/configuration repair，
  同 spec `:65-106`。
- invalid visual ingress：Content Parsing 返回 field-level visual repair action，
  `content-parsing/spec.md:179-204`。
- invalid identity semantics：Visual Asset Management 返回 owning bounded failure，
  `visual-asset-management/spec.md:53-83,110-117`。

这些要求说明当前公开的 artifact/inspect 或 internal/report_internal 不是简单的文案差异，而是把
source repair authority 改成了另一个 owner。

### MD consumer

`node-specification` 要求 MD consumer 保留 producer 的 bounded category、causal facts 和 exact next，
并禁止复制/扩展 CLI schema或发明 retry/fallback/shell invocation/authorization/classification，见
`openspec/specs/node-specification/spec.md:875-911`。

生成的 `deck-guide.md` 也只允许消费 final valid envelope，见
`ppt_maker_harness/workflow/00-setup/template-deck-guide.md:49-66`。Agent Contract 进一步规定 valid
failure envelope 优先于新的 inspection；invalid envelope 才能进入下一条 read-only discovery branch，
见 `ppt_maker_harness/charter/AGENT_CONTRACT.md:154-201`。

因此当前错误 envelope 会成为 Controller 的控制权威。consumer 不能合法地“看懂 message 后自行修正”。

## 当前实现中的边界错位

| 位置 | 当前行为 | 边界问题 |
|---|---|---|
| Visual Language error construction | code/path/actual 在 issue 内，顶层无 code | CLI classifier 看不到 reason；token 只在 prose |
| Source parser aggregation | identity、visual language、per-slide presentation issue 都被重定位到 Page Source `VISUAL BRIEF` | reference/config owner 可能丢失；`VISUAL IDENTITY`、`SUBTITLE` 等真实 field 也可能被改错 |
| Style Master classifier | 无顶层 code => `style_master_operation_failed` => artifact/inspect | 将 source failure 当 lifecycle record failure；inspect 可自循环 |
| Image2 classifier | 无顶层 code => `page_image_operation_failed` => internal/report | 将可修 source failure当 Harness defect |
| Presentation classification | code 保留但未登记 | 证明“加顶层 code”本身不足以得到正确 category/next |
| CLI sanitizer | 能承载 bounded issues，但只做结构/安全清洗 | sanitizer 不拥有 source semantics，也不能修正 owner |
| MD consumer | 必须服从 final envelope | 无法在 consumer 层补救错误分类 |

## “faithful”至少有三种可能含义

目前不应把名称中的 faithful passthrough 直接当设计：

1. **Error-object passthrough**：把任意 `Error` 字段直接公开。现有证据表明不安全，也没有共同 shape。
2. **Problem-fact preservation**：跨层保留 producer 已声明的 bounded fact，但不自动保留 prose 或未授权字段。
3. **Recovery preservation**：operation owner 已经给出 exact next 时，CLI 不重建另一条 next。

第 2 和第 3 是两个不同契约问题。当前 source/config errors 常有 problem fact、没有 operation next；
当前 progressive/style lifecycle errors 则可能已有 operation action。后续设计必须先说明讨论的是哪一种
faithfulness。

还需要区分第四种含义：**locator fidelity**。即使 reason code 被保留，source owner、physical file、
logical YAML path和 Page Source field 仍可能在聚合时被替换。新增复现证明 code fidelity 不等于
locator fidelity。

## 与已有工作先例的比较

Page Design System failure 已在 `targetPageImageFailure()` 中显式保留 resolver code，将 exact safe
source path 映射成 `source`/`next.inspect`，并使用 `source_validation/edit_source`；没有 exact locator 的
provider-input overflow 则明确省略 source。实现见
`ppt_maker_harness/scripts/ppt_flow.mjs:1557-1569,1762-1795`；规范见
`openspec/specs/cli-surface/spec.md:702-759`。

这个先例证明 repo 已经区分：

- exact owner reason 与 generic fallback；
- exact safe locator 与“恰好存在的某个 source”；
- source/configuration failure 与 compiler contradiction；
- 无写入 provider-free failure 与 provider/runtime failure。

它不能自动决定其他 error family 应采用同一实现方式，但可以作为评估一致性的基准。
