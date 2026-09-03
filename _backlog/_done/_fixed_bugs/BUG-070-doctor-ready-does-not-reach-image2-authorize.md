# BUG-070: exact-run doctor 报 raw-generation READY，但 `image2 authorize` 不加载同一 `.env` 而失败

> 严重级别: P1 | 发现: 2026-08-16 | 状态: 已修复（2026-08-16）

## 症状

在 V8 的已冻结 Pure pilot batch 上，以下 exact-run readiness command 成功：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor \
  --run-dir deck_ai_sdlc_bpm_keynote/3_versions/v8 \
  --operation raw-generation
```

输出 `Profile image2-raw: READY`，并明确显示 `IMAGE2_API_KEY`、`IMAGE2_BASE_URL` 和
`IMAGE2_PROVIDER_PROFILE_ID` 均已找到。紧接着不改变 run、plan 或 batch 的情况下执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs image2 authorize \
  deck_ai_sdlc_bpm_keynote/3_versions/v8 \
  --plan-hash 7a21eb82208281a30c9dfd430163d8f4f011cf7db40080e3a838d3edd57f5a41 \
  --batch-hash c271fe02f8b82de43e05baf2d93e80cbf8e7007738f5a39529259c3a06e709b2
```

却失败为 `image2_provider_profile_id_missing`，诊断称
`IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile`。同一 shell 的
`process.env` 也确实没有三个变量，说明 doctor 只在自身进程内加载了 `.env`，并未让后续
Image2 owner 使用同样的 loading policy。

失败发生在 grant/provider initialization 之前，未产生 provider request、attempt、raw media 或
evidence mutation；但它使一个“已 READY”的 exact checkpoint 不能直接继续。

## 根因

`commandDoctor()` 在 `ppt_flow.mjs` 的 run-bound raw-generation branch 中显式调用
`loadDotenv(route.deck_dir)` 和 `loadDotenv(process.cwd())`，然后验证 runtime profile。Image2
authorize/generate 的实际 command path 仅从 `process.env` 读取 runtime profile，并没有对同一
deck/project `.env` 调用对应 loader。

因此 doctor 和它宣称准备好的 consumer 并不共享相同的环境来源或解析顺序。此前的 BUG-047
记录过 Style Master generate 的类似问题；本次复现证明 current Page Image raw authorization
仍存在同类 drift，且发生在正常 exact-run readiness 已通过之后。

相关路径：

- `ppt_maker_harness/scripts/ppt_flow.mjs`
  - `commandDoctor()`（run-bound raw-generation branch）
  - Image2 target authorize/generate command path
- `ppt_maker_harness/scripts/shared/image2/runtime_profile_id.mjs`
  - `resolveImage2RuntimeProfileId()` 只读取 process environment

## 复现

1. 让 deck 或 project `.env` 包含有效 `IMAGE2_API_KEY`、`IMAGE2_BASE_URL`、
   `IMAGE2_PROVIDER_PROFILE_ID`，但不要由 calling shell export 它们。
2. 对有 current selected raw plan 的 exact run 执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation
```

3. 在相同 shell 中按 doctor 给出的 exact plan/batch 执行：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs image2 authorize <run-dir> \
  --plan-hash <plan-hash> --batch-hash <batch-hash>
```

当前结果：第 2 步 READY；第 3 步因 `IMAGE2_PROVIDER_PROFILE_ID` missing/mismatch 失败。

期望行为：同一 exact-run doctor 的 raw-generation READY 必须足以让后续 Image2 authorize/generate
在不要求人工手动 export `.env` 的情况下读取同一非秘密配置来源；或者 readiness 不得宣称该
consumer READY。修复不得在 profile mismatch 时放宽 profile identity，也不得让 state、grant 或
provider work 在 readiness 不一致时继续。

## 修复关联

本轮现场登记，不修复。建议后续将 deck/project dotenv loading 收敛到 owner-shared startup
boundary，并添加 doctor READY -> exact Image2 authorize/generate 的回归测试，同时保留缺失、无效、
不匹配 profile 的 existing hard-stop。

## 修复结果

由 Change 2 `align-doctor-operation-readiness`（2026-08-16 archive）修复：

- 新增受限共享 startup loader `shared/image2/startup_env.mjs`（只读声明 keys
  `IMAGE2_API_KEY`/`IMAGE2_BASE_URL`/`IMAGE2_PROVIDER_PROFILE_ID`；shell > deck `.env` >
  cwd `.env` 补缺；无值输出）；doctor run-bound branch、`image2 authorize/generate`、
  Style Master authorize/generate、env-check 统一同源——doctor raw-generation READY 后
  exact `image2 authorize` 无需 shell export 即可解析同一非秘密配置。
- 回归：`tests_e2e/shared/workflow/test_mock_doctor_readiness_alignment.mjs` 3/3（doctor
  READY → authorize 成功；deck `.env` mismatch 仍 hard-stop 且零 provider 副作用；Style
  Master authorize 同源）。
- 评估记录：`_backlog/_done/_closed_plans/cli-diagnostic-faithful-passthrough.md`（CLS-038）。
