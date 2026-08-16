# Proposal: Align doctor operation readiness

## Why

doctor 的 exact-run raw-generation READY 与实际 consumer 的启动事实分叉：`ppt_flow doctor
--run-dir <run-dir> --operation raw-generation` 在自身进程内加载 deck/project `.env` 后报告 READY
（BUG-070 现场：`Profile image2-raw: READY`），但紧随其后的 `image2 authorize` 不加载同一 `.env`，
仅读 `process.env`，在 shell 未 export 时以 `IMAGE2_PROVIDER_PROFILE_ID_MISSING/MISMATCH` 失败。
同时 doctor operation registry 存在两处失真：隐藏 alias `image2-raw` 被接受但与 `raw-generation`
同义且不出现在 help；`assembly-notes` 被 accepted 却落到 common fallback，没有任何针对装配/notes
能力的事实检查（legacy audit M-5 #6/#7）。Style Master 与 Image2 的 provider 入口各自 ad-hoc
调用非受限 `loadDotenv()`，读取任意 key、来源顺序不统一。现在实施：路线图 3 个串行 change 中的
第二个，技术上独立于 Change 1，在 Change 1 archive 后启动。

## What Changes

- **新增受限共享 startup loader**（`shared/image2/startup_env.mjs`，capability 归属 image-generation
  的 provider boundary startup）：只读取声明的 runtime keys（`IMAGE2_API_KEY`、
  `IMAGE2_BASE_URL`、`IMAGE2_PROVIDER_PROFILE_ID`），按固定 precedence 补缺——显式 process
  environment 优先，deck `.env` 只补缺失 key，project/cwd `.env` 只补仍缺失的 key；从不输出值或
  secrets，只返回 bounded 的加载位置 summary。
- **统一消费方**：`ppt_flow doctor` 的 run-bound raw-generation branch、`image2 authorize/generate`
  入口、Style Master authorize/generate 入口、`env-check` 的 raw-generation readiness 全部改用同一
  loader 与同一 precedence；provider-free 操作（plan/pilot/expansion/review/accept/reconcile/
  artifact-view/status/state）不加载 dotenv（行为不变）。
- **Doctor operation registry 只保留真实操作**：移除隐藏 `image2-raw` alias（唯一名
  `raw-generation`）；`assembly-notes` 从 accepted/help surface 移除，直到有真实 owner readiness；
  每个 accepted operation 映射到其真实 owner 的针对性 checks。
- **hard-stop 保留**：missing/invalid/profile mismatch 仍在 grant/attempt/provider request 之前
  secret-safe hard-stop（`environment`/`repair_environment`），不放宽 profile identity，不产生
  provider side effect。
- **cli-surface 合同修正**：`Current Image2 transport remains single-endpoint and bounded` 的
  "authorization 不加载 dotenv" 条款改为"authorization 仅解析受限非秘密 startup env 以完成
  profile identity 检查；credential pair 解析仍 generate-scoped"。
- 不相关 CLI 不因本 change 隐式读取 dotenv 或改变行为。

无 **BREAKING** public envelope shape；无新命令/flag；run-bundle contract `none`。

## Capabilities

### New Capabilities

无。受限 startup loader 是 `image-generation` provider boundary startup 的实现 seam
（manifest 注册为 shared/image2 interface），行为由四个既有 capability 的 delta 规定。

### Modified Capabilities

- `environment-check`: doctor operation registry 只含真实、有针对性 checks 的操作（移除
  `image2-raw` alias 与 `assembly-notes`）；exact-run raw-generation READY 与其 consumer
  共享同一受限 startup 来源与 precedence。
- `cli-surface`: MODIFIED `Current Image2 transport remains single-endpoint and bounded`——
  authorization 允许解析受限非秘密 startup env 完成 profile identity 检查；credential 解析仍
  generate-scoped；provider-free 操作仍不加载 dotenv。
- `image-generation`: Page Image authorize/generate 使用同一受限 startup loader（shell > deck >
  cwd，只读声明 keys）；missing/invalid/mismatch 在 grant/attempt/provider request 前 hard-stop。
- `style-master-generation`: Style Master authorize/generate 使用同一受限 startup loader 与
  precedence（消除与 Image2 的 startup 分叉）。

## Impact

- **Harness 源码**：新增 `ppt_maker_harness/scripts/shared/image2/startup_env.mjs`；
  `scripts/ppt_flow.mjs`（doctor branch、image2 authorize/generate 入口、Style Master 入口、
  两个 generate credential resolver）、`scripts/00-setup/internal/env_check.mjs`（operation
  registry + raw-generation checks 改用共享 loader）。
- **OpenSpec**：main specs 4 个（上述 Modified）。
- **测试**：unit（loader precedence/restricted-keys/无输出）、进程级 BUG-070 回归（doctor READY →
  authorize 无 shell export 成功；mismatch hard-stop；Style Master 同源）、env-check registry
  正反测试；全部隔离 fixture。
- **Control owner**：MD⇔JS protocol——JS 拥有 startup 来源与 readiness 事实；MD 消费
  `environment`/`repair_environment` 或 `source_validation`/`edit_source` 的 exact next。
- **Run-bundle contract impact**：`none`。无 migration、无新命令、无新 flag、不触碰
  `deck_*`/state/receipt/`_generated/`。
- **Policy 引用**：
  - `human-centered-gates.md`：missing/invalid/mismatch = `hard-stop`（protected invariant：
    provider identity/attribution 边界——不授权、不 claim、不请求，无 provider side effect），
    恢复路径唯一（`repair_environment` 或 `edit_source` 后重跑同一 checkpoint）；本 change 不引入
    `confirm`/waiver/force。
  - `agent-assistance-and-control.md`：direct control path 单一——一个受限 startup 来源 + 一个
    precedence，替换 doctor/generate 三处 ad-hoc `loadDotenv` 与 env-check 的 walk-up 变体；
    不建立第二 config authority；consumer 不复制 loader 逻辑。
  - `simple-reliable-control.md`：最短闭环（一个 loader → 一个 readiness 事实 → 一个 exact next）；
    删除/合并的复杂度：`image2-raw` alias、`assembly-notes` hollow operation、三处非受限 dotenv
    读取；无法证明净简化的部分（如为 authorized 操作新增 flag）已主动缩 scope。
