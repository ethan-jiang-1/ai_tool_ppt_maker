# BUG-039: async-generate.mjs 文件命名与 formal pipeline 不一致

> 严重级别: P2 | 发现: 2026-07-30 | 状态: 活跃

## 症状

`async-generate.mjs` 产出的 raw PNG 文件名为 `{NN}-{slide_id}.png`（如 `01-GoRev.png`），但 formal pipeline（`page_authority_target_runtime.mjs` 的 `rawPath`）期望 `{slide_id}.png`（如 `GoRev.png`）。

直接后果：`image2 generate` → `image2 review` → `image2 accept` → `build` 链路在 `readTargetAcceptedRawWork` 阶段找不到 raw bytes，报 `target_raw_evidence_missing`。

## 根因

`async-generate.mjs` 第 88 行自行构造了带序号的路径：
```js
const pngName = `${String(pos).padStart(2,"0")}-${sid}.png`;
```

而 formal pipeline `rawPath` 使用 plan 中的 slide_id 直接构造：
```js
return join(paths.raw_root, `${slideId}.png`);
```

两条路径约定不一致，且各自独立决策文件名格式。

## 复现

```bash
export IMAGE2_API_KEY=$(grep '^IMAGE2_API_KEY=' .env | cut -d= -f2)
export IMAGE2_BASE_URL=$(grep '^IMAGE2_BASE_URL=' .env | cut -d= -f2)
node deck_ai_sdlc_keynote/3_versions/v4/_scratch/async-generate.mjs --only=GoRev
# 产出 raw/01-GoRev.png

node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_ai_sdlc_keynote/3_versions/v4
# 期望 raw/GoRev.png → 失败
```

## 修复方向

统一到 `{slide_id}.png`（formal pipeline 的标准）：
1. 修改 `async-generate.mjs` 第 88 行，去掉序号前缀
2. 如果用序号定位，通过 plan 的 `ordered_slide_ids` 即可——不需要编码到文件名

## 修复关联

- 本次生产通过符号链接绕过：`ln -sf 01-GoRev.png GoRev.png`
- 低优先级，不影响功能正确性，但每次用 `async-generate.mjs` 都需要手动做链接
