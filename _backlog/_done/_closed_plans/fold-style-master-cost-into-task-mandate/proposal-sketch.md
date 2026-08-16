# OpenSpec proposal 草稿：fold-style-master-cost-into-task-mandate

> **已落地为正式 change**：`openspec/changes/fold-style-master-cost-into-task-mandate/`。
> 正式 artifacts 是权威，本草稿仅供历史参考；其中 D3（prompt_budget 命名澄清）已被用户否决——
> `prompt_budget` 是所选模型/route 的真实字节上限，完全出 scope，尊重不碰。
>
> 本文件是给执行 Agent 的**完整 proposal 思路**。写 `openspec/changes/<name>/` 时以本文件为
> 基线，按 `openspec/config.yaml` 的 rules 逐条核对，再用 `openspec validate` 校验。
> 执行 Agent 仍需读 main spec 原文（引用处均已给出行号），不要只信本文件的转述。

---

## A. 为什么（proposal.md 的 Why 部分）

用户打磨（`06-iteration`）时被反复问"给不给预算 / 给多少预算"。根因有两层：

1. **政策没落地完**：`CONTEXT.md:305` 的 Task Mandate 与
   `openspec/policies/human-centered-gates.md` 都规定"普通 in-scope 成本由 mandate 覆盖，
   Agent 不得逐次问人"；`openspec/specs/playbook-execution/spec.md:302` 也写明 mandate 覆盖
   "ordinary in-scope provider cost"。但 8/10 的 `align-task-mandate-exact-grants` 只把 Page
   Image 的 Pilot/Expansion 授权改成 Agent-run，**故意留了 Style Master 候选授权**为人工
   成本 gate（见其 design.md "keep that separate explicitly"）。`create-deck.md` 的
   `authorize-target-*-style-master` 至今仍是 `decisions: [authorize, revise, decline]` +
   "against that exact cost" 的 GATE。
2. **术语撞名**：8/15 `bind-capability-aware-image2-provider-input` 引入 `prompt_budget`
   （技术字节上限，机器事实，非钱），让 "budget" 一词在 spec/CLI/测试里到处出现，
   用户误以为是"花钱预算"。

本 change 把 Style Master 候选授权 + intake `remote-cost boundary` 折进 Task Mandate，
并澄清 `prompt_budget` 命名。不改 JS 授权机制、不改任何 hard-stop、不引入 waiver。

## B. What Changes（proposal.md 的行为变化清单）

- Style Master 候选授权（`authorize-target-framed-style-master` /
  `authorize-target-pure-style-master`）从人工 `confirm` 成本 gate 变为 mandate 覆盖的
  Agent-run `guide`：Agent 选候选数（0..4）→ `style-master plan` → `style-master authorize`
  记录 grant → 生成，全程不再问"给不给这个成本"。
- 人类对成品候选的 `proceed | repair | redirect` 视觉决定**保留**在
  `review-target-*-style-master`，不被合并/替代。
- `checkpoint-intake` 的 "remote-cost boundary" 不再单独确认：只有人类**明确设上限**才停，
  否则普通成本由 mandate 覆盖。
- 文档层澄清 `prompt_budget` 是技术字节上限而非花钱授权（`CONTEXT.md` glossary + 必要时
  软化 `image2_prompt_budget_overflow` 人话渲染）。
- **不改**：JS `style-master authorize` grant 机制、候选数上限、32,768 字节天花板、
  budget 校验、任何身份/完整性/可恢复性 hard-stop、所有质量 review gate。

## C. Modified Capabilities

> config.yaml 规则：只有 requirement-level 行为变化才列入；纯文案/测试不得伪装成 capability。

| capability | 变化 | 理由 |
|-----------|------|------|
| `playbook-execution` | MODIFIED（+1 新 requirement，可能微调 `checkpoint-intake` 相关场景） | Controller 节点行为 + 人工 gate 归属变化，由 playbook 与 Controller spec 拥有 |
| （可选）`commands-reference` | MODIFIED（`spec.md:221` "meaningful human confirmation/cost boundary" 措辞） | 新手表里"成本边界"的澄清口径；若影响面想收紧可拆出 |
| （可选）`harness-charter` | MODIFIED（charter 里若有"候选授权需人工确认"的旧口径则对齐） | 仅当 grep 到冲突文案时 |

**不新建 capability**；`style-master-generation` 的 JS spec 无需改——它的 "explicit exact-plan
authorization SHALL create or exact-match one immutable grant"（`spec.md:62`）指的是显式
`authorize` CLI 命令（机器授权），不是"人类确认"，与本次 Controller 层改动不冲突。

