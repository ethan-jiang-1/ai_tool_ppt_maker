# BUG-016: legacy-image2 pipeline 单页迭代路径过度阻塞

> 严重级别: P1 | 发现: 2026-07-22 | 状态: 活跃

## 症状
在 legacy-image2-maintenance playbook 下，对已有 deck 做「改1页KICKER、重出1页图、其余25页不动」的轻量迭代时，被多重校验连续阻断，无法按预期完成最小重跑链：

1. **bundle 校验过严** — `checkBundle` 将 `2_backbone/agent-portrayal.md`（合法的 Agent 视觉规范参考文件）判为 violation，拒绝 Stage 1 运行。
2. **production adapter 解析失败** — `state.yaml` 有 `production_mode.by_version` 记录，但 `project-metadata.yaml` 缺少对应字段时，`resolveRunProductionAdapter` 返回 `MODE_MISSING`，拒绝 stage dispatch。
3. **Image2 授权门禁** — Stage 2 每次提交 API 调用都需要精确匹配的 `image2_provider_authorization` 记录（exact schema + scope + profile_fingerprint + execution_id），没有任何「已有交付物、只补1页」的快速通道。需要手动写 state.yaml 来绕过。
4. **provenance 指纹过敏感** — prompt 任何变化（改一个 KICKER 词、slide_id 重新编号）就判「cached slide image provenance is stale」，即使在 `--reuse-images` 模式下也拒绝复用。
5. **page_images_full 双命名冲突** — `NN_sNN_name.png` 和 `sNN_name.png` 并存时 Stage 3 报「ambiguous images」；只有一种时可能报「missing image」。缺少清晰的 canonical 命名策略。
6. **PPTX 组装被管线阻断** — Stage 3-5 在这些校验下持续失败，最终只能绕过管线，用 pptxgenjs 直接拿 `header_locked/` 的26张 PNG 手动拼 PPTX。

## 根因
管线围绕「全量生产」设计，假设每次都从零跑完整流程，provenance 校验、授权门禁、目录宪法一应俱全。但对实际迭代场景——「已有26页交付物，改1页文案、出1页新图、重新拼 PPTX」——没有预留低摩擦的最小重跑链。

具体缺失：
1. **增量授权模型** — 授权门禁不区分「全部26页首次提交」和「1页补生成」，scope 精确匹配要求使每轮迭代都要重新走完整授权流程。
2. **provenance 容忍度** — `_manifest.json` 的 `generation_fingerprint` 基于完整 prompt + metadata 哈希，KICKER 改动引发全量失效。没有 prompt 结构感知的 diff 机制。
3. **文件命名约定** — `page_images_full/` 同时存在两种命名方式（`NN_sNN_name.png` / `sNN_name.png`），Stage 3 对两种格式的发现逻辑不一致。

## 复现
1. 对一个已完成 `build` 的 legacy-image2 deck（26页），修改1页的 KICKER
2. `ppt_flow build --reuse-images`
3. Stage 1 通过，Stage 2 拒绝——需要 authorization、provenance stale
4. 手动写 authorization → `--only <id>` → Stage 2 通过
5. Stage 3 拒绝——page_images_full 文件命名 ambiguous/missing
6. 最终绕开管线手动拼 PPTX

## 修复关联
待定。可能的方向（需进一步评估）：
- 为 legacy-image2-maintenance 增加 `--incremental` 模式，跳过已有 provenance 匹配的页面
- authorization scope 支持 `incremental` 语义（「已有 N 页交付，只新增/变更 M 页」）
- 统一 `page_images_full/` 命名约定，消除双格式并存
- 或将 `header_locked/` 提升为 canonical 图源，Stage 3-5 默认从 `header_locked/` 读取而非重新推导
