## Context

`tests/05-delivery/test_delivery.mjs`（18 用例，603 行）是 delivery 的唯一单测文件；`05-delivery/internal/` 五个模块（notes_runtime 329、delivery_media 250、pptx_assembly 242、notes 199、ordinal_footer 29）经 index 集成测试覆盖。矩阵核对采用"Scenario 文本关键词 → 用例名/断言行"双查（quality/footer/blank 等词全文件 grep + 用例名比对），不是目测。动机与 4 个缺口结论见 proposal.md。

## Goals / Non-Goals

**Goals:**

- 每条 delivery Requirement 的每个 Scenario 都有命名用例锚点，映射随 change 归档可追溯。
- 4 个缺口用最小测试补上，全部走现有文件与既有夹具模式（`mkdtempSync` 合成 deck）。

**Non-Goals:**

- 不为 06-iteration 增加测试（依据记录在 tasks 的矩阵结论里）；
- 不把矩阵变成长期 repo 文档；不重排/重构现有 18 个用例；不动生产代码。

## Decisions

### D1：矩阵落在 change 的 tasks.md，不落 repo

矩阵是"本次补洞的论证 + 归档后可追溯的锚点表"，属于 change verification 资产。长期 repo 文档会变成第二份需要与测试同步的复述（违背 one-fact-one-home）。备选"新增 DELIVERY_COVERAGE.md"被否。

### D2：补洞写在 test_delivery.mjs 内，不拆新文件

现有文件 603 行、18 用例均为毫秒级，无性能或可读性压力；新文件会触发 `source-test-ownership.json` 簿记与新的 owner 声明，收益为零。备选"按 internal 模块拆 5 个测试文件"被否。

### D3：4 个新用例的断言设计（对齐 spec 场景文本）

1. **R1-S1 空引用行**：夹具 slide 含 `> SPEAKER NOTE` 标题行 + 空引用行（`>`）+ 后续引用正文 → 断言 extraction 记录该 note 且注入走完 receipt/assembly lineage。
2. **R1-S2 blank-only**：夹具仅含空引用行 → 断言 owner 报该 slide 缺 note 内容，且 PPTX 未被替换、无 notes receipt 落盘。
3. **R5 manifest 声明断言**：在既有 JPEG 派生用例的产物上补断言 delivery-manifest 条目含 `quality: 95` 与 `chroma_subsampling: "4:4:4"`（现仅断言输出 JPEG 的 4:4:4 与尺寸）。
4. **R6 ordinal footer**：构造 positions 1/10/100 的 manifest（≥3 slides），组装后 `jszip` 解包 PPTX，断言对应 slide XML 含 `>01<`/`>10<`/`>100<` 形态的 footer 文本，且 final PNG bytes/manifest digest 不变。

夹具全部走合成临时 deck；`jszip` 读 PPTX 在既有用例中已有先例（`ppt/media` 过滤），复用该模式。

### D4：矩阵核对方法（可复算）

对 21 个 Scenario 逐条：取场景文本的确定性关键词（如 "blank quote"、"quality `95`"、"`01`, `10`"），grep 用例名 + 断言行；命中记锚点，未命中记缺口。矩阵结果写入 tasks.md 第 1 组。该方法随 change 归档后可由任何人复跑。

## Risks / Trade-offs

- [新断言依赖 PPTX XML 内部形态（footer 文本匹配方式）] → 先解包真实产物观察 footer 的实际 XML 形态再写断言；断言宽松到"文本存在"而非布局细节。
- [R1 夹具与 notes parser 的规范化细节不合导致用例脆弱] → 复用 spec 场景文本中的精确形态（标题行 + 空引用行 + 引用正文）；失败时按 parser 实际规范化输出调整夹具而非放松断言。
- [矩阵遗漏间接覆盖] → 允许"间接锚点"标注（某用例部分覆盖某 Scenario），缺口判定只对完全无命中的 Scenario 成立。

## Migration Plan

纯测试新增，无迁移。回滚 = revert 单个 commit。

## Open Questions

（无。）
