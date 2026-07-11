# BUG-006: env-check 依赖检测只查 cwd 不向上找（`.env` 却向上找），deck bundle 永远无法 ✓ READY

> 严重级别: P1 | 发现: 2026-07-11 | 状态: 活跃

## 症状

标准布局是「`node_modules` 在 repo 根、每个 deck 的 `.env` 在 `deck_*/` 子目录」。此布局下 `env-check.mjs`（= `ppt_flow.mjs doctor` 的底层）**从任何单一目录都跑不出 ✓ READY**：

```
cd deck_temp_untitied && node PPTMAKER_FRAMEWORK/scripts/env-check.mjs
#   ✓ api_key: found        ← .env 向上找到了
#   ✗ @napi-rs/canvas: not installed   ← 只在 cwd 找 node_modules
#   ✗ pptxgenjs / commander: not installed
#   ✗ NOT READY

cd <repo 根> && node PPTMAKER_FRAMEWORK/scripts/env-check.mjs
#   ✓ deps 全 installed       ← cwd 就有 node_modules
#   ✗ api_key: not set         ← 向上找不到 deck 子目录里的 .env
#   ✗ NOT READY
```

BOOTSTRAP Step 1 把 env-check 当**硬闸门**（不过不许进 Step 2），于是正常 deck 用户被永久挡在门外，尽管环境其实是好的。

## 根因

`env-check.mjs` 里两个硬要求用了**不一致的路径解析策略**：

- **`.env`（向上遍历，正确）** — 约 217–219 行：
  ```js
  for (let p = process.cwd(); p !== dirname(p); p = dirname(p)) {
    if (existsSync(join(p, '.env'))) { loadDotenv(p); break; }
  }
  ```
- **依赖 / package.json（只看 cwd，缺陷）** — 约 142–152 行：
  ```js
  const pkgPath = join(process.cwd(), 'package.json');
  const nmPath  = join(process.cwd(), 'node_modules');
  const installed = existsSync(nmPath);
  const importable = installed && existsSync(join(nmPath, ...importName.split('/')));
  ```
  只查 `process.cwd()/node_modules`，**不向上遍历父目录**。

Node 自身的模块解析（真实管线的 `import`）是**向上找**的，所以 repo-root 的 `node_modules` 从 deck 子目录其实可被解析——**env-check 的 ✗ 是误报（false negative）**，但它会让硬闸门错误地挡住用户。

## 复现

见上「症状」两条命令。任一目录都无法同时让 `api_key` 和 `deps` 变 ✓。

## 契约探针 · 横切

同类问题：「同一个 doctor 检查里，不同硬要求用了不一致的路径解析基准」。清点 `env-check.mjs` 的解析基准：

| 检查项 | 基准 | 是否向上找 |
|--------|------|-----------|
| `.env` | `process.cwd()` | ✅ 向上遍历 |
| deps / package.json | `process.cwd()` | ❌ 仅 cwd |
| fonts | `__dirname`（框架内） | n/a |
| stage2 脚本 | `__dirname`（框架内） | n/a |

**修复方向**：让 deps 检测与 `.env` 一样**向父目录遍历**找最近的 `node_modules`（或改用 `createRequire(import.meta.url).resolve()` / `require.resolve`，直接借用 Node 的解析语义）。这样从 deck 目录跑就能同时 ✓ deps + ✓ api_key。`ppt_flow.mjs doctor`（见 BUG-003）修好后会一并受益。

## 修复关联

待排期，本卡**只报不修**。可与 BUG-003（同为 `doctor`/env 入口问题）合并到一个 OpenSpec change 考虑。