## D. Delta spec 草稿（playbook-execution）

在 `openspec/specs/playbook-execution/spec.md` 的 Requirements 下**新增**一条（不要改写
现有 "Page Image Workflow gates..." 那条，它的 scope 是 Page Image）：

```markdown
### Requirement: Style Master candidate authorization is Agent-run under the Task Mandate

The create-deck Style Master authorize nodes
(`authorize-target-framed-style-master`, `authorize-target-pure-style-master`) SHALL be
completed by the matching state-owned `cli` evidence from an exact style-master grant, the
same way the Page Image Pilot and Expansion authorize nodes are. An active Task Mandate
covers the ordinary provider cost of a disclosed candidate count (at most 4, chosen by the
Agent), so the Agent SHALL choose the count, publish the candidate plan, and record the exact
grant without asking the human to re-confirm that cost. The human visual decision on the
generated candidates remains the `review-target-*-style-master` `proceed | repair | redirect`
gate; it SHALL not be merged into, or replaced by, the authorization step, and neither
decision authorizes Page Image raw work. A different Deck or goal, an explicit human limit, or
a genuinely new consequential content or design direction still asks one bounded question
before a replacement scope is established.

#### Scenario: Style Master candidate cost is not a repeated human question
- **WHEN** a current create-deck route needs generated Style Master candidates and an active
  Task Mandate covers the ordinary cost
- **THEN** the Agent records the exact grant and proceeds to generation without asking the
  human to authorize the disclosed cost
- **AND** the human still receives the generated candidates under one
  `proceed | repair | redirect` review decision

#### Scenario: Style Master review stays a visual decision
- **WHEN** generated Style Master candidates are presented for review
- **THEN** the Controller records `proceed`, `repair`, or `redirect` as the visual-direction
  decision
- **AND** it does not treat that decision as a grant, Page Image raw authorization, or
  complete-page acceptance
```

> 注意：`md_controller_reader.mjs` 读的是 playbook 里每个 node 的 YAML block，spec 是
> requirement 权威。新增 requirement 后，`create-deck.md` 的两个 authorize node 的
> `decisions`/`exit`/GATE 文案必须与上面一致（见 E）。

`checkpoint-intake` 相关：若现有 `Create-deck authoring starts with narrative source before
page source`（`spec.md:466`）或其它 requirement 没覆盖 intake，可加一条场景：

```markdown
#### Scenario: Ordinary cost needs no separate boundary confirmation
- **WHEN** a new-deck Work Request establishes the Task Mandate without an explicit human
  spending limit
- **THEN** the Controller proceeds through ordinary in-scope provider cost without a separate
  remote-cost confirmation
- **AND** it stops only when the human states an explicit limit or the goal changes
```

## E. Design 决策（design.md 要点）

### E1 照搬 8/10 的节点形态（不新增节点、ID 不变）

Page Image authorize 节点在 8/10 后的形态是：

```yaml
### authorize-target-framed-pilot
...
entry: []
exit: [evidence:exact-batch-grant-recorded]   # 无 decisions 字段
```

Style Master authorize 节点改成同形：

```yaml
### authorize-target-framed-style-master
method_module: 02-visual-system
production_workflows: [framed]
draft_route: true
requires: [plan-target-framed-style-master]
produces: [target-framed-style-master-candidate-authorization]
entry: []
exit: [evidence:style-master-grant-recorded]   # 由 [user_decision_recorded] 改来；decisions 删除
```

Step 文案从「Step 2 — GATE: record authorize/revise/decline against that exact cost」改为
「Step 1 — CLI: Run `ppt_flow style-master authorize <run-dir> --plan-hash <sha256>` and
retain the one grant digest」（对齐 Page Image authorize 节点的 Step 1）。

`generate-target-*-style-master` 的 `entry: [node_decision:authorize-target-*-style-master:authorize]`
要改成 `entry: [node_evidence:authorize-target-*-style-master:style-master-grant-recorded]`
（对齐 Page Image generate 节点的 `entry: [node_evidence:...:exact-batch-grant-recorded]`）。

### E2 归属边界（谁拥有什么）

- **MD/Agent**：选候选数、判定"当前 Work Request 是否还覆盖本次打磨"、执行
  `plan → authorize → generate` 机械序列、把 `proceed/repair/redirect` 作为唯一视觉决定抛给人。
- **JS/CLI**：grant 的 CAS 幂等、plan/batch/grant digest 绑定、诊断。**不变**。
- **人类**：`review-target-*-style-master` 的视觉方向决定；显式成本上限（如果有）。

