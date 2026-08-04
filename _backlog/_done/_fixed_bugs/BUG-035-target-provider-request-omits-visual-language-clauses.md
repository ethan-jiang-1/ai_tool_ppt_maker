# BUG-035: Current target provider request omits visual-language provider clauses

> 严重级别: P0 | 发现: 2026-07-30 | 状态: 活跃（当前路径复核：2026-08-02）

## 当前复核

旧的 `async-generate.mjs` 已不属于 framework 正式路径，但底层缺口仍在：当前
`framedRawContract` 和 `pureRawContract` 都取
`slide.visual_language.projection`；`createTargetProviderRequest` 原样包装该 raw
contract，`targetPageAuthoritySubmitFactory` 又原样序列化 request。因此 provider
收到的是 recipe/composition/motif 的 ID 与 SHA，而不是 resolver 已产生的
`provider_clauses` 文本。

这是当前 v2 Page Authority 的 P0 语义缺口，不是旧 scratch 脚本的修补任务。
修复必须在受支持的 raw-contract/provider-request 边界保留受 text guard 保护的
provider clauses，并让它们进入 request digest、授权范围和回归测试；不能在提交
前临时从 source 或 registry 反查后拼接。

## 历史记录

### 症状

`async-generate.mjs` 生成的 Image2 API prompt JSON 中，`visual_language` 只包含 SHA256 摘要和 ID，不包含实际的视觉描述文本（provider_clauses）。所有 25 张图片的视觉指导都降级为无文本语义的哈希值。

### 根因

`async-generate.mjs` 第 97-102 行：

```js
const vl = slide.visual_language?.projection;   // ← 只有 digest
// ...
const promptJson = {
    visual_language: { ...vl, negative_constraints: [...] },
    // vl 不含 provider clause 文本
};
```

`slide.visual_language` 有两层：
- `projection` — SHA 摘要（`recipe: { id: "editorial-systems", provider_clause_sha256: "abc123" }`）
- `provider_clauses` — 实际文本（`recipe: "warm editorial sketch on cream paper, sepia ink, amber accents..."`）

脚本取了 `projection`，丢弃了 `provider_clauses`。

API 收到的 `visual_language.recipe` 是 `{ id: "editorial-systems", provider_clause_sha256: "..." }` 而不是 `"warm editorial sketch on cream paper, sepia ink, amber accents, quiet depth, pure visual underlay with no lettering"`。

除非 APIMART 服务端恰好持有相同的 `page-authority-visual-language.yaml` registry 并能从 SHA 反查 clause，否则模型失去了所有视觉文本指导。

### 历史复现

```bash
export IMAGE2_API_KEY=$(grep '^IMAGE2_API_KEY=' .env | cut -d= -f2)
export IMAGE2_BASE_URL=$(grep '^IMAGE2_BASE_URL=' .env | cut -d= -f2)
node deck_ai_sdlc_keynote/3_versions/v4/_scratch/async-generate.mjs --only=GoRev
# 检查 raw/01-GoRev.png — 观察是否缺乏暖编辑风格指导
```

可以通过打印 `promptJson` 确认：
```js
console.log(JSON.stringify(promptJson.visual_language, null, 2));
// 输出全是 id + provider_clause_sha256，无实际描述文本
```

### 当时修复方向

在 `async-generate.mjs` 中将 `provider_clauses` 与 `projection` 一起发送：

```js
const vl = slide.visual_language;
const promptJson = {
    visual_language: {
        ...vl.projection,
        provider_clauses: vl.provider_clauses,  // ← 新增
        negative_constraints: [...]
    },
    // ...
};
```

或在 API prompt 中直接展开 provider clauses 到顶层字符串字段。

同步排查：其他调用方是否也存在同样的 `projection` vs `provider_clauses` 混用。

### 关联

待定 — 需要 OpenSpec change。
