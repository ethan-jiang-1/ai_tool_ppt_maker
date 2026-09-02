## Why

`delivery-requirement-coverage-matrix`（已归档）补锚点时发现一处分类漂移：**blank-only speaker note 是可归因当前 lineage 上的源内容缺陷，却在 refresh 路径被分类为 `current_protocol_invalid` 协议硬停**（`page_image_notes.mjs:69`，"the notes input cannot establish current production identity"）。而 delivery spec R1-S2 规定该场景 SHALL "reports the slide as missing speaker-note content"，R3 又明确"可归因 lineage 的缺陷不得翻译成 protocol repair"。直接 `injectNotes` 路径的既有报错（`notes_runtime.mjs:230`，`source_validation` + `edit_source` next）才是 spec 要求的形态——两条路径对同一缺陷报告两种类别，违反 fail-clearly 与诊断分类一致性。经 grep 证实：无任何 spec 钉死旧分类消息，无任何其他测试依赖旧行为。

## What Changes

- **抽取共享报错构造器**：`notes_runtime.mjs` 新增导出 `missingSpeakerNoteContentError(missingPositions)`，承载既有 missing-content 报错的唯一事实源（消息、`source_validation` category、`validate-notes` operation、逐 slide issues、`edit_source` next 完全不变）；`injectNotes` 原地改用该构造器——**零行为变化**。
- **纠正分类**：`page_image_notes.mjs` `validatePageImageNotesInput` 的逐 slide 空内容检查（现 67-71 行）改抛 `missingSpeakerNoteContentError`，替代 `currentProtocolInvalid`。**范围仅此一处**：slide-id 集合不匹配（62-66 行）是真实身份错配，保持 protocol-invalid 不动；未声明/foreign 记录检查全部不动。
- **测试锚点翻转**：`test_delivery.mjs` 的 blank-only 用例断言从 `{ code: "current_protocol_invalid" }` 改为 `/missing SPEAKER NOTE content for slide\(s\) 1/`（消息命名 slide 位置，满足 spec "reports the slide"），"不替换 PPTX、不出 receipt" 字节不变断言保留。
- **明确不做**：不改 delivery spec（spec 本来就对，实现向 spec 对齐，故 `skip_specs: true`）；不动 slide-id 错配与 foreign 记录的分类；不改 CLI envelope schema（复用既有已上线诊断形态）。

## Capabilities

### New Capabilities

（无——实现向既有 spec requirement 对齐，无 spec 级行为变化，已声明 `skip_specs: true`。）

### Modified Capabilities

（无。）

## Impact

- **Harness 源码范围**：`05-delivery/internal/notes_runtime.mjs`（抽取导出 + injectNotes 改用）、`05-delivery/internal/page_image_notes.mjs`（一处抛错替换 + import）、`tests/05-delivery/test_delivery.mjs`（1 个用例断言翻转）。
- **Control owner**：JS。CLI 失败 envelope 的 schema 不变；该失败在 CLI 上的 category 由 gate/硬停语义变为 `source_validation`（guide 可修，one next action = `edit_source`）——与 notes_runtime 既有已上线发射完全同形。
- **Run-bundle contract impact**：`none`。不触碰 run-bundle 布局、state、schema 或生产路径。
- **验证面**：`npx vitest run --config vitest.config.mjs tests/05-delivery/test_delivery.mjs`（21/21）、`npm test`、`npm run test:sweep`、`openspec validate --all --strict`、architecture guard（诊断接缝权限：`05-delivery/` 在 `DIAGNOSTIC_SEAM_ALLOWED_PATHS` 内，`attachCliDiagnostic` 使用合法）。
- **Policy 锚点**：`human-centered-gates.md`——内容缺陷可归因 → `guide`（Agent 可 edit_source 机械修复），非 `hard-stop`；`simple-reliable-control.md`——fail clearly、one nearest legal action、单一报错定义（helper 唯一化）。
