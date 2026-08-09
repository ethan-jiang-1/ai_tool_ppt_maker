# BUG-065: 内容寻址的物理目录/文件名使用完整 64 位 SHA，未按 8 字符截断

> 严重级别: P2 | 发现: 2026-08-09 | 状态: 已修复（2026-08-10）

## 症状

`deck_dark_factory_current` 中，上游 raw 证据与派生产物的**物理磁盘路径**使用完整 64-hex SHA 作为目录/文件名。实测扫描：**53 个 64-hex 目录 + 39 个 64-hex 文件**，分布：

- `1_upstream_raw_material/page-image-style-master-iterations/plans/<64-hex>/`（style master 计划目录 + candidates 子目录）
- `1_upstream_raw_material/page-image-workflow-iterations/plans/<64-hex>/{batches,materializations,attempts,accepted-evidence,complete-reviews}/<64-hex>…`
- `3_versions/vN/_generated/page_image_workflow/review/complete-page/<64-hex>/`

而 `_generated/nav/art/` 的 display reference（`m-5a67bff4-1.png`、`d-eab4e0b2-1.jpg`、`s-9edcea6a.png` 等）**已经是 8 字符截断**——说明 harness 内部已有 `.slice(0, 8)` 截断能力，但只在 display 层用，物理存储层没用。

用户明确要求：**内部（state/receipt/JSON/内存）可以保留完整哈希；外部物理落盘的文件名/目录名一律只保留前 8 个字符**。此要求同时覆盖 pure 与 framed 两条 workflow。

## 根因

内容寻址存储层在**创建物理目录时直接用了完整 `plan_sha256` / `batch_hash` 等**，没有走统一的短名策略：

- `scripts/shared/image2/page_image_progressive_store.mjs:290` — `join(root.plans_root, plan_sha256)`
- `scripts/shared/image2/style_master_store.mjs:217` — 同样的完整 SHA 目录名
- batches / materializations / attempts / accepted-evidence / complete-reviews 的目录与文件名同理（`page_image_progressive_store.mjs`、`page_image_artifacts.mjs` 等）

display reference（`scripts/shared/workflow/page_production_display_references.mjs:64,76`）用 `sha256.slice(0, 8)` 生成短引用，但**从未下沉到物理路径创建处**。此前 BUG-063（content-addressed path length unusable）的落地选择了"增加可重建 logical reference view、不迁移内容寻址物理目录"，等于只治了人类导航的症状，物理目录名问题按原样保留。

## 复现

1. 对任意 deck 跑 `ppt_flow style-master plan` 或 `image2 plan`（pure/framed 均可）
2. 观察 `1_upstream_raw_material/page-image-style-master-iterations/plans/` 或 `page-image-workflow-iterations/plans/` 下生成的目录名
3. 目录名为完整 64-hex SHA，与 `_generated/nav/art/` 的 8 字符短引用不一致

## 修复关联

OpenSpec change `content-addressed-short-paths` 已落地：物理名固定为完整内容地址的前 8 个 hex 字符，记录、state、receipt 和 CAS head 保持完整 SHA 身份。写入与读取均校验记录中的完整地址；同父目录前缀冲突硬停且不覆盖，遗留 64-hex 路径可验证回退。

该 change 同时提供 exact current v1 Pure/Framed run 的私有迁移 owner、迁移锁和回滚；副本上的 Pure `v2` 已完成迁移并通过 validate、build 与 artifact-view。历史 v2 输入保留 `unsupported-protocol/export` 硬停，不建立兼容或转换路径。
