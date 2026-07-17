# 专题 04: Run Bundle 与 Artifact 模型

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 决策完成 | 更新: 2026-07-17

## 目录原则

不改变三层 run-bundle 本体论，也不在 `vN` 根新增控制文件：

```text
deck_NAME/
├── _state/state.yaml
├── 1_upstream_raw_material/
│   └── refinement-history/{version_basename}/{slide_id}/
│       ├── recent-rejected.png
│       └── provenance.json
├── 2_backbone/
│   └── visual-style/
│       ├── deck_system.txt
│       ├── color_palette.json
│       └── assets/
│           ├── asset-manifest.yaml
│           ├── svg/
│           ├── reference/
│           └── icons/
│
└── 3_versions/
    └── vN/
        ├── slide-specifications.md
        ├── overrides/
        │   └── visual-style/assets/
        │       ├── asset-manifest.yaml
        │       └── reference/refined/
        ├── _generated/
        │   ├── slide_plan.json
        │   ├── html_pages/
        │   │   ├── {slide_id}.html
        │   │   └── _manifest.json
        │   ├── visual_slots/
        │   │   └── {slide_id}/primary/
        │   │       ├── candidates/{output_sha256}.png
        │   │       ├── prompts/{generation_fingerprint}.md
        │   │       └── _manifest.json
        │   ├── final_slides/
        │   │   ├── {slide_id}.png
        │   │   └── _manifest.json
        │   ├── refinement_previews/
        │   │   └── {slide_id}/{output_sha256}.png
        │   ├── preview/
        │   ├── qa/
        │   └── ppt/
        └── _scratch/
            └── refinement/
                ├── plans/{plan_sha256}.json
                ├── cleanup/{plan_sha256}.json
                └── transactions/{transaction_id}.json
```

## 所有权与删除语义

| 对象 | 所有者 | 删除/重建语义 |
|---|---|---|
| `slide-specifications.md` | Agent + 人类内容决定 | source，不可当缓存删除 |
| backbone/override assets | deck source/control | 正式视觉资产，进入版本复制和 Git 审计 |
| `_state/state.yaml` | framework state API | authorization/review evidence 与 consumed attempts，不手改 |
| `html_pages/` | HTML layout module | 便宜、可本地重建 |
| `visual_slots/.../candidates/` | Image2 adapter | 昂贵派生物；未接受候选可显式清理，不保证重生为相同像素 |
| `refinement_previews/` | deterministic compositor | 候选整页对比图；便宜、可从 candidate + source 重建 |
| `final_slides/` | deterministic compositor | 便宜、从 source + 正式资产重建 |

接受 Image2 候选后必须把它提升为版本 override source asset；否则 `_generated/` 可删宪法与“用户已经付费并接受”会冲突。

## Asset catalog 合并

现有目录级 override 语义不适合版本只新增一张精修图：一个 override assets 目录可能遮住 backbone catalog。

新规则：

- 分别加载 backbone manifest 与 version override manifest。
- 按 asset ID 合并，version 同 ID 胜出。
- 未覆盖 ID 继续继承 backbone。
- 不复制整套共享资产到版本目录。
- 每个 resolved asset 的 fingerprint 包含最终选择的文件 SHA 和来源层级。
- 新的 resolved-catalog interface 取代 HTML-first 消费者对单一 `assetsDir()` 的假设；legacy 调用继续走兼容路径，不能让 version manifest 的存在整目录遮蔽 backbone。

## Artifact identity

```text
layout document:
(slide_id, "html", "layout-document", fingerprint)

visual candidate:
(slide_id, slot_id, "image2", "visual-slot",
 generation_fingerprint, output_sha256)

final slide:
(slide_id, "html-compositor", "final-slide", composition_fingerprint)
```

Image2 具有随机性：相同 prompt/profile 可以产生不同像素，所以 visual candidate 必须同时包含 generation fingerprint 和 output SHA。用户接受记录绑定具体 SHA，不能只绑定 prompt。

Stage 4 只按当前 `slide_plan` 顺序解析一个 verified `final-slide`，不再读取 selected render engine。

`refinement-preview` 是独立 artifact kind，identity 为 `(slide_id, candidate_output_sha256, composition_fingerprint)`；它只用于 side-by-side review，不能被 Stage 4 当作 current final-slide。

## 身份、版本与失效

- `slide_id` 是稳定身份，`position` 是顺序投影；artifact fingerprint 排除 position。
- 纯重排只重建 HTML projection、final slide、contact sheet、PPTX 和 notes，不调用远端 renderer。
- accepted selection 的 `accepted_for` 等于当前 visual contract fingerprint 时才生效，并可随 source/override 复制到 vNext。
- fingerprint 变化时，旧 asset 与 selection 留在 source history，但 resolver 返回 stale，当前页回退 HTML fallback。
- source selection + resolved正式资产是零远端重建的充分依据；`_state` 中的 review evidence 是审计/交互状态，不是已经接受页面的 build 前置条件。新 vNext 或 state heal 不得仅因缺少旧版 review record 让有效 selection 失效。
- Structural apply、impact 和 materialization 永不调用 Image2。
- target version 只消费 target-owned/materialized artifact，不以旧版本目录作为隐式 runtime fallback。
- legacy-located 文件不是 verified provenance，不能作为当前成品或跨版本复用依据。

## 清理规则

- 删除 `_generated/` 前检测未接受的昂贵候选并明确提示它们不可逐像素重生。
- `refine clean` 只清计划列出的未引用候选、refinement previews、prompt 和非权威 transport receipt，不碰正式 override asset，也不删除 state 中的 authorization/attempt cost audit。
- 本版精修尚未结束时默认不清候选。
- accepted candidate 已由正式 override asset 持久保存；收尾清理前，把每页按 review timestamp 判定的 recent rejected 归档到 `1_upstream_raw_material/refinement-history/{version_basename}/{slide_id}/`（例如 `v2/UXGap/`），附非密钥 provenance JSON。该历史不是 asset catalog，也不参与当前 composition。
- orphan manifest entry 和未引用 staged asset 只能通过 transaction recovery 或显式清理回收。
