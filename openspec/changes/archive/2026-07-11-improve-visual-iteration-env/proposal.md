## Why

一次真实视觉迭代（style master 重生成 + 3 页 pilot）暴露的摩擦在**环境/管道层**：`--only` 反直觉、预览被迫 `--waive` 污染 gate 语义、长渲染无心跳且 pilot 总强制重渲、style master 与 `deck_system.txt` 双写漂移。plan 中 BUG-006 / IMAGE2 硬失败 / BUG-008 解析已落地；本 change 只收**仍成立**的部分，并修掉「只改 pilot 外层检查、子 Stage 2 仍拦门」的半吊子设计。

## What Changes

### In scope

1. **预览就绪三档** — `checkBundle` / pipeline 区分 `structure` → `preview`（+ style master）→ `pipeline`（+ metadata gates）。`pilot` 走 preview；默认含 Stage 2 的生产路径走 pipeline。**不**新增 `previewing` gate 态，**不**为预览写 `waived`。
2. **`--only` 友好解析** — 共享 `resolveSlideIds`：精确 id → `sNN` 前缀 → 1-based 页号 → 唯一子串；失败 envelope 列出可用 id。
3. **Skip / force 一致** — Stage 2 仅在显式 `--force-images` 时重渲；`pilot` 不再无条件带 force；**`--only` 不再隐式 force**（行为变更，见 Impact）。
4. **长渲染可观察** — poll 心跳（≤30s）；单图仍受 `MAX_WAIT_MS` 约束，超时信息标明本页失败。
5. **style master ∥ Stage 1 约束源** — 生成时注入与 Stage 1 相同的 `2_backbone/visual-style/deck_system.txt` 文本（`loadDeckSystem` 同源）；缺文件则仅 prompt。
6. **可选 `doctor --smoke`** — 存在性通过后一次最小 live probe（拿到 `task_id` 即够）；默认离线。
7. **契约 fixture 测试** — 脱敏 JSON 覆盖 unwrap / `extractImageRef`（含 poll 内嵌图）。

### Out of scope

- 重做 BUG-006 / BUG-008 解析 /「可选默认 IMAGE2 端点」
- 新 gate 枚举 `previewing`；后台 daemon / 作业级断点续跑
- 默认每次 doctor 打 API；改 `_state` gate schema
- 统一 metadata vs `_state` 双写（既有问题，本 change 不扩 scope）

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

| Capability | 变更要点 |
|------------|----------|
| `run-bundle-management` | `checkBundle` 预览/生产就绪档位 |
| `pipeline-orchestration` | `--preview`；`--only` 解析；force 仅显式 |
| `cli-surface` | `pilot` preview + `--force-images`；doctor `--smoke`；`--only` UX |
| `image-generation` | 心跳；超时表述；fixtures |
| `environment-check` | `--smoke` probe |
| `style-master-generation` | 注入 `deck_system.txt` |
| `playbook-execution` | `quick-preview` 允许 pending；生产 Stage 2 / build 仍要门 |

## Impact

- **代码：** `bundle_layout.mjs`（checkBundle）、`unified_pipeline.mjs`、`ppt_flow.mjs`、`image_api_client.mjs`、`env-check.mjs`、`generate_style_master.mjs`、可选 `scripts/lib/slide_ids.mjs`、playbook/docs
- **行为变更：** `--only` 不再自动 `--force-images`（Chain B 定向刷新须显式加 `--force-images`）
- **非破坏：** 不改 gate 枚举；全量/非 preview 的 Stage 2 仍要求 metadata `approved`/`waived`；`.env` / `_lessons` 契约不变
- **收尾：** apply 完成后将 plan `git mv` 至 `_backlog/_done/_closed_plans/`
