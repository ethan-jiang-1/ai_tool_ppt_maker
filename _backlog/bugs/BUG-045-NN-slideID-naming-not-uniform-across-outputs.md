# BUG-045: NN_slideID 命名只用于 final，raw 等产出仍无前缀（命名不统一）

> 严重级别: P1 | 发现: 2026-08-02 | 状态: 待真实 run 验收（本地框架修复完成：2026-08-02）

## 当前复核

`unify-page-ordinal-projections` 现在将 rebuildable raw、Pure Pilot 和 Framed Pilot
underlay/composite 的人类浏览文件统一命名为 `NN_slideID.png`。Pilot subset 从完整 raw
plan 取 current position，因此单独抽取第 10 页仍写为 `10_DataMap.png`，不会被重编号为
`01_DataMap.png`。stable evidence path、raw contract、provider authorization、CAS/attempt/
provenance 与 receipt 仍只用 stable `slide_id` / digest，不把序号变成逻辑身份。

本地 workflow 回归已覆盖 raw、Pure/Framed Pilot 和重排序下稳定 evidence item。2026-08-03
读取指定 deck v5 的历史 raw 目录，25 个文件仍为裸 `slide_id.png`，这正说明旧产物不能作为
新命名规则的验收替代；v7 尚未获重建授权，因此仍待真实 run 确认输出目录浏览体验与实际文件顺序。

## 历史记录

### 症状

生产输出文件命名不统一：
- `_generated/page_authority_image2/final/` → `01_InfoRev.png` … `25_YourMov.png`（✅ 有 NN_，BUG-043 修复生效）
- `_generated/page_authority_image2/raw/` → `InfoRev.png`、`TriYear.png`…（❌ 无 NN_ 前缀）

用户认为"生产的东西应该有序号"，raw 等产出仍是裸 `${slide_id}.png`，看起来像 NN_ 又漏了。

### 根因

BUG-043 的修复只改了 **final manifest**（`createFinalSlideManifest` → `NN_slideID.png`）。raw 投影文件（`_generated/page_authority_image2/raw/`）仍由 workflow 以 `${slide_id}.png` 命名（`page_authority_target_runtime.mjs:162` / 各 workflow 的 raw 写入路径），没有应用 `NN_slideID`。production-conventions 的 `NN_slideID` 约定没有覆盖 raw 等中间产出。

### 复现

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build <run-dir>
ls <run-dir>/_generated/page_authority_image2/raw/   # InfoRev.png（无 NN_）
ls <run-dir>/_generated/page_authority_image2/final/ # 01_InfoRev.png（有 NN_）
```

### 修复关联

把 `NN_slideID` 命名统一到 raw 投影等所有按页产出的文件（或明确约定 raw 为 canonical-only、最终交付才 NN_，并在文档写清）。修复后所有产出命名一致。与 BUG-040（页内页码）同属"序号"一致性话题。
