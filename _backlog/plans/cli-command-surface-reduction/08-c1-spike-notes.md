# C1 前置 spike 结论（2026-08-17）

> 门槛 8 要求的两个 spike，为 C1 proposal 消险。结论已并入 C1 proposal，此处留档。

## Spike 1 — 结构化结果模型 + text/JSON 双 renderer

原型见 `.pptsplit/spikes/spike1_result_model.mjs`。结论：

- 单个 owner result（`schema/version/operation/state/effect/projection`）能区分
  success / partial-effect / no-op / failure 四态。
- text 与 JSON 是两个 renderer，消费同一 owner result，**不拥有业务事实**——改一个事实字段，
  两个 renderer 同步变化（已验证）。
- partial-effect 态（delivery 完成 + projection 失败）可干净表达为「两个分列 effect」，
  与门槛 3 冻结契约一致。

## Spike 2 — commander 能否从 descriptor 生成 help + grammar

原型见 `.pptsplit/spikes/spike2_descriptor.mjs`。结论（commander 13.1.0）：

- **能**从 descriptor（name/description/arguments/options）转 `.command()/.argument()/.option()`
  生成完整 help（已验证）。
- `Argument.choices()` 存在——operation 枚举可声明并由 commander 校验。
- **不能**内建互斥（`--smoke` XOR `--probe-vendors`）、跨参约束（`--operation` requires
  `--run-dir`）——需自写一个小 grammar validator 读 descriptor。
- **结论：无需自建 registry，无需升级人类决策**；descriptor = 单一事实源（help + choices +
  枚举），外加一个读 descriptor 的 exact-grammar 校验（对应 `05` §E.3，C1 落地）。

## 门槛 3 — 跨 change 冻结（projection effect 边界）

已冻结（`01` §1.5 + 二次评审 #2 + 独立评审 B1）：

- C1 的 `build`/`image2` owner result 保留**现状两个 effect**（delivery + projection 分列），
  projection 为独立、可版本化字段；
- C1 **不改** `build`/`image2` 退出路径与 exit 语义（interim 契约 = delivery 成功 + projection
  失败 → exit 1 + partial-effect 报告）；
- 此契约不依赖 C3 落地；C3 候选 A（若重启）按已记录方向把 projection 从 owner result 版本化删除。