### E3 政策对齐（config.yaml 强制，必须在 design 里点名）

- `human-centered-gates.md`：Style Master authorize 从 `confirm` → `guide`（mandate 覆盖的
  普通成本）；`review-*-style-master` 保持 `confirm`；身份/完整性/stale-plan/budget-overflow
  保持 `hard-stop`（protect 授权完整性）。
- `agent-assistance-and-control.md`：直接 authority = State Task Mandate + style-master
  grant 记录；不新增第二 controller/authority；"Provider scope, cost, receipts ... not
  human homework"。
- `simple-reliable-control.md`：净简化 = 删除一个重复成本确认分支、不加 retry/fallback/平行
  成功存储（与 8/10 design 的表述一致）。

### E4 验证策略

- **unit/integration**：`tests/shared/state/test_md_controller_reader.mjs` 确认新节点形态
  （无 `decisions` + `exit:[evidence:...]`）被 reader 接受、`entry` 用 `node_evidence` 合法。
  现有 `test_process_style_master_cli.mjs` / `test_process_style_master_lifecycle_integration.mjs`
  已经走 `style-master authorize`（机器授权），**无需改**——它们不模拟"人确认"。
- **controller/CLI**：若存在断言 Style Master authorize 节点 `decisions:[authorize,revise,
  decline]` 或 `exit:[user_decision_recorded]` 的测试（执行时 grep `authorize-target-*-style-master`
  + `revise`/`decline`/`user_decision_recorded`），改断言为新形态。
- **e2e**：`tests_e2e/shared/workflow/test_mock_target_workflow_journey.mjs` 已有 mock target
  流程（含 Style Master + Pilot + budget failure），扩展/确认一条"Style Master authorize
  在 mandate 下无人类成本诊断"的路径。
- **验证命令**：`openspec validate fold-style-master-cost-into-task-mandate --strict` +
  `npm test`。

## F. Tasks 骨架（tasks.md）

按依赖顺序，每条带 capability 标注 + 完成判据：

1. [playbook-execution] 读 `openspec/specs/playbook-execution/spec.md` 全文 + 本文件，
   新增 D 的 requirement + 场景；`openspec validate` 通过。
2. [playbook-execution] 改 `ppt_maker_harness/playbook/create-deck.md` 两个 Style Master
   authorize 节点（E1 形态）+ generate 节点 `entry` + Step 文案；改 `checkpoint-intake`
   Step 1 文案（D2）；同步 `review-*-style-master` 文案确保"视觉决定，非授权"口径。
3. [node-specification 校验] 跑 `tests/shared/state/test_md_controller_reader.mjs` +
   相关 controller 校验；确认 `controller-manifest.json` 节点 ID 不变、reader 接受新形态。
   若 node-specification spec 或 `charter/NODE-SPEC.md` 有 "authorize node 必带 decisions"
   的断言，则同步（先读 `openspec/specs/node-specification/spec.md`）。
4. [（可选）commands-reference / harness-charter] grep 是否存在"候选授权需人工确认成本"旧
   口径，有则对齐；`spec.md:221` 措辞澄清。
5. [cli-surface 措辞（可选，D3）] 读 `openspec/specs/cli-surface/spec.md` + human renderer，
   确认 `image2_prompt_budget_overflow` 人话渲染不读成"预算不够"；如需改，走 cli-surface
   规则（不扩 envelope schema）。
6. [docs] `CONTEXT.md` glossary 加一条：prompt budget（技术字节上限）vs cost mandate（花钱
   授权）；不重命名字段。
7. [tests] 按 E4 补/改断言；跑 `npm test` + `openspec validate --strict`。
8. [archive] `openspec archive`，按 `_backlog/plans/README.md` 流程把本 plan 移入
   `_done/_closed_plans/`。

## G. 明确不做（防止执行 Agent 跑偏）

- 不重命名 `prompt_budget` 字段 / 不改 `image2-provider-profile.yaml` schema（= BREAKING
  migration，非本 change 目标）。
- 不自动化 `review-target-*-style-master` / `review-target-*-pilot` / Complete Page Review
  / `review-target-*-delivery` 这些**质量/视觉**决定。
- 不动 `abandon-target-*-style-master` 的 "unknown submitted candidate → 取一个人类 reason"
  分支（那是 identity/recoverability，不是成本）。
- 不删任何 hard-stop、不加 waiver/force、不加 retry/fallback。
- 不把 `prompt_budget` 的溢出硬停（`image2_prompt_budget_overflow`）降级为 guide——它保护的
  是"已授权字节与所选 route 能力一致"这个不变量，不是钱。
