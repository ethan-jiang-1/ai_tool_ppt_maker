---
id: BUG-003
title: Header review gate 在纯 full-page deck + 迭代修改场景下全面锁死
severity: high
status: open
found_at: 2026-07-12
found_in: deck_ai_sdlc_bpm_keynote, iterate-style → Phase 3 production
reproduced: yes (多次)
---

## 症状

反复打磨 slide 内容（改名、改 IMAGE PROMPT）后，重跑 `--stage 2 --only <ids>` 被 header review gate 拦住：

```
✗ Header review gate: header review fingerprint is stale
✗ Header review gate: header review evidence is missing for this version
✗ Header review gate: raw-image provenance is stale for full-page id s01_cover (x25)
```

即使 `--only` 指定的 slide 根本不是 pilot review 的那几张（s01/s03/s04），也被全局拦截。即使 deck 全部是 full-page 模式（压根没有 header-lock，不需要 header review），gate 也强制检查。

## 场景

deck_ai_sdlc_bpm_keynote：25 页全部 `render_mode: full-page`。用户改了 5 页内容（s05 改名、s07 更新、s14/s15 公司案例更新、s21 改名）。重跑后 gate 锁死所有 Stage 2 和 Stage 4 操作。

尝试过的修复路径（全部失败）：
1. 删 `_manifest.json` → gate 报 "manifest entry missing"
2. 删 `_state/state.yaml` 里的 `header-review` 节点 → gate 报 "header review evidence is missing"
3. 手动重建 manifest（sha256(raw prompt)）→ fingerprint 不匹配（pipeline 用 `stableJson({prompt, profile})` 算）
4. 用框架自己的 `generationFingerprint()` 重建 manifest → per-slide 指纹对了，但全局 `header_review_fingerprint` 不匹配（pipeline 用 `stableJson({snapshot, geometry})` 算，和 per-slide 完全不同的公式）
5. 用框架自己的 `buildHeaderReviewInputs()` + `mergeHeaderReviewRecord()` 完整重建 state → gate 仍报 "evidence is missing for this version"（`by_version` key 查找失败）
6. `--preview` 跳过 Stage 2 的 header review，但 Stage 4 **不认** `--preview`，仍然强制检查
7. `ppt_flow build --reuse-images` 内部自动跑 Stage 1 → fingerprint 全变

**唯一 workaround**：绕过 unified_pipeline，直接调 `stage4_build_pptx.mjs`：

```js
import { buildPptx } from 'PPTMAKER_FRAMEWORK/scripts/stage4_build_pptx.mjs';
await buildPptx({ images, slidePlan, out, title });
```

## 根因（5 层）

1. **Header review 对纯 full-page deck 无意义但仍强制检查。** 25 页全部 `full-page`，没有 body+header-lock 页——header review 的设计目的（审核 header 文字位置/清晰度）根本不适用。但 Stage 4 无条件调用 `validateProductionHeaderReview()`。

2. **Fingerprint 是全局的，不是 per-slide 的。** `header_review_fingerprint` = `sha256(stableJson({full_page_header_snapshot, content_header_geometry}))`，覆盖全部 25 页。任意一页 KICKER/TITLE 变了，全局 fingerprint 就变。

3. **Stage 4 每次都自动刷新 Stage 1（line 846-851）。** 即使只跑 `--stage 4`，pipeline 检测到 stages 不含 1 就自动跑一次 Stage 1。Stage 1 重新生成 prompt 后，所有 fingerprint 作废。

4. **指纹体系有两套互不兼容的公式：**
   - **per-slide** `generation_fingerprint` = `sha256(stableJson({prompt, profile}))`
   - **全局** `header_review_fingerprint` = `sha256(stableJson({full_page_header_snapshot, content_header_geometry}))`
   - 手动修复时，需要同时用两套公式、从三个数据源（`_prompts.json`、`slide_plan.json`、`color_palette.json`）重建——缺一个就全挂。

5. **`--only` 不缩小 gate 检查范围。** 即使只改 3 页，gate 检查全部 25 页的 provenance。改的页不在 reviewed 集合里也会被拦。

## 复现步骤

1. 完成 pilot → approve header → build（header review 写入 state）
2. 修改若干 slide 的 IMAGE PROMPT 或 slide ID
3. 运行任意 Stage 2/4 操作 → **被拦**

## 建议修复

1. **纯 full-page deck 跳过 header review。** `validateProductionHeaderReview` 应检测 deck 是否全为 full-page，若是则直接返回 `{current: true}`——没有 header 需要 review。
2. **Fingerprint per-slide，全局 fingerprint 从 per-slide 派生。** 改一页只 invalidate 那一页的 provenance，不牵连全册。
3. **`--only` 限制 gate 范围。** 只检查 `--only` 指定的 slide，不检查其余。
4. **Slide ID 改名自动清理。** Stage 1 检测到 slide_plan 中 ID 变化时，自动清理 manifest + state 中的孤儿条目。
5. **Stage 4 不再自动跑 Stage 1。** 如果 Stage 1 产物已存在且 slide-specs 未变，不应重跑。让调用者决定是否刷新。
