# 专题 04: Run Bundle 与 Artifact 模型

> 总控: [`../html-first-progressive-rendering.md`](../html-first-progressive-rendering.md)
> 状态: 架构已锁定 | 更新: 2026-07-17

## 目录原则

不改变三层 run-bundle 本体论，也不在 `vN` 根新增控制文件。目标是让共享 source、HTML 完成交付和 Image2 付费事务在 version leaf 内有清晰的物理分区：

```text
deck_NAME/
├── _state/state.yaml
├── 1_upstream_raw_material/             # 用户/研究上游原料；不放生成候选
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
        │       └── refined/image2/
        │           ├── style-reference/{output_sha256}.png
        │           └── visual-slots/{asset_key}/{output_sha256}.png
        ├── _generated/
        │   ├── slide_plan.json
        │   ├── html_production/          # 主交付线：HTML -> final-slide -> PPTX
        │   │   ├── html_pages/
        │   │   │   ├── {slide_id}.html
        │   │   │   └── _manifest.json
        │   │   ├── final_slides/
        │   │   │   ├── {slide_id}.png
        │   │   │   └── _manifest.json
        │   │   ├── preview/
        │   │   ├── qa/
        │   │   └── ppt/
        │   └── image2_refinement/         # 可选付费线：候选与审核中间物
        │       ├── visual_slots/{slide_id}/primary/
        │       │   ├── candidates/{output_sha256}.png
        │       │   ├── prompts/{generation_fingerprint}.md
        │       │   └── _manifest.json
        │       ├── comparison_previews/{slide_id}/{output_sha256}.png
        │       ├── retained_rejected/{slide_id}/
        │       │   ├── {output_sha256}.png
        │       │   └── provenance.json
        │       └── transport_receipts/
        └── _scratch/
            └── image2_refinement/
                ├── plans/{plan_sha256}.json
                ├── cleanup/{plan_sha256}.json
                └── transactions/{transaction_id}.json
```

`html_production/` 是用户可以完成并离开的主路径；`image2_refinement/` 是候选、审核和成本事务的可选路径。两者都可以影响最终页面，但只有通过 promotion 写入 `overrides/` 的 accepted asset 才能被 HTML compositor 作为正式 source 使用。legacy Image2-first deck 可以继续保留旧版 `_generated/` 内部布局；新 HTML-first version 不得把 legacy 路径当成 canonical。

Image2 相关目录是 lazy optional：fresh HTML-first deck 和从未选择专业升级的 version 不创建 `_generated/image2_refinement/`、`_scratch/image2_refinement/` 或 `overrides/.../refined/image2/` 也完全 conformant。`ppt_flow image2 plan` 首次创建 scratch plan 区，`image2 generate` 首次创建候选派生区，`image2 accept` 首次创建正式 override source 区。目录存在本身不代表已授权、已生成或已采用；真实状态仍由 plan/state/manifest/source 各自拥有。

## 所有权与删除语义

| 对象 | 所有者 | 删除/重建语义 |
|---|---|---|
| `slide-specifications.md` | Agent + 人类内容决定 | source，不可当缓存删除 |
| backbone/override assets | deck source/control | 正式视觉资产，进入版本复制和 Git 审计 |
| `_state/state.yaml` | framework state API | authorization/review evidence 与 consumed attempts，不手改 |
| `_generated/slide_plan.json` | Stage 1 / structured-plan module | renderer-neutral 派生物；可由 source 重建 |
| `_generated/html_production/html_pages/` | HTML production module | 便宜、可本地重建 |
| `_generated/html_production/final_slides/` | deterministic compositor | provider-neutral 正式页面；可从 source + 正式资产重建 |
| `_generated/image2_refinement/visual_slots/` | Image2 adapter | 昂贵候选；可显式清理，不保证相同像素重生 |
| `_generated/image2_refinement/comparison_previews/` | deterministic compositor | 候选整页对比图；可从 candidate + source 重建 |
| `_generated/image2_refinement/retained_rejected/` | Image2 cleanup module | 每页至多一个 recent rejected 像素 + provenance；仍是可删派生物，不参与 composition |
| `_generated/image2_refinement/transport_receipts/` | Image2 transaction module | 非权威 transport 证据；按 cleanup/recovery 规则处理 |

接受 Image2 候选后必须把它提升为版本 override source asset；否则 `_generated/` 可删宪法与“用户已经付费并接受”会冲突。style-reference setup 产物归 `overrides/visual-style/assets/refined/image2/style-reference/`，accepted page visual 归 `.../visual-slots/`；composition 和 generation 都只通过 resolved asset catalog 消费它们，不直接依赖目录名。

style reference 使用 manifest 保留逻辑 ID `image2-style-reference-current` 唯一选择当前 source asset，不按目录 mtime、文件名排序或 state 猜测。该 ID 由 Change 4 保留为 framework-managed version-override entry；backbone 或用户普通 asset 不得声明它，resolver 也要求 resolved origin 为 current version override。该 entry 指向完整 SHA 文件，并在 provenance 记录 output SHA、生成输入摘要和 `created_for_style_reference_contract`。新 setup 原子替换这个 manifest binding；旧 SHA 文件可以作为未引用版本历史保留。catalog 可以正常解析历史普通 asset，但 Image2 plan 只有在 current binding 的 contract fingerprint 匹配时才可复用它。HTML composition 从不解析这个保留 ID，因此它缺失或 stale 不影响完整 HTML 成品；binding 存在但 origin、文件或 SHA 损坏时只阻断 Image2 plan，并要求显式 source repair。

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

