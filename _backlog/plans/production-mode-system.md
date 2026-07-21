# production_mode — 三模式生产系统

## 问题

现在 workflow 强制 HTML production 做完才能选做 image2 refinement（optional Phase 4）。用户希望 init 时就决定走哪条路：

1. **`html-only`** — 纯 HTML production，不走 image2
2. **`html-then-image2`** — HTML 做完接 image2 refinement（不再是 optional，是 required second phase）
3. **`image2-only`** — 不走 HTML，直接用 Image2 做主渲染（≈ 现有 legacy pipeline）

---

## 概念区分

| 概念 | 是什么 | 存在哪 |
|------|--------|--------|
| `production.pipeline` | 渲染技术：`html-first-v1` vs `legacy-image2-first` | `slide-specifications.md` 的 YAML frontmatter |
| `production_mode` | workflow 形状：跑哪些 phase，哪些命令可用 | `_state/state.yaml`（权威）+ `project-metadata.yaml`（镜像） |

`html-only` 和 `html-then-image2` 都走 `html-first-v1` pipeline，区别在于 Phase 4 是 forbidden 还是 required。`image2-only` 走 `legacy-image2-first` pipeline。

---

## 数据落点

### 1. `_state/state.yaml` — 权威源

顶层加一个字段：

```yaml
production_mode: html-only   # html-only | html-then-image2 | image2-only
```

与 `pipeline`、`playbook`、`current_node` 同级。CLI 路由直接读这个字段，不猜。

### 2. `project-metadata.yaml` — 静态镜像

```yaml
production_mode: html-only
```

人类可读，init 时写入。`ppt_flow status` 展示。

### 3. `state.mjs` 中的推断

`healState()` 自动推断缺失的 mode：
- 有 `pipeline: html-first-v1` 且无 image2 refinement state → `html-only`
- 有 `pipeline: html-first-v1` 且有 image2 refinement state → `html-then-image2`
- 有 `pipeline: legacy-image2-first` → `image2-only`

`validateState()` 检查 `production_mode` 是合法值，且与 `pipeline` 一致。

### 4. 不放在 `slide-specifications.md` 的 frontmatter 里

`production.pipeline` 已经在那里了，再加 mode 会让 frontmatter 变成两个不同维度的东西混在一起。Pipeline 是「用啥技术渲染」，mode 是「跑哪些 phase」——mode 是 deck 级别的选择（整个 run bundle 共享），不是 source 级别的。放在 state 更干净。

---

## 常量定义

加在 `bundle_layout.mjs`（因为它是 run bundle 的 SSOT）：

```js
export const PRODUCTION_MODES = Object.freeze([
  "html-only",
  "html-then-image2",
  "image2-only",
]);
export const DEFAULT_PRODUCTION_MODE = "html-only";
```

`derivePipelineFromMode(mode)` 工具函数也放这里：
- `html-only` / `html-then-image2` → `html-first-v1`
- `image2-only` → `legacy-image2-first`

---

## 各文件改动

### `state.mjs`

1. `createDefaultState()` 加 `production_mode: "html-only"`
2. `createInitialState()` 接受 `productionMode` 参数
3. `healState()` 加推断逻辑（缺失时从 pipeline 推断）
4. `validateState()` / `validateStateReadOnly()` 验证 `production_mode ∈ PRODUCTION_MODES` 且 `pipeline ≡ derivePipelineFromMode(mode)`
5. 新增 helper: `resolveProductionMode(deckDir, state)` — state 优先，fallback metadata，再 fallback 推断

### `bundle_layout.mjs`

1. 加 `PRODUCTION_MODES`、`DEFAULT_PRODUCTION_MODE`、`derivePipelineFromMode()` 三个 export
2. `initBundle()` 接受 `productionMode` 参数：
   - 写 `production_mode` 到 `project-metadata.yaml`
   - 写 `state.production_mode` 和 `state.pipeline`
   - 如果 `mode === "image2-only"`：seed legacy source（`initLegacyBundle` 的逻辑），设 pipeline = `legacy-image2-first`
   - 否则：保持现有 html-first seed
3. `checkBundle()` 加 mode 相关检查：
   - `html-only` 模式下不应有 `_generated/image2_refinement/` 目录
   - `image2-only` 模式下不应有 `_generated/html_production/` 目录

### `ppt_flow.mjs` — CLI 路由（核心改动）

#### 新增 `resolveProductionMode(runDir)` helper

```js
async function resolveProductionMode(runDir) {
  const root = deckRoot(runDir);
  const s = readState(root, { purpose: "observe" });
  if (!s.corrupted && PRODUCTION_MODES.includes(s.production_mode))
    return s.production_mode;
  // fallback: 读 metadata
  const meta = metadataFields(join(root, METADATA_FILE));
  if (PRODUCTION_MODES.includes(meta.production_mode))
    return meta.production_mode;
  // 最终 fallback: 从 pipeline 推断
  if (s.pipeline === LEGACY_PIPELINE) return "image2-only";
  return "html-only";
}
```

