## Why

出图链上三层问题，加上 **agentic 自学习** 缺宪法落点：

1. **凭据约定乱**：`OPENAI_*` 像 ChatGPT；doctor 说 URL 可选，运行时硬要。
2. **BUG-008**：submit 不认 `data:[{task_id}]`，凭据对了也出不了图。
3. **试错无规程**：小白配不准；Agent 试一次就停，或试通了经验散落聊天/随便塞文件。

原则（本 change 的脊梁）：

| 谁 | 职责 |
|----|------|
| **Framework** | 只**约定**：变量名、冒烟怎么试、学习面在哪、什么不能写 |
| **Run bundle** | **自己学习**：把试通的操作经验写进本 deck 的约定目录；下次 Agent 先读再跑 |

Framework 不替每个 deck「记住」；记忆在 bundle 里长出来。

## What Changes

### A. Image2 凭据契约（机器）

规范名：`IMAGE2_API_KEY` + `IMAGE2_BASE_URL`（或非空 `IMAGE2_BASE_URLS`）双必填。  
别名：`OPENAI_*` / `APIMART_*` 仍解析。doctor ≡ 运行时。

### B. BUG-008（机器）

`image_api_client` submit/poll 与 result 统一认 `data` 数组包络。

### C. 冒烟赋能（Framework MD）

BOOTSTRAP + `03-tool-selection`：多组合试通；禁止首败甩锅小白。

### D. 分层落点（宪法级和谐）

```
.secrets / 运行时     →  .env（IMAGE2_*）           ← 密钥 SSOT；walk-up 加载
run bundle 自学习     →  _learning/                 ← 【指定】操作中试出的非密钥经验；先读再猜
playbook 执行进度     →  _state/                    ← 跑到哪了（不是学习笔记）
framework 方法论      →  PPTMAKER_FRAMEWORK/        ← 约定怎么学、学什么形态
```

**`_learning/` 必须指定这件事儿**（README、CONSTITUTION 树旁注、deck README、init 种子、相关 MD——凡出现都要写清，禁止空挂目录名）：

- **这里放什么：** 本 deck 操作里试通的、可复用的**非密钥**经验（约定文件：`image2-proven.yaml`）  
- **不放什么：** 密钥（`.env`）、playbook 进度（`_state`）、素材、生成物  
- 试通胜出的 **key/url** → `.env`；**非密钥回执** → `_learning/image2-proven.yaml`  
- 禁止：聊天-only、塞进 `_generated/`、自创非宪法目录装学习内容  

`init` 种子：带「这里放什么」的 `_learning/README.md`（仿 `_state/README`）；`bundle_layout` / CONSTITUTION 树收录并旁注职责。

## Capabilities

### Modified

- `framework-charter` — CONSTITUTION：run bundle `_learning/` 自学习面；与 `_state` / `.env` 分工  
- `run-bundle-management` — init/树/`--check` 认识 `_learning/`  
- `environment-check` — IMAGE2_* key（改）；base URL 硬失败（新增进 OpenSpec；今日代码 soft-ok）  
- `image-generation` — 凭据 + BUG-008 + 冒烟 + 落点（`.env` + `_learning/`）  
- `style-master-generation` — 同一凭据契约  

## Impact

代码：`image_api_client`、`env-check`、`bundle_layout`、`unified_pipeline`。  
文档：CONSTITUTION、BOOTSTRAP、03-tool-selection、00-setup、AGENTS、README。  
产物约定：`_learning/`。归档 BUG-008。

**Out of scope**：Framework 内建向量记忆/跨 deck 全局学习库；删别名；改 HTTP 路径；把 key 写入 `_learning/`。
