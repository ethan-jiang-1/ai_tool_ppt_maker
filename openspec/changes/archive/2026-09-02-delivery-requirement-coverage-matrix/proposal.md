## Why

`delivery` capability 的 7 条 Requirement（21 个 Scenario）与 `tests/05-delivery/test_delivery.mjs`（18 个用例）之间没有成文的锚点映射，无法证明每条规范行为都有测试护栏。逐一核对后确认 **3 个 Scenario 没有测试锚点**：multiline speaker-note 的空引用行接受与空注释拒绝（R1 两条）、ordinal footer 跨位数渲染（R6——`01` 已有断言，但 `10`/`100` 的跨位数形态与"顺序派生"断言缺失）。复核中曾误判 R5 的 quality `95` 清单断言缺失，细查后确认 test 7 已断言 `delivery_media.manifest.profile.quality === 95`，予以纠正并记录。交付边界是最不该有护栏盲区的位置。

## What Changes

- **建立矩阵**：在本 change 内成文"7 Requirement × 21 Scenario → 现有/新增用例锚点"映射（矩阵随 change 归档，不新增长期 repo 文档），并据此记录 `06-iteration` "无需新动作"的判断与依据（154 行模块 + 5 路由用例 + reader 守护，见 plan 核查）。
- **补 3 个锚点**（全部写入现有 `tests/05-delivery/test_delivery.mjs`，不新建测试文件）：
  1. multiline SPEAKER NOTE 含空引用行时 notes extraction 记录该 note（R1-S1）；
  2. blank-only 注释在规范化后无内容 → notes injection 报缺内容且不替换 PPTX、不出 receipt（R1-S2）；
  3. 10 页 manifest（positions 1…10）组装后逐 slide 断言 footer `01`…`10` 按 manifest 顺序渲染，并以 formatter 单元断言覆盖 `100` 形态；final PNG bytes 不变（R6）。
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
