# BUG-047: `ppt_flow style-master generate` 不自动加载 `.env` 凭证，doctor 却会

> 严重级别: P1 | 发现: 2026-08-04 | 状态: 活跃

## 症状

在 `.env`（项目根，含 `IMAGE2_API_KEY` / `IMAGE2_BASE_URL`）已配置的情况下，直接按文档运行：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master generate <run-dir> --plan-hash <sha>
```

立即失败：

```
FAILED: Style Master candidate generation cannot access the Image2 credentials.
diagnostic.reason.kind = style_master_provider_credentials_unavailable
```

但同一环境跑 `ppt_flow doctor --run-dir <run-dir> --operation raw-generation` 却显示
`✓ api_key: found (IMAGE2_API_KEY)`。

## 根因

凭证读取路径不一致：

- **`doctor` / env-check**（`00-setup/internal/env_check.mjs`）启动时会 `loadDotenv()`，从
  cwd 向上查找 `.env` 并写入 `process.env`（`runAllChecks` 内 `for (const p of walkUpDirs(start))`）。
- **`style-master generate`** 的 transport 走 `shared/image2/credentials.mjs` 的
  `resolveImage2Credentials()`，**只读 `process.env`**，不加载任何 `.env` 文件。

因此 generate 需要外部先 export 凭证或用 `node --env-file=.env` 包裹，否则拿不到 key。
这是 CLI 行为不一致：同一个 `.env` 下 doctor 说 READY，generate 却报凭据缺失。整个生产
generate 路径（page raw 的 `targetPageAuthoritySubmitFactory` 同理）都依赖外部 env 注入。

## 复现

```bash
# 项目根 .env 已配好 IMAGE2_API_KEY/IMAGE2_BASE_URL，shell 未 export
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master generate <run-dir> --plan-hash <sha>
# → style_master_provider_credentials_unavailable

# 对照：doctor 自动加载
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation
# → ✓ api_key found
```

Workaround（本次生产用的）：`node --env-file=.env PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs ...`

## 修复关联

待定 — 需要 OpenSpec change。方向：让 generate 的 transport 初始化复用一个统一的凭证
loader（与 env-check 相同的 `loadDotenv` 向上查找逻辑），或文档/命令契约明确 require env 预加载。
