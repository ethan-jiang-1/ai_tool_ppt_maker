# Plan: 把剩余成本确认 gate 折进 Task Mandate（消除"问预算"打断）

> 类型: 设计 | 更新: 2026-08-16 | 状态: 待人类复核 → 走 OpenSpec（一个 active change）
> 一句话: 用户抱怨"打磨 PPT 时被反复问给不给预算"。结论：本 repo 的政策
> （Task Mandate + human-centered-gates）早就规定"别问"，但 8/10 那次落地把
> Style Master 候选授权留成了人工成本 gate；8/15 又用 `prompt_budget` 这个词制造了
> 混淆。本计划 = 把 Style Master 候选授权 + intake 成本边界折进 mandate，澄清
> `prompt_budget` 命名，一个 OpenSpec change 完成。

---

## 1. 触发问题（用户原话的翻译）

> "打磨过程中老被问给不给预算 / 给多少预算，烦死了。我关心的是 PPT 能不能出来，
> 你能花多少就花多少。能不能假定：一旦用户启动了，他就肯定有，别问了。"

这条诉求在本 repo 里已经有**成文政策**对应，叫 **Task Mandate**。问题不是缺政策，
是政策没有完整落地 + 一个撞名的技术术语制造了混淆。

## 2. 结论：本 repo 里 "budget" 是两件撞名的事

### ① `prompt_budget` —— 技术字节上限，跟钱无关（8/15 引入）

commit `f949374`（change `bind-capability-aware-image2-provider-input`）新增
`image2-provider-profile.yaml`，每个 operation 声明 `prompt_budget: { limit, unit }`
（`utf8-bytes` / `utf16-code-units` / `unicode-code-points`），外加 32,768 UTF-8 字节
安全天花板。真实含义：**发给生图 provider 的 prompt 最大字节数**，纯机器安全阀，
防止 prompt 被静默截断/损坏。它从 spec → CLI 诊断 → 测试满屏出现，所以"budget"这个词
最近无处不在。**它从来不是问要不要花钱。**

- 权威：`openspec/specs/style-master-generation/spec.md:325`「Style Master prompt
  admission uses the selected exact budget」、`openspec/specs/run-bundle-management/spec.md:257`。
- 溢出硬停：`image2_prompt_budget_overflow`（`tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs:519-527`）。

### ② 花钱授权 gate —— 这才是烦人的"给不给预算"

`ppt_maker_harness/playbook/create-deck.md` 里还有两处明确"对着成本确认授权"的人工 gate：

| 位置 | 现文案 |
|------|--------|
| `authorize-target-framed-style-master` / `authorize-target-pure-style-master` | `decisions: [authorize, revise, decline]`；Step 2 GATE "record `authorize`, `revise`, or `decline` **against that exact cost**" |
| `checkpoint-intake` | Step 1 MD "Confirm ... **remote-cost boundary** before authoring" |

## 3. 为什么"最近"冒出来（git 证据）

- **8/10 `align-task-mandate-exact-grants`**（`84b067a`、`5508f2f`）：引入 Task Mandate 到
  State，把 Page Image 的 Pilot/Expansion 授权改成"有 mandate 就不再问人"（spec 里有
  `Scenario: Mandate-covered Pilot does not create a budget gate`）。但 design.md 明确留了一句
  *"Style Master still asks for its own candidate authorization -> Keep that separate
  explicitly"*，于是 Style Master 的成本 gate 被保留。
- **8/15 `bind-capability-aware-image2-provider-input`**（`f949374`）：引入 `prompt_budget`，
  让 "budget" 这个词炸得到处都是。

## 4. 好消息：政策早就站在用户这边（只差落地）

三处权威已经写死了用户要的假定：

1. `CONTEXT.md:305-306` **Task Mandate**：一次清楚的 Work Request（"帮我做这份 PPT"）＝
   长期授权，覆盖正常范围内的 provider 工作 + 普通成本；`_Avoid_: Per-step confirmation,
   **a budget questionnaire**`。
2. `openspec/policies/human-centered-gates.md`：`confirm` gate 只用于"Task Mandate 没覆盖的、
   可逆质量/流程风险"；"not required merely because the Harness is recording ... normal cost
   for work already covered by a Task Mandate"。
3. `openspec/policies/agent-assistance-and-control.md`：*"Provider scope, cost, receipts, and
   evidence are Agent/Harness bookkeeping under the Task Mandate, **not human homework**."*