#### `init` command 加 `--mode` flag

```bash
ppt_flow init deck_xxx --deck-type pitch --style tech-startup --mode html-then-image2
```

默认 `html-only`。不传时行为不变。

#### 各 command 路由表

| command | html-only | html-then-image2 | image2-only |
|---------|-----------|------------------|-------------|
| `init` | HTML-first seed | HTML-first seed | legacy seed |
| `doctor` | 不变 | 不变 | 不变 |
| `validate` | HTML validate | HTML validate | legacy validate |
| `pilot` | HTML preview (stage 1,2,3) | 同 html-only | legacy pilot (stage 1+2+contact sheet) |
| `approve content/visual` | HTML gate review | 同 html-only | legacy gate |
| `approve header` | 拒绝（html 无 header review） | 同 html-only | legacy header review |
| `style-master` | 拒绝 | 拒绝 | 允许 |
| `build` | HTML build (stage 1-5) | 同 html-only，完成后提示"image2 next" | legacy build (stage 1-5) |
| `refresh` | HTML refresh paths | 同 html-only | legacy refresh |
| `image2 *` | 拒绝："disabled in html-only mode" | 允许（现有逻辑） | 拒绝："use legacy build/pilot" |
| `status` | 显示mode | 显示mode，delivery后提示 refinement required | 显示mode |
| `slides` | 不变 | 不变 | 不变 |
| `state` | 不变 | 不变 | 不变 |
| `migrate-html` | 允许 | 允许 | 拒绝（已是 image2） |
| `new-version` | 不变 | 不变 | 不变 |
| `test` | 不变 | 不变 | 不变 |

#### `resolveImage2Run()` 改动

当前只检查 `html-first-v1` marker。改成先读 `production_mode`：
1. `html-only` → 拒绝（"Image2 refinement is disabled in html-only mode."）
2. `html-then-image2` → 走现有逻辑
3. `image2-only` → 拒绝（"Use legacy build/pilot for Image2 generation."）

#### `commandBuild()` 对 `html-then-image2` 的提示

build 成功后，如果 mode 是 `html-then-image2` 且 delivery review 是 proceed，打印：
```
HTML delivery complete. Production mode is html-then-image2.
Next required step: image2 refinement
  ppt_flow image2 plan <runDir>
```

---

## Mode 切换

走现有 `state` 命令扩展。切换直接改 state 字段。

| 从 → 到 | 操作 | 影响 |
|---------|------|------|
| html-only → html-then-image2 | `state --set-mode html-then-image2` | 无损。仅启用 image2 命令。 |
| html-then-image2 → html-only | `state --set-mode html-only` | 需确认。清 image2 refinement state（如果有）。 |
| html-only → image2-only | `state --set-mode image2-only --force --reason "..."` | **破坏性**。pipeline 变了。需重建 source，清 HTML review evidence，清所有 generated 产物。 |
| image2-only → html-only | `state --set-mode html-only --force --reason "..."` | **破坏性**。同上反向。 |

跨 pipeline 的 mode 切换（html↔image2）本质上是重建 deck，因为 source 格式不同。这不应该轻量执行——需要 `--force --reason`。

---

## 向后兼容

- 现有 html-first deck：`state.production_mode` 缺失 → `healState` 推断为 `html-only`。行为不变。
- 现有 legacy deck：推断为 `image2-only`。行为不变。
- 新增 deck（`ppt_flow init` 不带 `--mode`）：默认 `html-only`。

所有现有命令、测试、工作流完全兼容。

---

## 不做什么

1. **不在 `slide-specifications.md` 的 frontmatter 里加 `production.mode`。** Mode 是 deck 级配置，不是 source 级的。
2. **不给 `image2-only` 做 modern refinement。** `image2-only` 走 legacy pipeline，不走 modern image2 refinement（那是 HTML-first 专属的 visual-slot refinement）。
3. **`ppt_flow mode` 不作为独立顶层命令。** 并入 `ppt_flow state --set-mode`，避免命令膨胀。

---

## 验证清单

1. `ppt_flow init --mode html-only` → state `production_mode: html-only`，pipeline = `html-first-v1`
2. `ppt_flow init --mode html-then-image2` → 同上，mode 不同
3. `ppt_flow init --mode image2-only` → state `production_mode: image2-only`，pipeline = `legacy-image2-first`，source 是 legacy 格式
4. `ppt_flow image2 plan <runDir>` 在 html-only mode 下被拒绝
5. `ppt_flow style-master <runDir>` 在 html-only/html-then-image2 mode 下被拒绝
6. `ppt_flow build` 在 html-then-image2 mode 下，delivery review 后提示 image2 required
7. `ppt_flow status` 显示 mode
8. `ppt_flow state --set-mode html-then-image2` 从 html-only 切换成功
9. `ppt_flow state --set-mode image2-only --force --reason "..."` 跨 pipeline 切换成功
10. 现有 deck 无 `production_mode` 字段时，status/state 自动推断正确值
