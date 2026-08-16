# Proposal: split-doctor-readiness-probe

## Why

`doctor` 把三个职责混装在一个命令里：全局离线体检（零网络零费用）、exact-run/operation 就绪
（`--run-dir --operation`）、以及有网络有成本的 live provider 探针（`--run-dir --smoke/--probe-vendors`）。
这让一个命令承担三个不同 owner/成本边界的职责，且 `doctor --run-dir ... --smoke` 的 live 形态与
「doctor 是离线体检」的心智模型相矛盾。本 change 拆成三个各司其职的命令：`doctor` 纯离线、
`preflight` 绑 exact run、`probe` 绑 exact run 的 live 探针（吸收评审 07 第 4 条，二次评审 #4 修正为
probe 必须绑 run）。

## What Changes

| 命令 | 业务 | 现形态 |
| --- | --- | --- |
| `doctor`（收缩） | 全局离线体检，零网络零费用 | 裸 `doctor` |
| `preflight <run-dir> --operation <op>`（新） | run 级就绪，零网络零写；operation 枚举 `framed-local-refresh\|raw-generation\|full-build` | `doctor --run-dir --operation` |
| `probe <run-dir> [--smoke\|--vendors]`（新） | live 探针，绑 exact run | `doctor --run-dir X --smoke` / `--probe-vendors` |

- `doctor` 移除 `--run-dir`/`--operation`/`--smoke`/`--probe-vendors`（这些迁到 `preflight`/`probe`）。
- `preflight` 复用现有 identity/readiness evaluator（`env-check --operation`），零网络零写，**不成为
  第二个 readiness authority**。
- `probe` 绑 exact run，**保留 pre-POST profile fence（门槛 7 已钉死）**：先 `resolveRunAdapter` +
  `resolveImage2ProviderProfile` + `requireMatchingImage2RuntimeProfileId`，任何 profile 解析/匹配
  失败在任何 POST 前停止（现状 `doctor.mjs` L23–62 = 原 `ppt_flow.mjs:728–768`）；成功仍仅
  connectivity，不确认 readiness/生产授权。
- 不变量（搬家，语义逐字保留）：`--smoke` 1 次、`--probe-vendors` 每 vendor 1 次、两者互斥、
  redirect 不重试、secret-safe、confirm 门（Task Mandate 侧）、成功 ≠ 授权。

## 不变量（评审 07 第四节 C4）

- `doctor` 永远离线、零 provider、零费用；
- `preflight` 绑定 exact run + operation，复用现有 identity/readiness evaluator，零网络零写；
- `probe` 的提交次数/redirect/不重试/secret-safe/「成功≠生产授权」逐项保持；
  **wrong/missing/pending profile 在任何 POST 前失败的负例测试不得删除**（
  `test_process_env_check.mjs:1064–1099` 逐条保留）；
- 人类确认属于 MD Controller / Task Mandate 侧；`probe` 不新增 confirmation flag/grant/State 字段/
  聊天推断；CLI admission 只验证互斥 mode、resolved vendor count、profile fence、bounded execution。

## Capabilities

### New Capabilities

无。`preflight`/`probe` 是命令面拆分，行为由 `environment-check`（就绪/探针语义）与
`cli-surface`（命令 inventory/grammar）既有 capability 的 delta 规定。

### Modified Capabilities

- `environment-check`：MODIFIED——doctor operation registry 只含真实离线检查；exact-run readiness
  迁为 `preflight`；live probe 迁为 `probe`（保留 pre-POST profile fence + 成功仅 connectivity）。
- `cli-surface`：MODIFIED——命令 inventory 增 `preflight`/`probe`（closed audited）；`doctor` 收窄为
  离线（移除 run-dir/operation/smoke/probe-vendors）；旧 `doctor --run-dir ...` 形态返回精确替代
  诊断。

## Impact

- **Harness 源码**：`commands/doctor.mjs`（收缩为裸 doctor，移除 runDir/operation/smoke/probeVendors
  分支）、新 `commands/preflight.mjs` + `commands/probe.mjs`（复用 `env-check` + profile fence）、
  `command_result.mjs` `COMMAND_CONTRACTS`（+preflight/+probe，doctor 收窄）、入口 `ppt_flow.mjs`。
- **OpenSpec**：`environment-check`（**31 处，最大单点**）、`cli-surface` MODIFIED。
- **测试**：`test_process_env_check`(13)、`test_process_runtime_guidance`(6)、
  `test_mock_doctor_readiness_alignment`、`test_cli_surface`（doctor spawn）、
  `test_process_command_surface_entry_seams`/`test_process_cli_error`（inventory +2）。
- **文档**：`BOOTSTRAP.md`（doctor 三态教学缩成三行）、`probe-image-channels.md`(2)、
  `02-nodejs-environment.md`、`03-runtime-and-tools.md`。
- **Control owner**：JS——probe 的 profile fence + bounded execution 归 CLI；人类确认归 Task Mandate /
  MD Controller（对齐已归档 `fold-style-master-cost-into-task-mandate`）。
- **Run-bundle contract impact**：`compatible`（命令拆分 + tombstone；旧形态返回精确替代，不静默迁移）。
- **Policy 引用**：
  - `human-centered-gates.md`：probe 成功 ≠ 授权（保留）；profile fence 失败 = hard-stop（保护
    provider identity，零 POST）。
  - `agent-assistance-and-control.md`：probe 不新增 confirmation flag；人类确认归 Task Mandate；
    CLI 只验证互斥 mode/vendor count/profile fence/bounded execution。
  - `simple-reliable-control.md`：三命令各司其职，删除 doctor 的三态混装；净简化。