`image2-comparison-preview` 是独立 artifact kind，identity 为 `(slide_id, candidate_output_sha256, composition_fingerprint)`；它只用于 side-by-side review，不能被 Stage 4 当作 current final-slide。

## 身份、版本与失效

- `slide_id` 是稳定身份，`position` 是顺序投影；artifact fingerprint 排除 position。
- 纯重排只重建 HTML projection、final slide、contact sheet、PPTX 和 notes，不调用远端 renderer。
- accepted selection 的 `accepted_for` 等于当前 visual contract fingerprint 且 merged catalog/asset bytes 通过完整性校验时才生效，并可随 source/override 复制到 vNext。
- 创建 vNext 时，现有 clean-version publication authority 复制完整 `slide-specifications.md + overrides/` source/control delta；这会带走其中的正式 selection、manifest 与 accepted asset。发布事务随后按 target source 重新解析：仍匹配的 selection 为 `selected`，不匹配的为 `stale` 并本地 fallback，悬空或 SHA 不符的为 `broken` 并阻断发布。不得为了“只复制有效 selection”对 Markdown 做一次隐式破坏性清洗。
- vNext 不复制 `_generated/image2_refinement/` candidate、comparison preview、transport receipt、`_scratch` plan/journal 或 Image2 authorization/review state。新版本若要继续生成/审核，必须基于 target current fingerprints 重新 plan；旧 version state 可留作旧版 cost audit，但不得成为 target execution evidence。
- `image2-style-reference-current` binding 及其 source asset 可随 overrides 进入 vNext，但 target plan 必须重新比较其 `created_for_style_reference_contract`；匹配时零远端复用，不匹配时保留历史 asset 并把新 setup attempt 明列为成本，绝不能悄悄沿用或覆盖旧 SHA 文件。
- fingerprint 变化时，当前 binding 保留为 stale 供用户识别和决定，当前页使用 HTML fallback；重新接受会替换 binding，`use-html` 会清除 binding。旧的已登记且未再引用的 accepted asset 仍是版本 source history，不自动删除。
- source selection + resolved正式资产是零远端重建的充分依据；`_state` 中的 review evidence 是审计/交互状态，不是已经接受页面的 build 前置条件。新 vNext 或 state heal 不得仅因缺少旧版 review record 让有效 selection 失效。
- Structural apply、impact 和 materialization 永不调用 Image2。
- target version 只消费 target-owned/materialized artifact，不以旧版本目录作为隐式 runtime fallback。
- legacy-located 文件不是 verified provenance，不能作为当前成品或跨版本复用依据。

### Selection resolution 与 composition fingerprint

Stage 1 是唯一 selection resolution owner，并输出 `fallback|selected|stale|broken`：

- 先无条件验证 fallback recipe 与其引用的 resolved asset bytes；失败是 slide source/control diagnostic，并在 selection resolution 前阻断。
- resolution 次序固定为 null check -> asset catalog/path/type/byte-SHA integrity -> visual contract applicability；因此悬空或损坏 binding 始终是 `broken`，不会因其 contract 同时 stale 而被降级掩盖。
- `fallback` 和 `stale` 将 resolved fallback asset SHAs/recipe version 写入 structured plan；`stale` 同时携带 slide ID、旧/当前 contract fingerprint 的 secret-safe diagnostic。
- `selected` 将 accepted asset ID、resolved origin 和 verified byte SHA 写入 structured plan。
- `broken` 在 HTML renderer 前 fail closed；不得因 fallback 可用就掩盖正式 source asset 损坏。

`composition_fingerprint` 覆盖 renderer-neutral structured plan、resolved selection outcome、实际消费的本地 asset SHAs、visual config dependency、HTML runtime/profile 和 compositor version。它不覆盖 position、Image2 authorization/review state、候选目录或 provider profile。由此，样式或 slot 语义变化会走 `stale -> fallback -> local recomposition`，而单纯更换未来候选的 provider profile 不会让已接受 final-slide 失效。

## 清理规则

- 删除 `_generated/` 前检测未接受的昂贵候选并明确提示它们不可逐像素重生。
- `image2 clean` 只清计划列出的未引用候选、comparison previews、prompt 和非权威 transport receipt，不碰正式 override asset，也不删除 state 中的 authorization/attempt cost audit。
- 本版精修尚未结束时默认不清候选。
- accepted candidate 已由正式 override asset 持久保存。recent rejected 不得写入 `1_upstream_raw_material/`，因为它不是上游原料；cleanup 按 review timestamp 在 `_generated/image2_refinement/retained_rejected/{slide_id}/` 每页保留至多一个像素文件和 provenance，其余按 exact plan 删除。该 retained copy 仍属于 `_generated/`，删除整个派生区前必须提示不可逐像素重生；它不参与 asset catalog 或 composition。
- review state 缺失、时间戳无效或同页候选顺序歧义时，cleanup 不得猜 recent rejected；计划必须保留所有相关候选或要求人类明确选择后重新生成 plan。
- orphan manifest entry 和未引用 staged asset 只能通过 transaction recovery 或显式清理回收。
