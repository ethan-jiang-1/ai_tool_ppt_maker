# Open questions

## 必须先回答的契约问题

1. source/config producer 的最小稳定 fact 是什么？是单一 reason、多个 issues、source locator、logical
   field path，还是其中受约束的组合？
2. 谁拥有 source/config failure 的 `next`？main specs 使用“owner returns source repair action”的语言，
   但当前低层 error 并没有 public action。这个 action 应由 source owner、adapter operation owner还是
   CLI 绑定，尚未由统一代码契约证明。
3. 一个 operation 同时发现多个 source/config issue 时，public envelope 应保留全部 bounded issues，
   还是选择 earliest/smallest independent root cause？Style Master/Image2 的 earliest-failure 要求如何与
   parser 的多 issue aggregation 共存？
4. logical YAML path 和 physical source locator 是否需要不同字段？当前 public `source.path` 是文件路径，
   把 `recipes.foo.provider_clause` 塞进同一 path 会混淆语义。
5. `repair_hint` 是 producer authority、方便测试的 prose，还是内部提示？reference failure 被聚合后现有
   hint 已经指错 owner，不能无条件透传。

## 必须先回答的安全问题

1. 哪些 `actual` 类型允许公开？visual clause、role clause、SHA、profile object、OS error code 和 YAML
   parser message 目前共用同名字段。
2. 如何公开“违规 token”而不解析 message、也不公开完整 clause？当前 Visual Language/Reference
   producer 没有结构化 `token` field。
3. exact source path 何时是 safe locator？Page Design System 已有 confined selected-source 规则，但
   visual-language 使用 repo-relative source，presentation 使用 absolute selected source，reference
   issue 可能使用 absolute file path或 logical registry path。
4. issue message 是否属于 public fact？sanitizer 只过滤 secret-like patterns和长度，不能判断普通 author
   prose 是否应该离开 source/config boundary。
5. 多 issue / oversized error 应如何 fail closed，且保留“有已知 source defect”而不是退化成 unrelated
   internal story？

## 必须先回答的 ownership 问题

1. `parsePageImageSource()` 是否应该吸收 identity reference resolver error？如果要吸收，怎样保留真正
   source owner；如果不吸收，怎样仍满足 field-level Page Source selection diagnostics？
2. 同一个 resolver error 何时应归到 `VISUAL IDENTITY`、`IDENTITY SUBJECT COUNT`、
   `SUBJECT RESTRICTIONS`、`PAGE CLASS`、header field 或 `VISUAL BRIEF`？当前统一 catch 没有足够的
   structured origin 来作可靠映射。
3. presentation package 是 Visual Config source，还是 adapter source prerequisite，抑或二者的组合？
   两个 workflow 都会完整加载四文件 package，unselected sibling malformed 也会阻断。公开 recovery
   应如何准确命名影响范围？
4. Style Master scope resolution在 lifecycle owner 运行前先解析 canonical Page Source/config。该阶段失败
   是否应被看作 Style Master operation failure，还是 precondition owner failure？
5. `image2 plan` 与 `style-master inspect/plan` 遇到同一 source fact 时，哪些 public facts必须一致，哪些
   operation/where/next 可以合法不同？
6. 已存在的 `attachCliDiagnostic()` / `diagnosticFromError()` 是未完成架构、局部工具，还是只服务其他
   error family？在没有仓库调用者和 spec 说明前，不能把它当成既定 seam。

## 需要扩展的 failure inventory

- visual-language source unavailable、invalid YAML、schema mismatch、cross-reference mismatch。
- Page Source 的非 visual field errors，确认它们是否全部走相同 fallback。
- presentation malformed YAML、schema invalid、cross-file binding、Framed geometry、forbidden header field。
- reference registry unavailable、unregistered role、missing bytes、SHA mismatch、incompatible restriction。
- 同一 source/config error 在 `style-master authorize/generate/review/accept` 或 image2 preflight 中是否可达，
  以及是否会覆盖更早 lifecycle failure。
- error 数量超过 20、文本超过 1024、diagnostic 接近 16 KiB 时的公开退化行为。

## 需要扩展的验证

- 进程级 Pure/Framed 回归应覆盖 source issue、visual registry、presentation、reference 四个 owner family。
- 断言不仅看 `reason.kind`，还应检查 category、source/subject、issues、exact next、stdout、唯一 final
  envelope、无 plan/state/receipt/provider side effect。
- 需要负向安全 fixture：secret-like message、超长 prose、parser path、absolute escape path、SHA/object
  actual，证明不因“保真”泄露内部值。
- 需要测试 consumer 不解析 prose，并确保 producer envelope错误时不会被 MD 层偷偷修正。

## 在形成方案前的退出条件

只有满足以下条件，研究才足以进入设计：

1. error producer 全表和每类 owner 已明确；
2. public-safe fact 子集及其丢弃规则已明确；
3. source problem fact 与 operation next 的组合权威已明确；
4. Pure/Framed/Style Master/Image2 的一致与差异已明确；
5. main spec 应修改的 capability 已明确，且没有把 schema 复制进 consumer；
6. regression matrix 能证明正确归因、无写入、无 provider call和 fail-closed安全边界。

在这些问题回答之前，相邻计划中的 Change A 和 “structured bridge” 都只应被视为候选假设。
