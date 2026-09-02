## Why

`delivery` capability 的 7 条 Requirement（21 个 Scenario）与 `tests/05-delivery/test_delivery.mjs`（18 个用例）之间没有成文的锚点映射，无法证明每条规范行为都有测试护栏。逐一核对后确认 **4 个 Scenario 完全没有测试锚点**：multiline speaker-note 的空引用行接受与空注释拒绝（R1 两条）、delivery-manifest 条目声明 quality `95` 的断言（R5 只断言了尺寸与 4:4:4，未断言 95）、ordinal footer 在成品 PPTX 中的渲染断言（R6，`page_image_ordinal_footer.mjs` 零直接测试）。交付边界是最不该有护栏盲区的位置。

## What Changes

- **建立矩阵**：在本 change 内成文"7 Requirement × 21 Scenario → 现有/新增用例锚点"映射（矩阵随 change 归档，不新增长期 repo 文档），并据此记录 `06-iteration` "无需新动作"的判断与依据（154 行模块 + 5 路由用例 + reader 守护，见 plan 核查）。
- **补 4 个锚点**（全部写入现有 `tests/05-delivery/test_delivery.mjs`，不新建测试文件）：
  1. multiline SPEAKER NOTE 含空引用行时 notes extraction 记录该 note（R1-S1）；
  2. blank-only 注释在规范化后无内容 → notes injection 报缺内容且不替换 PPTX、不出 receipt（R1-S2）；
  3. 交付后断言 delivery-manifest 条目声明 `quality: 95` 与 4:4:4（补齐 R5-S1 断言面）；
  4. 组装后解包 PPTX 断言 ordinal footer `01`/`10`/`100` 按 manifest 顺序渲染（R6）。
- **明确不做**：不改任何生产代码；不改 delivery spec（行为无变化，故 `skip_specs: true`）；不拆测试文件；不动 `source-test-ownership.json`（无新文件）。

## Capabilities

### New Capabilities

（无——纯测试补强，无 spec 级行为变化，已声明 `skip_specs: true`。）

### Modified Capabilities

（无。）

## Impact

- **Harness 源码范围**：仅 `tests/05-delivery/test_delivery.mjs`（新增约 4 个用例）与本 change 的 tasks/verification 文档。
- **Control owner**：不涉及——无 MD⇔JS protocol、无 CLI、无 gate/state 变化。
- **Run-bundle contract impact**：`none`。测试使用临时合成夹具，不触碰 `deck_*`/`dpt_*` 生产数据（architecture guard 的 production-data-scope 规则继续适用）。
- **验证面**：`npm run test:focused -- tests/05-delivery/test_delivery.mjs`、`npm test`、`npm run test:sweep`、`openspec validate --all --strict`。
