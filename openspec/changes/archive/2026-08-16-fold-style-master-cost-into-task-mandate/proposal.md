## Why

打磨（`06-iteration`）时用户被反复问"给不给预算 / 给多少预算"，打断 PPT 生产。根因不是缺政策：`CONTEXT.md` 的 Task Mandate 与 `openspec/policies/human-centered-gates.md` 早已规定"普通 in-scope 成本由一次 Work Request 建立的 mandate 覆盖，Agent 不得逐次问人"。根因是两处残留没有落地——8/10 的 `align-task-mandate-exact-grants` 只把 Page Image 的 Pilot/Expansion 授权改为 Agent-run，**故意留了 Style Master 候选授权**为人工成本 gate；`checkpoint-intake` 还单独确认 "remote-cost boundary"。

## What Changes

- Style Master 候选授权（`authorize-target-framed-style-master` / `authorize-target-pure-style-master`）从人工 `confirm` 成本 gate 变为 Task Mandate 覆盖的 Agent-run `guide`：Agent 选候选数（0..4）→ `style-master plan` → `style-master authorize`。`style-master authorize` 成功后由一个 state-owned CLI handoff 校验 plan+grant 事实、记录 typed `cli` 证据并完成稳定 authorize 节点（镜像 Page Image 的 `recordTargetProgressiveAuthorizeCliHandoff`），不再问"给不给这个成本"。
- 人类对成品候选的 `proceed | repair | redirect` 视觉决定保留在 `review-target-*-style-master`，不被合并或替代。
- `checkpoint-intake` 的 "remote-cost boundary" 不再单独确认：只有人类明确设上限（policy 里的 "explicit human limit"）才停下，否则普通成本由 mandate 覆盖。
- **不改**：JS `style-master authorize` grant 机制、候选数上限、32,768 字节天花板、`prompt_budget` 校验、任何身份/完整性/可恢复性 hard-stop、所有质量 review gate。`prompt_budget` 是所选模型/route 的真实 prompt 字节上限（机器事实，非花钱授权），本 change 完全不触碰、不重命名、不软化其诊断。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `playbook-execution`: 新增 requirement——create-deck 的 Style Master 候选授权与 intake 成本边界由 Task Mandate 覆盖，是 Agent-run guide，不是重复的人工成本确认。

> `node-specification` / `style-master-generation` / `cli-surface` 的 spec 不改：state.mjs 的查询/操纵函数清单不是封闭枚举，新增的 Style Master authorize handoff 是 `playbook-execution` 该 requirement 的实现（复用既有 `setNodeEvidence`/节点完成机制），不是新的 State schema 或 diagnostic 边界；`style-master authorize` 的 grant 机制不变。

## Impact

- **Harness 源码范围**：`ppt_maker_harness/playbook/create-deck.md`（两个 Style Master authorize 节点 + generate 节点 entry + `checkpoint-intake` Step 1 文案）、`ppt_maker_harness/scripts/shared/state/state.mjs`（新增 Style Master authorize CLI handoff + 证据 key）、`ppt_maker_harness/scripts/ppt_flow.mjs`（`style-master authorize` 路由接线）、`openspec/specs/playbook-execution/spec.md`、`tests/shared/state/` 与 `tests_e2e/shared/workflow/`（断言同步）。
- **Control owner**：MD/Agent 拥有候选数选择与机械序列执行；JS/CLI 的 grant 机制与诊断不变；人类保留 `review-target-*-style-master` 视觉决定与显式成本上限。
- **run-bundle contract impact**：`none`（不改 run bundle schema、不改 State、不改 `image2-provider-profile.yaml`、不迁移任何 `deck_*`）。
- **政策引用**（gate 变更，config 强制）：`openspec/policies/human-centered-gates.md`（Style Master authorize `confirm`→`guide`；review 保持 `confirm`；hard-stop 保持）、`openspec/policies/agent-assistance-and-control.md`（直接 authority = State Task Mandate + style-master grant；成本是 Agent bookkeeping 不是 human homework）、`openspec/policies/simple-reliable-control.md`（净简化 = 删一个重复成本确认分支，不加 retry/fallback/平行成功存储）。
