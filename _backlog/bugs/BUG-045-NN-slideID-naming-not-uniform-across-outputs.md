# BUG-045: NN_slideID 命名只用于 final，raw 等产出仍无前缀（命名不统一）

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 活跃

## 症状

生产输出文件命名不统一：
- `_generated/page_authority_image2/final/` → `01_InfoRev.png` … `25_YourMov.png`（✅ 有 NN_，BUG-043 修复生效）
- `_generated/page_authority_image2/raw/` → `InfoRev.png`、`TriYear.png`…（❌ 无 NN_ 前缀）

用户认为"生产的东西应该有序号"，raw 等产出仍是裸 `${slide_id}.png`，看起来像 NN_ 又漏了。

## 根因

BUG-043 的修复只改了 **final manifest**（`createFinalSlideManifest` → `NN_slideID.png`）。raw 投影文件（`_generated/page_authority_image2/raw/`）仍由 workflow 以 `${slide_id}.png` 命名（`page_authority_target_runtime.mjs:162` / 各 workflow 的 raw 写入路径），没有应用 `NN_slideID`。production-conventions 的 `NN_slideID` 约定没有覆盖 raw 等中间产出。

## 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
ls <run-dir>/_generated/page_authority_image2/raw/   # InfoRev.png（无 NN_）
ls <run-dir>/_generated/page_authority_image2/final/ # 01_InfoRev.png（有 NN_）
```

## 修复关联

把 `NN_slideID` 命名统一到 raw 投影等所有按页产出的文件（或明确约定 raw 为 canonical-only、最终交付才 NN_，并在文档写清）。修复后所有产出命名一致。与 BUG-040（页内页码）同属"序号"一致性话题。
