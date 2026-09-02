## Context

`validatePageImageNotesInput` 的逐 slide 空内容检查把可归因 lineage 上的源内容缺陷抛成 `currentProtocolInvalid`；同库 `injectNotes` 对同一缺陷已有 spec 形态的 `source_validation` 报错。动机与证据见 proposal.md。无任何 spec 钉死旧消息、无其他测试依赖旧分类（grep 证实，见 proposal Why）。

## Goals / Non-Goals

**Goals:**

- 同一缺陷在 deliver 与 refresh 两条路径报告同一类别、同一消息、同一 next——诊断分类一致。
- 报错构造器单一事实源：抽取为 `notes_runtime.mjs` 导出，`injectNotes` 与 `validatePageImageNotesInput` 共用。

**Non-Goals:**

- 不改 delivery spec 任何 requirement；不动 slide-id 集合错配（62-66 行）与未声明/foreign 记录的 protocol-invalid 分类；不引入新 diagnostic schema/字段；不改 CLI exit code 体系。

## Decisions

### D1：抽取 `missingSpeakerNoteContentError(missingPositions)` 到 notes_runtime.mjs

消息、category（`source_validation`）、operation（`validate-notes`）、逐 slide issues、`edit_source` next 逐字保留 injectNotes 现状——injectNotes 行为零变化。备选"在 page_image_notes.mjs 内联复制一份"被否（两个同义发射 = 漂移温床）；备选"提升到 shared/cli"被否（该报错是 delivery-notes 专属语义，且诊断接缝权限刚好处在 `05-delivery/` 白名单内，`page_image_notes.mjs` 本就 import `notes_runtime.mjs`，无循环）。

### D2：在 validator 处抛，而不是放行到 injectNotes

备选"validator 放行空内容、让 injectNotes 自然抛"被否：refresh 流程中 validator 是第一道门，放行意味着身份校验通过后的下游才失败，违反 earliest-root-cause（simple-reliable-control）；且 `refreshTargetPageImageNotes` 与 `deliverTargetFinalSlideManifest` 都消费 validator，两路一次性对齐。

### D3：位置编号沿用 manifest 顺序

`missingPositions` = `ordered_slide_ids` 中空内容项的 1-based 下标，与 injectNotes 现有编号语义一致（`slide(s) 2` 即第二页）。spec "reports the slide" 由消息中的位置命名满足。

### D4：skip_specs: true 的依据

R1-S2 的 requirement 文本在主 spec 中已完整且正确；本 change 让实现向其收敛，属于"实现 conform 到已接受 spec"，不产生 requirement 级变化。若加 delta 反而制造复述。

## Risks / Trade-offs

- [有隐藏调用方依赖旧 protocol-invalid 分类] → grep 全仓 tests/e2e/scripts 证实无；focused 21 用例 + sweep 709 全绿兜底。
- [CLI envelope 回归] → 新发射与 notes_runtime 既有已上线发射逐字同形（schema/category/next 均为已注册值）；architecture guard 的 diagnostic-seam-jurisdiction 检查继续通过（`05-delivery/` 在白名单）。
- [blank-only 与 slide-id 错配语义边界模糊] → 检查顺序保持：先键集匹配（protocol-invalid），后逐位置内容（source_validation）——身份失败仍优先短路，符合 prerequisites-before-implications。

## Migration Plan

三步小改（helper 抽取 → 分类替换 → 测试翻转）单 commit 完成，回滚 = revert。无数据/状态迁移。

## Open Questions

（无。）
