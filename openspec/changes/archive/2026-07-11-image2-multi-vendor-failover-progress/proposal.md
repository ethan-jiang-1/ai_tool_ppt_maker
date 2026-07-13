## Why

Image2 多 vendor 被想复杂了：不是 registry/strategy，而是有序 `(base_url, key)` + 顺序 failover。今日缺口叠了三层——

1. **跑不稳**：单 key 配多 URL；sync 闷等；failover 只留 lastError；doctor 与 runtime 不一致。
2. **看不清**：人不知道换线了、挂了、还是还在画。
3. **走不到**：用户不会念 `probe-vendors` / playbook 名；症状话（502、画不出来）接不上能力。

本 change 一次收齐这三层，且不加抽象框架。

变更类型：`pipeline-script` + doctor 旗标 + playbook/COMMANDS。影响链：Chain B。

## What Changes

### A. 运行时（出图怎么跑）

- `resolveVendors`：`IMAGE2_BASE_URL=url|KEY_ENV,...`（推荐 LCON→Zenmux→apib）；legacy 兼容；VENDORS 优先于 BASE_URL(S)；`--base-url` 只配共享 key。
- 一层 failover + 薄 sync/async；`Mirror failed`；全挂 attempts 摘要；成功 trace 含 `attempts`（无密钥）。
- submit+poll 统一心跳；submit 受 `MAX_WAIT_MS`；Stage 2 打 `i/N`。

### B. Doctor 仪器（怎么验通道）

- 静态检查 ≡ `resolveVendors`（含 VENDORS-only keys）。
- `--smoke`：只探第一家（门禁）。
- `--probe-vendors`：逐家报告 + 建议顺序；不自动写 `.env`；与 `--smoke` 互斥。
- 仍 12 个 CLI 命令（doctor 旗标，无新子命令）。

### C. 意图可发现（怎么让人走到）

- Playbook `probe-image-channels`：intake → probe → show → confirm-write。
- `COMMANDS.md`「环境 / 画画通道」：直述 + 症状 + 选择类说法。
- 出图失败等症状出现时，Agent 白话主动递「要不要逐家试通道」（§11）；只要报告可短路径直跑 doctor；写配置必须确认。
- 长出图：后台 + 转述心跳；失败不盖盖子。

**不做：** 新顶层子命令；registry/strategy；探针自动改 `.env`；考用户背旗标名。

## Capabilities

### New Capabilities

（无）

### Modified Capabilities

- `image-generation` — A
- `environment-check` — B
- `cli-surface` — B（doctor 旗标/help）
- `style-master-generation` — 同 A 的 client
- `playbook-execution` — C

## Impact

代码：`image_api_client.mjs`、`stage2_generate_images.mjs`、`env-check.mjs`、`ppt_flow.mjs`。  
文档：`probe-image-channels.md`、`COMMANDS.md`、BOOTSTRAP、`03-tool-selection`、`.env.example`。  
测试：`tests/test_image_generation.mjs`、`tests/test_env_check.mjs`。
