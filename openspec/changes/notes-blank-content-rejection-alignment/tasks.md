## 1. 抽取共享报错构造器

- [x] 1.1 `notes_runtime.mjs` 新增导出 `missingSpeakerNoteContentError(missingPositions)`：消息 `Notes injection aborted: missing SPEAKER NOTE content for slide(s) …` + `attachCliDiagnostic`（`source_validation` / `validate-notes` / 逐 slide issues / `edit_source` next）逐字取自现 injectNotes 内联块；`injectNotes` 改用该构造器，条件语义不变（非字符串或 trim 后为空即缺）。验证：vitest 直跑 `tests/05-delivery/test_delivery.mjs`，既有 21 用例全绿（injectNotes 路径零行为变化）

## 2. 分类纠正 + 测试翻转

- [x] 2.1 `page_image_notes.mjs` `validatePageImageNotesInput`：逐 slide 空内容循环改为收集 `missingPositions`（`ordered_slide_ids` 的 1-based 下标）并抛 `missingSpeakerNoteContentError(missingPositions)`；删除该处 `currentProtocolInvalid`；import 新 helper。slide-id 键集错配（protocol-invalid）与全部未声明/foreign 检查不动。验证：node 语法检查 + 2.3 focused 全绿
- [x] 2.2 `test_delivery.mjs` blank-only 用例断言翻转：`rejects.toThrow(/missing SPEAKER NOTE content for slide\(s\) 1/)`；保留 PPTX 与 delivery-receipt 字节不变断言。验证：vitest 直跑 21/21 全绿
- [x] 2.3 提交（实现 + 测试同一 commit，保证中间态可 bisect）

## 3. 全量验证

- [x] 3.1 `npm test`（core）全绿；`npm run test:sweep` 全绿（709/709）
- [x] 3.2 `openspec validate --all --strict` 通过（26/26）；`git diff --check` 干净；architecture guard 诊断接缝检查通过（含于 sweep 的 test_harness_architecture）
