# Change 3: split-doctor-readiness-probe（S3）

> 对应 `cli-command-split-design.md` S3。建议 openspec change 名: `split-doctor-readiness-probe`。
> 三个拆分中最大单点（environment-check spec 31 处提及）,独立成 change。
> **无兼容模式**: `doctor` 的三个旧形态直接消失,tombstone 硬拒绝。

## 范围

| 新/改 | 业务 | 现形态 |
| --- | --- | --- |
| `doctor`（收缩） | 全局离线环境体检（node/npm/字体/磁盘/git…）,零网络、零费用 | 裸 `doctor` |
| `preflight <run-dir> --operation <op>`（新） | run 级 provider/操作就绪（binding + provider profile + IMAGE2_PROVIDER_PROFILE_ID 匹配）,不进网络 | `doctor --run-dir X --operation Y` |
| `probe [--smoke\|--vendors]`（新） | live 网络探针（付费、必须 confirm 门）,名字自带付费语义 | `doctor --smoke` / `doctor --probe-vendors` |

**不变**（全部只是搬家,语义逐字保留）: `--smoke` 1 次提交、`--probe-vendors` 每 vendor 1 次、
两者互斥、redirect 不重试、secret-safe、probe 成功 ≠ 生产授权、confirm 门条款。

## 同步面（~25–30 文件）

- **代码**: `ppt_flow.mjs`（doctor 体 :722–773——run 级就绪的内联逻辑迁入 preflight 实现;
  注册 :3528–3564 重构为 3 个命令）;`scripts/00-setup/env-check.mjs`(3) +
  `internal/env_check.mjs`(12)（探针模式不变,入口语义重述）
- **spec**: `openspec/specs/environment-check/spec.md`（**31 处,最大单点**: `--smoke`/
  `--probe-vendors` 条款、doctor 统一入口条款、"direct env-check 仅 pre-install/recovery"
  边界重述——doctor 收缩为纯体检后该边界反而更清晰）;
  `openspec/specs/playbook-execution/spec.md`(7,probe-image-channels 条款);
  `openspec/specs/bootstrap-env-guidance/spec.md`（review 间接提及）
- **文档**: `BOOTSTRAP.md`(1,doctor 三态教学缩成三行) / `playbook/probe-image-channels.md`(2) /
  `workflow/00-setup/02-nodejs-environment.md`(1) / `workflow/00-setup/03-runtime-and-tools.md`(1)
- **测试**: `tests/00-setup/test_process_env_check.mjs`(13) /
  `test_process_runtime_guidance.mjs`(6) / `test_cli_surface.mjs`(doctor spawn)
- **固定税**: 同 `04` §A（`preflight`/`probe` 两个新命令共享一次固定税）

## 风险 / 取舍

- [environment-check spec 31 处改写量大] → 条款按 mode 分块改写: `--smoke`/`--probe-vendors`
  条款整体归入 probe 命令节,不逐条重写语义（语义不变,只搬归属）;
- [付费语义与 confirm 门] → 搬移不动 `human-centered-gates` 条款;probe 的 confirm 门逐字保留;
- [命名] → 已确认（2026-08-16,人类确认）: `preflight` / `probe`。
- [run 级就绪逻辑内联在 ppt_flow.mjs] → 本 change 顺手把它迁入独立 owner 模块
  （preflight 实现),不再加深 adapter 渗漏——与 findings-I 的教训一致。

## 完成判据

1. `doctor`/`preflight`/`probe` 三命令各司其职,`--help` 各自自明;
2. live 域 `doctor --run-dir|--smoke|--probe-vendors` 计数 → 0（除 tombstone/禁止句）;
3. probe 的提交次数/confirm 门/secret-safe 契约测试逐字不变地通过;
4. `npm test` + `openspec validate --strict` 全绿。
