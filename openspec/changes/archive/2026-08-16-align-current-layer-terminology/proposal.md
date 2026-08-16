# Proposal: Align current-layer terminology

## Why

术语权威（`CONTEXT.md` 的 `_Avoid_` 表）与当前层 spec/文档的散文打架：退役词
`protected geometry`/`protected zone` 回流 18 个文件（spec 8 = M-1 七文件 + M-2 新增
image-production；文档 10），
`protected_geometry` 是已退役字段而 `protected_composition`/`Reserved Header Region`/
`Provider Avoidance Constraint` 才是现行规范词（`CONTEXT.md:202-221`）；retired `mode`
概念（`durable mode`/`source-mode pair`/`infer mode`/环境检查的 `Base mode`/`Image2 mode`
组织轴）仍在多个 spec 当现行用；文档还有陈旧路径（`workflow/00-setup/README.md` 指向
不存在的 `../charter/`）、退役恢复动词（`export`）与退役文件名（
`04-validate-page-authority-visual-system.md`）；`Complete Page Review` 在
`image-production` 与 `image-generation` 各定义一遍。Agent 读权威时会走到旧名、旧概念或
不存在的路径。本 change 是 `current-layer-legacy-trace-audit`（`_backlog/plans/`）Progress
Tracker 的 Change 1（Wave 1+4 合并），按串行纪律启动；CLS-038 已吸收 H-1/H-2/M-4 等，
本 change 处理剩余术语/散文面。

## What Changes

- **M-1 术语统一**：`protected geometry`/`protected-geometry` 散文 → `protected composition`
  （spec 7 文件 + 文档 10 文件）。
- **M-2 旧名修正**：`protected zone`/`protected-zone` → `Reserved Header Region`（指本地空间）或
  `Provider Avoidance Constraint`（指 provider 指令）（3 spec）；`CONTEXT.md:218-221` 的
  "still uses" 反向过期声明改为"曾用旧名，现已不再使用；仅历史文档可见"。
- **M-3 retired mode 清除**：node-specification 的 `durable mode`/`source-mode pair`/`infer mode`
  等 → `selected workflow`/`source/workflow pair`/`durable workflow`/`production_identity`；
  playbook-execution 2 处；environment-check 的 `Base mode`/`Image2 mode` 组织轴（含
  `Image2 readiness` 的 "Base and Framed-local modes"）→ 以 `--operation`/检查范围表述
  （只改散文，不改变检查行为）。
- **M-8 文档陈旧路径/退役词**：`workflow/00-setup/README.md` 相对路径改
  `../../charter/`、`../../reference/`；`glossary.md:59` "export action" →
  `` `repair-current-protocol-identity` ``；退役文件名
  `04-validate-page-authority-visual-system.md` 重命名并更新引用。
- **M-9 双重定义收敛**：`Complete Page Review` 以 `image-production` 为单一 owner，
  `image-generation` 引用（不复制定义）；`workflow-inspection` vs `visual-config` 的同一
  refresh 条件措辞随 M-1 统一。
- **L-2 文档低危**：`scripts/README.md` 悬空句、`CLAUDE.md` 退役三步名（→ Step 0-4）、
  `docs/adr/0001` 标 Superseded。
  **豁免（记录理由）**：node-specification 场景中的示例 node 名 `authoring-slides`/`seed-topics`
  （L-2#4 / M-4 附带）不改——它们是 scenario 示意，无行为影响，改写需 restate 多个大
  requirement，收益低于成本；保留在 audit 记录中待后续专项。

无 **BREAKING**：只改散文/文档措辞与文件名；机器序列化字段
`header_region`/`protected_composition`/`reserved_header`/`body_safe` 一字不动
（CONTEXT.md:202-209 明示它们不是术语别名）；无命令/flag/行为变化。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `node-specification`: retired `mode` 概念措辞 → selected workflow / production_identity；
  示例 node 名不改（豁免，见上）。
- `harness-charter`: `protected zone`/`protected-geometry` → 规范词。
- `image-production`: `protected-zone` → 规范词；`Complete Page Review` 成为单一 owner 定义。
- `image-generation`: `protected geometry` → `protected composition`；`Complete Page Review`
  改为引用 `image-production` 定义。
- `visual-config`: `protected geometry`/`protected zone` → 规范词。
- `workflow-inspection`: `protected geometry` → 规范词（与 visual-config 措辞统一）。
- `pipeline-orchestration`: `protected geometry` → `protected composition`。
- `playbook-execution`: `protected geometry` → 规范词；`mode` 措辞 2 处。
- `cli-surface`: `protected geometry` → `protected composition`。
- `environment-check`: `Base mode`/`Image2 mode` 组织轴 → `--operation`/检查范围表述
  （4 处 MODIFIED，场景标题保留原名）。

（文档、`CONTEXT.md`、文件名重命名随 change 的 Impact 落地，不新增 capability。）

## Impact

- **Harness 源码/文档**：`ppt_maker_harness/` 下 charter/reference/workflow/playbook 文档、
  `scripts/README.md`、`CLAUDE.md`、`workflow/02-visual-system/04-validate-page-authority-visual-system.md`
  （重命名）、`CONTEXT.md`（repo 根术语权威）。
- **OpenSpec**：main specs 10 个（上述 Modified，全部 MODIFIED delta）。
- **测试**：grep 类断言（`protected geometry/zone` 清零、`mode` 退役短语清零、退役文件名不再
  出现）；`test_diagnostic_recovery_handoff.mjs` 等既有 consumer 测试回归；不改行为面。
- **Control owner**：MD⇔JS protocol 不涉及（纯措辞）；JS 侧无行为变化。
- **Run-bundle contract impact**：`none`。
- **Policy 引用**：本 change 不涉及 gate/readiness/diagnostic 行为变化（纯术语/文档对齐），
  无需新增 gate/control 语义；`simple-reliable-control.md` 的"净简化"体现在：统一术语消除
  新旧并存的第二表述，不新增任何控制层。
