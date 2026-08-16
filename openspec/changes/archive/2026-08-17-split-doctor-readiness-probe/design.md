# Design: split-doctor-readiness-probe

## 决策概览

| 决策 | 结论 | 拥有侧 |
|---|---|---|
| doctor 收窄 | `commands/doctor.mjs` 只保留裸 `doctor`（无 runDir/operation/smoke/probeVendors），委托 `runNode(ENV_CHECK)` 无参 | JS |
| preflight | 新 `commands/preflight.mjs`：`resolveRunAdapter` → profile fence（raw-generation/full-build 需要）+ `runNode(ENV_CHECK, ["--operation", op])` | JS |
| probe | 新 `commands/probe.mjs`：`resolveRunAdapter` → profile fence（必须）+ `runNode(ENV_CHECK, ["--smoke"\|"--probe-vendors"])` | JS |
| profile fence | 抽出共享 `resolveImage2ProviderProfile` + `applyImage2StartupEnv` + `requireMatchingImage2RuntimeProfileId` 的 fence（现状 `doctor.mjs` L23–62 逐字搬），preflight/probe 复用 | JS |
| 成功语义 | probe 成功仅 connectivity，不确认 readiness/授权（`env-check` 语义不变） | JS |
| inventory | `PPT_FLOW_COMMAND_INVENTORY` +2（preflight, probe）；`COMMAND_CONTRACTS` +2 + doctor 收窄 | JS |

## 1. profile fence 复用

把 `doctor.mjs` 的 fence（L23–62：resolve profile → applyStartupEnv → requireMatchingRuntimeProfileId
→ catch 分类）抽出为 `command_support.mjs` 的共享函数 `requireExactRunImage2Profile(route, { where, operation })`
（返回 null 或 emitCliError 后返回失败标记）。preflight（raw-generation/full-build）与 probe
（smoke/probe-vendors）都调用它，逐字保留现状 fence 语义。

## 2. 三命令

- `doctor`：裸命令，`commandDoctor()` 直接 `runNode(ENV_CHECK, [])`（无参 env-check）。
- `preflight <run-dir> --operation <op>`：`resolveRunAdapter` → op 枚举校验 →（raw-generation/full-build
  时）fence → `runNode(ENV_CHECK, ["--operation", op])`。
- `probe <run-dir> [--smoke|--vendors]`：`resolveRunAdapter` → fence（必须）→
  `runNode(ENV_CHECK, ["--smoke"|"--probe-vendors"])`；smoke/vendors 互斥在入口 action 校验。

## 3. 入口 + 契约

- 入口 `doctor` 注册移除 `--run-dir`/`--operation`/`--smoke`/`--probe-vendors`；新增 `preflight` +
  `probe` 注册（各带 Machine contract 块）。
- `COMMAND_CONTRACTS.doctor` stdout 改为 "offline readiness report"（去掉 optional Image2）；新增
  `preflight`/`probe` 契约。
- 旧 `doctor --run-dir X --operation op` → 精确 `preflight` 替代；`doctor --run-dir X --smoke` →
  精确 `probe` 替代（入口 action 检测旧 flag 组合，emitUsage 精确替代）。

## 4. 验证策略

- **unit**：profile fence 共享函数（resolve/mismatch/missing/pending 分路）；
- **integration**：`test_process_env_check` 13 处（doctor/preflight/probe 三命令分流 +
  wrong/missing/pending profile 负例逐条保留）；`test_process_runtime_guidance` 6 处；
  `test_mock_doctor_readiness_alignment`；
- **负例**：旧 `doctor --run-dir ...` 形态 → 精确替代诊断（三分验收）；
- **回归**：`npm test`（core + 审计）、`openspec validate --strict` + `--all --strict`、`git diff --check`。
