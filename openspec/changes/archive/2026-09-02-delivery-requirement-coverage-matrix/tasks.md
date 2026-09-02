## 1. Requirement→用例锚点矩阵（核对记录，随本 change 归档）

- [x] 1.1 逐条核对 21 个 Scenario 并落矩阵；核对方法 = design D4（场景关键词 grep 用例名 + 断言行）。结果：

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
| R5 JPEG 固定 profile | S1 尺寸不变 + manifest 声明 quality 95/4:4:4 | test 7（断言 `delivery_media.manifest.profile.quality === 95` 等）+ test 8（sharp 断言尺寸与 4:4:4）——复核纠正：曾误判缺口 |
| R5 | S2 透明像素压白 | test 11 |
| R5 | S3 交付前仅 PNG | test 8 + test 15（间接锚点） |
| R6 ordinal footer | S1 manifest 顺序决定 `01`/`10`/`100` | 部分（`01` 由 test 7/10 断言；**跨位数 `10`/`100` 与顺序派生断言缺失 → 新用例 2.3**） |
| R7 assembly 消费 manifest | S1 接收当前 media | test 10 |
| R7 | S2 JPEG media 组装 | test 8 |
| R7 | S3 stale media 先重建 | test 12 |
| R7 | S4 派生失败保护既有交付 | test 14 + test 15 |
| R7 | S5 未声明 media → repair | test 17 |
| R7 | S6 foreign manifest → repair | test 16 |

结论：3 个缺口（R1-S1、R1-S2、R6 跨位数渲染）。**06-iteration 无需新动作**：`06-iteration/index.mjs`（154 行、4 exports）配 `test_target_refresh_routing.mjs` 5 用例，classifier MD↔manifest 一致性由 `test_md_controller_reader.mjs` 守护，与本 plan 核查一致。

**实施中发现的观察（不在本 change 处理）**：R1-S2 的拒绝消息在 refresh 路径是 `current_protocol_invalid`（`page_image_notes.mjs:69`，"the notes input cannot establish current production identity"），而 spec 场景措辞 "reports the slide as missing speaker-note content" 字面上只对应直接 `injectNotes` 路径（`notes_runtime.mjs:230`）。核心保证（拒绝 + 不替换 PPTX + 不出 receipt）两条路径都成立；消息措辞是否需要 spec/impl 对齐，留作后续独立小 change 评估。

## 2. 补 3 个锚点（全部写入 `tests/05-delivery/test_delivery.mjs`）

- [x] 2.1 R1 两个用例：(a) multiline `> **SPEAKER NOTE**` 标题 + 空引用行 + 引用正文 → `refreshTargetPageImageNotes` 记录 note 且注入完成 lineage（`notes_injected: 1`）；(b) blank-only 注释 → 报缺内容、不替换 PPTX、无新 receipt。夹具走既有 `mkdtempSync` 合成 deck 模式。验证：focused 运行两用例通过（vitest 直跑 21/21；(b) 实际拒绝面为 `current_protocol_invalid`，见矩阵观察记录）
- [x] 2.2 R6 footer 用例：构造 10 页 pure manifest（positions 1…10），`deliverTargetFinalSlideManifest` 后按 position 解包逐 slide XML 断言 footer `01`…`10` 顺序渲染，`formatPageImageOrdinal(100) === "100"` 单元断言覆盖三位数形态，final PNG bytes 不变。验证：focused 运行通过

## 3. 全量验证

- [x] 3.1 focused 档按设计排除视觉渲染类测试（"rejects visual-engine closures"），本文件经 `npx vitest run --config vitest.config.mjs tests/05-delivery/test_delivery.mjs` 直跑全绿（21/21 = 18 既有 + 3 新增）
- [x] 3.2 `npm test`（core）全绿；`npm run test:sweep` 全绿（709/709，含 3 个新增用例）
- [x] 3.3 `openspec validate --all --strict` 通过（26/26）；`git diff --check` 干净；`source-test-ownership.json` 复核无需变更（`05-delivery` unit 测试仍为 `test_delivery.mjs` 一个文件）
