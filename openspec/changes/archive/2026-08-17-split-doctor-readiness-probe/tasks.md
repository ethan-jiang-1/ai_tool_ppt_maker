# Tasks: split-doctor-readiness-probe

> 排序：fence 共享 → doctor 收窄 → preflight/probe → 入口/契约 → 测试 → 同步 → 验证。

## 1. profile fence 共享（environment-check）

- [x] 1.1 `command_support.mjs` 抽 `requireExactRunImage2Profile(route, { where, operation })`（现状
  `doctor.mjs` L23–62 逐字搬：resolve profile + applyStartupEnv + requireMatchingRuntimeProfileId +
  分类 emit）。
  - 完成判据：`npm test` 绿；preflight/probe 复用同一 fence。

## 2. 三命令拆分

- [x] 2.1 `commands/doctor.mjs` 收窄为裸 `commandDoctor()`（`runNode(ENV_CHECK, [])`，移除
  runDir/operation/smoke/probeVendors 分支）。
- [x] 2.2 新 `commands/preflight.mjs`：`commandPreflight(runDir, { operation })`——op 枚举校验 +
  raw-generation/full-build 时 fence + `runNode(ENV_CHECK, ["--operation", op])`。
- [x] 2.3 新 `commands/probe.mjs`：`commandProbe(runDir, { mode })`——fence（必须）+
  `runNode(ENV_CHECK, ["--smoke"|"--probe-vendors"])`。
  - 完成判据：三命令各司其职；probe 成功仅 connectivity；profile fence 逐字保留。

## 3. inventory + 入口 + 契约（cli-surface）

- [x] 3.1 `PPT_FLOW_COMMAND_INVENTORY` +2（preflight, probe）；`COMMAND_CONTRACTS` +2 + doctor 收窄。
- [x] 3.2 入口：doctor 移除 4 个 option；新增 `preflight <run-dir> --operation` + `probe <run-dir>
  [--smoke|--vendors]`（各带契约块）；旧 doctor flag 组合 → 精确替代诊断。
  - 完成判据：`--help` 列出 16 命令；doctor 无 run-dir/operation/smoke/probe-vendors。

## 4. 测试与文档同步

- [x] 4.1 `test_process_env_check`(13)、`test_process_runtime_guidance`(6)、
  `test_mock_doctor_readiness_alignment`、`test_cli_surface`（doctor spawn）、
  `test_process_command_surface_entry_seams`/`test_process_cli_error`（inventory +2）；
  wrong/missing/pending profile 负例逐条保留。
- [x] 4.2 文档：`BOOTSTRAP.md`（doctor 三态缩成三行）、`probe-image-channels.md`(2)、
  `02-nodejs-environment.md`、`03-runtime-and-tools.md`。

## 5. 合同同步与验证

- [x] 5.1 `environment-check`/`cli-surface` delta 随本 change 提供；archive 同步。
- [x] 5.2 `npm test`、`openspec validate split-doctor-readiness-probe --strict`、`--all --strict`、
  `git diff --check` 全绿。
- [x] 5.3 clean-break：旧 doctor 三形态 active consumer 归零；runtime 负例保留；无生产数据触碰。
