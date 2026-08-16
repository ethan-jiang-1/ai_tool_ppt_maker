# Change 4: split-doctor-readiness-probe（S3）

> 阶段见 `progress.md`。吸收评审 `07` 第 4 倾向（人类已确认）:
> probe = connectivity-only 不绑 run;preflight 绑 exact run。

## 范围

| 命令 | 业务 | 现形态 |
| --- | --- | --- |
| `doctor`（收缩） | 全局离线体检,零网络零费用 | 裸 `doctor` |
| `preflight <run-dir> --operation <op>`（新） | run 级就绪,零网络零写;operation 枚举: `framed-local-refresh\|raw-generation\|full-build`（:3531） | `doctor --run-dir --operation` |
| `probe [--smoke\|--vendors]`（新） | live 探针,connectivity-only,不绑 run;不确认 profile/readiness/生产授权 | `doctor --smoke` / `doctor --probe-vendors` |

不变（搬家,语义逐字保留）: `--smoke` 1 次、`--probe-vendors` 每 vendor 1 次、两者互斥、
redirect 不重试、secret-safe、confirm 门、成功 ≠ 授权。

## 不变量（评审 07 第四节 C4）

- `doctor` 永远离线、零 provider、零费用;
- `preflight` 绑定 exact run + operation,复用现有 identity/readiness evaluator,零网络零写,
  **不成为第二个 readiness authority**;
- `probe` 的提交次数/redirect/不重试/secret-safe/「成功≠生产授权」逐项保持;
- 人类确认属于 MD Controller policy;CLI 不凭 flag 推断聊天授权。

## 同步面（~25–30 文件）

- 代码: `ppt_flow.mjs`（doctor 体 :722–773 的 run 级就绪迁入 preflight 实现;注册 :3528–3564）、
  `env-check.mjs` / `internal/env_check.mjs`（探针模式保留,入口语义重述）;
- specs: `environment-check`（**31 处,最大单点**）、`playbook-execution`(7)、
  `bootstrap-env-guidance`（review 间接提及）;
- docs: `BOOTSTRAP.md`（doctor 三态教学缩成三行）、`probe-image-channels.md`(2)、
  `02-nodejs-environment.md`、`03-runtime-and-tools.md`;
- tests: `test_process_env_check`(13)、`test_process_runtime_guidance`(6)、
  `test_mock_doctor_readiness_alignment.mjs`、`test_cli_surface`（doctor spawn）;
- 固定税见 `05` §A。

## 完成判据

1. 三命令各司其职,help 自明;preflight 语法定为位置参数 `<run-dir>`（出生即定,不留新不一致）;
2. live 域旧 doctor 三形态计数 → 0（除 tombstone/禁止句）;
3. probe 提交次数/confirm 门/secret-safe 契约测试逐字不变通过;
4. `npm test` + `openspec validate split-doctor-readiness-probe --strict` 全绿。
