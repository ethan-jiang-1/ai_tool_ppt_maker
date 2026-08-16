# Change 4: split-doctor-readiness-probe（S3）

> 阶段见 `progress.md`。二次评审 #4 已修正第一轮倾向（评审自我更正）:
> **`probe` 必须绑 exact run**,保留 pre-POST profile fence——不绑 run 会删除现有
> identity/integrity guard,不是「语义逐字保留」。preflight 绑 exact run。
> 本 change 在 **C0 拆分后**的模块布局上执行（见 `00`）;文中的 `ppt_flow.mjs` 行号以
> C0 前基线（HEAD `5571002`）为准,C0 落地后按新模块定位。

## 范围

| 命令 | 业务 | 现形态 |
| --- | --- | --- |
| `doctor`（收缩） | 全局离线体检,零网络零费用 | 裸 `doctor` |
| `preflight <run-dir> --operation <op>`（新） | run 级就绪,零网络零写;operation 枚举: `framed-local-refresh\|raw-generation\|full-build`（:3531） | `doctor --run-dir --operation` |
| `probe <run-dir> [--smoke\|--vendors]`（新） | live 探针,**绑 exact run**: 先解析该 run 的 confirmed provider profile 并要求 `IMAGE2_PROVIDER_PROFILE_ID` 精确匹配,任何 POST 前失败即停（`ppt_flow.mjs:728–768`、`environment-check/spec.md:501–532`）;成功仍仅 connectivity,不确认 readiness/生产授权 | `doctor --run-dir X --smoke` / `doctor --run-dir X --probe-vendors` |

不变（搬家,语义逐字保留）: `--smoke` 1 次、`--probe-vendors` 每 vendor 1 次、两者互斥、
redirect 不重试、secret-safe、confirm 门、成功 ≠ 授权。

## 不变量（评审 07 第四节 C4）

- `doctor` 永远离线、零 provider、零费用;
- `preflight` 绑定 exact run + operation,复用现有 identity/readiness evaluator,零网络零写,
  **不成为第二个 readiness authority**;
- `probe` 的提交次数/redirect/不重试/secret-safe/「成功≠生产授权」逐项保持;
  **wrong/missing/pending profile 在任何 POST 前失败的负例测试不得删除**
  （`test_process_env_check.mjs:1064–1099` 逐条保留）;
- 人类确认属于 MD Controller / Task Mandate 侧（对齐已归档
  `fold-style-master-cost-into-task-mandate`）: `probe` **不新增** confirmation flag、grant、
  State 字段或聊天推断;CLI admission 只验证互斥 mode、resolved vendor count、
  profile fence、bounded execution;直接人类调用的成本提示属于 help/handoff,
  不伪装成 runtime authorization。

## 同步面（~25–30 文件）

- 代码（C0 后布局）: `commands/doctor.mjs`（收缩,doctor 体 :722–773 的 run 级就绪迁出）、
  新 `commands/preflight.mjs` + `commands/probe.mjs`（委托现有 readiness evaluator,
  run 级就绪逻辑迁入 preflight 实现）;`env-check.mjs` / `internal/env_check.mjs`
  （探针模式保留,入口语义重述）;
- specs: `environment-check`（**31 处,最大单点**）、`playbook-execution`(7)、
  `bootstrap-env-guidance`（review 间接提及）;
- docs: `BOOTSTRAP.md`（doctor 三态教学缩成三行）、`probe-image-channels.md`(2)、
  `02-nodejs-environment.md`、`03-runtime-and-tools.md`;
- tests: `test_process_env_check`(13)、`test_process_runtime_guidance`(6)、
  `test_mock_doctor_readiness_alignment.mjs`、`test_cli_surface`（doctor spawn）;
- 固定税见 `05` §A。

## 完成判据

1. 三命令各司其职,help 自明;preflight 语法定为位置参数 `<run-dir>`（出生即定,不留新不一致）;
   `probe` 语法为 `<run-dir>` 位置参数 + 互斥 mode（二次评审 #4）;
2. live 域旧 doctor 三形态计数 → 0（按 `05` §E 的三分验收,除 tombstone/禁止句/负例测试）;
3. probe 提交次数/confirm 门/secret-safe/profile fence 契约测试逐字不变通过,
   含 wrong/missing/pending profile 的 POST 前失败负例;
4. `npm test` + `openspec validate split-doctor-readiness-probe --strict` 全绿。
