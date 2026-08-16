# CLI diagnostic faithful passthrough research

> 状态：问题分析已收敛，尚未进入设计
> 起始日期：2026-08-16
> 关联入口：`../cli-diagnostic-faithful-passthrough.md`

2026-08-16 执行 `openspec list --json` 的结果为 `changes: []`。本研究没有创建或选择 active
OpenSpec change。

## 研究目的

本目录先回答“实际问题是什么”，不把相邻计划中的 Change A/B/C、bridge、passthrough 或其他
实现措辞视为既定方案。本轮不创建 OpenSpec change，不修改 Harness 实现，也不改变现有公开
契约。

当前调查范围是：当 Pure/Framed 的 `style-master inspect`、`style-master plan` 或 `image2 plan`
在 provider-free source/configuration 解析阶段失败时，事实在哪一层产生、在哪一层丢失、公开 CLI
最终把哪个错误和哪个恢复动作交给 Controller。

## 当前结论强度

以下已经由源码、main spec 和隔离进程复现共同证实：

1. 问题不只覆盖 `PageImageVisualLanguageError`。`PageImageSourceError`、
   `PageImagePresentationError` 和经 source parser 聚合后的 `PageImageReferenceMaterialError` 也会
   出现事实丢失、owner 错位或错误恢复分类。
2. 现有 CLI 的两个 classifier 只从顶层 `error.code` 建立 `reason.kind`。只有 `issues[]` 的 typed
   error 因而降级为 fallback；有顶层 code 但未登记分类的 presentation failure 仍会降级为
   `internal/report_internal`。
3. reference-material failure 在进入 CLI 之前已经被 `parsePageImageSource()` 重定位成
   `slide-specifications.md` 的 `VISUAL BRIEF` 问题，并丢掉原 registry path、`actual` 和真正 source
   owner。这不是只改 CLI classifier 就能完整解释的问题。
4. 33 次隔离失败调用均 exit 1、stdout 为空，并且命令前后整棵 deck fixture 的目录结构和文件
   字节完全一致。前 24 次覆盖四个 owner family，后 9 次专门验证 field/owner 错位。
5. “原样透传 Error”不是一个已证安全的含义。现有 error 的 `message`、`actual`、path 和 parser/fs
   细节具有不同的公开安全性，必须先区分 owner fact、operation recovery 和 public envelope。

这些是问题描述，不是实现决策。

## 文档索引

- [`01-observed-behavior.md`](01-observed-behavior.md)：隔离复现、公开 CLI 结果和无写入证据。
- [`02-failure-inventory.md`](02-failure-inventory.md)：typed error 族、形状差异、信息丢失位置和安全性盘点。
- [`03-boundary-model.md`](03-boundary-model.md)：source owner、operation owner、CLI producer、MD consumer 的边界模型。
- [`04-open-questions.md`](04-open-questions.md)：在形成方案前必须回答的问题和证据缺口。
- [`05-test-and-history-audit.md`](05-test-and-history-audit.md)：进程级测试盲区与 git 历史审计。
- [`06-public-shape-compatibility.md`](06-public-shape-compatibility.md)：内部 typed issue 与现有 public CLI schema 的兼容性实验。
- [`07-source-scope-and-precedence.md`](07-source-scope-and-precedence.md)：共享 source、受影响页面、选择性失效与失败优先级。
- [`08-action-authority.md`](08-action-authority.md)：problem fact、domain next action 与 public CLI next 的实际所有权。
- [`09-synthesis.md`](09-synthesis.md)：已证实事实、契约张力、未知问题、原计划假设审计和设计前退出条件。
- [`10-remediation-priority-and-order.md`](10-remediation-priority-and-order.md)：按控制面伤害与因果依赖分别排序，区分紧急止损和永久修复顺序。
- [`11-legacy-trace-relevance.md`](11-legacy-trace-relevance.md)：筛选 current-layer legacy audit 中应吸收到三个 change 的 finding，并明确其余延期边界。

## 证据纪律

- 只使用 main specs、Harness 源码、tests/tests_e2e、git history 和隔离临时 fixture。
- 不使用生产 `deck_*` 或 `dpt_*` 作为可变试验场。
- 不读取其他 backlog 内容来扩展本研究范围。
- 复现 fixture 位于系统临时目录，结束后删除。
- 代码行号均指 2026-08-16 当前工作树；后续代码移动时应以路径和符号名复核。

## 暂不做的事

- 不判断相邻计划中的 Change A/B/C 是否应实施。
- 不确定新的 public schema、字段、action 或 module seam。
- 不假定所有 `issues[]` 都可以公开。
- 不把 child-process diagnostic passthrough 条款直接套到同进程异常。
- 不通过 Controller 解析 `message` 或 stderr prose 来弥补 producer 缺口。