4. `openspec/specs/playbook-execution/spec.md:295-347`「Page Image Workflow gates have one
   direct recovery and review path」已经写明：active Task Mandate 覆盖 "ordinary in-scope
   provider cost"，routine exact grant 是 Agent-run guide（`Scenario: Routine exact grant
   remains Agent-run`）。**但这句话只点名了 Page Image 的 Pilot/Expansion，没覆盖 Style
   Master 候选授权** —— 这就是缺口。

**核心判断**：`create-deck.md` 里 Style Master 的 `authorize ... against that exact cost`
GATE，与上述 spec 第 302 行"ordinary in-scope provider cost 是 Agent-run guide"**已经矛盾**。
Style Master 候选生成就是 ordinary provider cost。所以这个 change 不是"加新政策"，而是
"让 playbook 与已接受的 spec/政策对齐"，风险更低。

## 5. 决策 / 方案

### D1：Style Master 候选授权 → Agent-run guide（本 change 的主体）

照搬 8/10 对 Page Image authorize 节点做过的模板
（`openspec/changes/archive/2026-08-10-align-task-mandate-exact-grants/design.md`
"Retain controller node identities but remove their human-cost decision"）：

- `authorize-target-framed-style-master` / `authorize-target-pure-style-master`：
  - 删除 `decisions: [authorize, revise, decline]`；
  - `exit` 从 `[user_decision_recorded]` 改为 `[evidence:style-master-grant-recorded]`
    （对齐 Page Image authorize 节点的 `exit: [evidence:exact-batch-grant-recorded]`）；
  - Step 2 GATE 的"against that exact cost"删掉，改成：有 mandate 时 Agent 直接
    `style-master authorize` 记录 grant，不再问人。
- **候选数（0..4）仍由 Agent 在 `plan-target-*-style-master` Step 1 选择**（现状已如此），
  只是不再让人为这个数确认成本。
- **人类视觉决定保留**在 `review-target-*-style-master`（`proceed | repair | redirect`，
  看成品好不好看）——这才是用户在意的"PPT 出不出得来"。绝不把 review 并进 authorize。
- 节点 ID 不变（`controller-manifest.json` 里的 `authorize-target-*-style-master` 保持稳定），
  避免无谓迁移压力——与 8/10 对 Page Image 节点的处理一致。

### D2：intake "remote-cost boundary" 折叠进 Work Request

`checkpoint-intake` Step 1 里的 "remote-cost boundary" 改为：只有人类**明确设了上限**
（policy 里的 "explicit human limit"）才停下确认；否则"普通成本"由 mandate 覆盖，不问。
只改 playbook 文案 + 一条 spec 场景，不新增 Controller 节点。

### D3：`prompt_budget` 完全出 scope（尊重，不碰）

`prompt_budget` 是**所选模型/route 的真实 prompt 字节上限**——机器事实，不是"花钱授权"，
是例外。本 change 完全不触碰：不重命名字段、不软化 `image2_prompt_budget_overflow` 诊断、
不加 glossary 澄清。用户明确指示"这是模型的要求，尊敬人家"。

### D4（明确不做）

- 不删 `prompt_budget` 校验、不删 32,768 字节天花板、不删 `image2_prompt_budget_overflow`
  hard-stop、不删身份/完整性/可恢复性 hard-stop；**不改 `prompt_budget` 的任何命名或文案**。
- 不把 `review-target-*-style-master` / `review-target-*-pilot` / Complete Page Review 这些
  **质量**决定自动化。
- 不引入任何 waiver/force 路径跨越 identity/integrity/authorization 边界。

## 6. 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| [去掉 Style Master 成本 gate 会让候选生成失控] | 候选数仍封顶 0..4、由 Agent 选择并披露；grant 仍是机械必需（`style-master authorize --plan-hash`）；`review` gate 仍在人手里 |
| [削弱"genuinely new consequential design direction"边界] | 视觉方向的**决定**是 `review-*-style-master`（看成品 proceed/repair/redirect），不是"授权生成 N 个候选"这个成本动作。成本归 mandate，方向归 review |
| [D3 prompt_budget 被误伤] | 已定为出 scope：不改字段名、不改诊断、不加 glossary；这是模型真实字节上限，尊重不碰 |
| [playbook YAML/decision 变更导致 node-spec 校验红] | 8/10 已证明该形状（无 `decisions` + `exit:[evidence:...]`）被 `md_controller_reader.mjs` 支持；manifest 节点 ID 不变。需跑 `tests/shared/state/test_md_controller_reader.mjs` 确认 |

## 7. 落地关联

一个 OpenSpec change：`fold-style-master-cost-into-task-mandate`。完整 proposal 草稿、delta
spec 草稿、design 决策、tasks 骨架、验证策略都在
[`proposal-sketch.md`](proposal-sketch.md)。执行 Agent 读那份 + 本文件即可开工，不依赖聊天记录。

**执行顺序**（一次只开一个 active change）：
1. `openspec new change fold-style-master-cost-into-task-mandate`
2. 按 proposal-sketch 写 proposal → delta specs → design → tasks → validate → apply → archive。
3. D3（prompt_budget）已定为出 scope，不产生任何 change 任务。

## 8. 关键引用速查（给执行 Agent）

| 主题 | 位置 |
|------|------|
| Task Mandate 定义 + 反模式 | `CONTEXT.md:305-306` |
| gate 政策（guide/confirm/hard-stop） | `openspec/policies/human-centered-gates.md` |
| Agent 控制路径政策 | `openspec/policies/agent-assistance-and-control.md` |
| 质量控制净简化政策 | `openspec/policies/simple-reliable-control.md` |
| Page Image mandate 已落地 spec | `openspec/specs/playbook-execution/spec.md:295-347` |
| Style Master authorize 成本 gate（要改） | `ppt_maker_harness/playbook/create-deck.md` `authorize-target-framed-style-master` / `authorize-target-pure-style-master` |
| intake remote-cost boundary（要改） | `ppt_maker_harness/playbook/create-deck.md` `checkpoint-intake` |
| 8/10 模板 change | `openspec/changes/archive/2026-08-10-align-task-mandate-exact-grants/` |
| 8/15 prompt_budget 引入 | `openspec/changes/archive/2026-08-15-bind-capability-aware-image2-provider-input/` |
| OpenSpec 规则（proposal/spec/design/tasks） | `openspec/config.yaml` |
| 本目录 README（plan 规约） | `_backlog/plans/README.md` |
