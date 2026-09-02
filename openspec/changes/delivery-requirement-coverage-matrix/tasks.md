## 1. Requirement→用例锚点矩阵（核对记录，随本 change 归档）

- [ ] 1.1 逐条核对 21 个 Scenario 并落矩阵；核对方法 = design D4（场景关键词 grep 用例名 + 断言行）。结果：

| Req | Scenario | 锚点 |
| --- | --- | --- |
| R1 空引用行注释 | S1 空引用行分隔标题与正文 | **缺口 → 新用例 2.1a** |
| R1 | S2 blank-only 注释无效 | **缺口 → 新用例 2.1b** |
| R2 notes-only refresh | S1 未声明 marker 拒绝 | test 18（"rejects a persisted undeclared manifest before a notes-only refresh…"） |
| R2 | S2 旧派生 receipt → 正常重建 | test 12（间接锚点） |
| R3 notes completion | S1 写当前 notes receipt | test 7（间接锚点） |
| R3 | S2 无效身份 → current-protocol 硬停 | test 13 |
| R3 | S3 可归因漂移 → 重建 | test 12 |
| R4 notes receipt 校验 | S1 绑定当前 final delivery | test 4 |
| R4 | S2 跟随 JPEG-backed assembly | test 4 + test 10（间接锚点） |
| R4 | S3 JPEG media 不匹配 → 停 | test 5 |
| R4 | S4 未声明 notes 输入 | test 18 |
| R5 JPEG 固定 profile | S1 尺寸不变 + manifest 声明 quality 95/4:4:4 | 部分（test 8 断言尺寸+4:4:4；**缺 quality 95 清单断言 → 2.2**） |
| R5 | S2 透明像素压白 | test 11 |
| R5 | S3 交付前仅 PNG | test 8 + test 15（间接锚点） |
| R6 ordinal footer | S1 manifest 顺序决定 `01`/`10`/`100` | **缺口 → 新用例 2.3**（test 10 仅断言顺序，未断言 footer） |
| R7 assembly 消费 manifest | S1 接收当前 media | test 10 |
| R7 | S2 JPEG media 组装 | test 8 |
| R7 | S3 stale media 先重建 | test 12 |
| R7 | S4 派生失败保护既有交付 | test 14 + test 15 |
| R7 | S5 未声明 media → repair | test 17 |
| R7 | S6 foreign manifest → repair | test 16 |

结论：4 个缺口（R1-S1、R1-S2、R5-S1 断言半边、R6-S1）。**06-iteration 无需新动作**：`06-iteration/index.mjs`（154 行、4 exports）配 `test_target_refresh_routing.mjs` 5 用例，classifier MD↔manifest 一致性由 `test_md_controller_reader.mjs` 守护，与本 plan 核查一致。

## 2. 补 4 个锚点（全部写入 `tests/05-delivery/test_delivery.mjs`）

- [ ] 2.1 R1 两个用例：(a) multiline `> SPEAKER NOTE` 标题 + 空引用行 + 引用正文 → extraction 记录 note 且注入完成 lineage；(b) blank-only 注释 → 报缺内容、不替换 PPTX、无 receipt。夹具走既有 `mkdtempSync` 合成 deck 模式。验证：focused 运行两用例通过
- [ ] 2.2 R5 断言补齐：在既有 JPEG 派生用例产物上断言 delivery-manifest 条目含 `quality: 95` 与 `chroma_subsampling: "4:4:4"`。验证：focused 运行通过
- [ ] 2.3 R6 footer 用例：构造 positions 1/10/100 manifest，组装后 jszip 解包 PPTX 断言三张 slide 的 footer 文本按序为 `01`/`10`/`100`，且 final PNG bytes 与 manifest digest 不变。验证：focused 运行通过

## 3. 全量验证

- [ ] 3.1 `npm run test:focused -- tests/05-delivery/test_delivery.mjs` 全绿（18+新增）
- [ ] 3.2 `npm test`（core）全绿；`npm run test:sweep` 全绿
- [ ] 3.3 `openspec validate --all --strict` 通过；`git diff --check` 干净；`source-test-ownership.json` 无需变更（无新文件）复核
