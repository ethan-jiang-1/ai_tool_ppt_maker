## 1. CLI — where-am-I 卡 + approve 双写

- [x] 1.1 `state.mjs`：实现 `buildResumeCard(state, statusSnapshot?)`（字段与启发式见 design D3）；`healState` round-trip 保留 node 上 `waiting_for`/`note`
- [x] 1.2 `ppt_flow state`：用 `deckRoot(resolve(runDir))`；人读打印 Waiting/Summary/Next；`--json` 顶层带 `workflow_summary` + `suggested_next`
- [x] 1.3 `ppt_flow status`：人读 Playbook/Current；`--json` 含 `playbook`/`current_node`；可复用 `buildResumeCard` 打 Summary
- [x] 1.4 `ppt_flow approve`：双写 metadata + `_state.gates`；可选 `appendHistory`
- [x] 1.5 测试：卡字段非空；`waiting_for` → `suggested_next`/`workflow_summary`；approve 双写；命令数 12；heal 不丢 `waiting_for`

## 2. Schema / NODE-SPEC

- [x] 2.1 `NODE-SPEC` 示例补 `waiting_for`/`note`；`STATE_YAML_HEADER` / `STATE_DIR_README`：字段列表 +「断线后先 ppt_flow state（整流程位置）」
- [x] 2.2 单测：heal round-trip 保留 `nodes.*.waiting_for`

## 3. Docs — 小白整流程续跑

- [x] 3.1 `COMMANDS.md`：节 **续跑 / 做到哪了**（说法见 design D5）+ **改写** Agent 路由逻辑（删「一律从第一个 node 开始」）
- [x] 3.2 `BOOTSTRAP.md`：已有 deck / 断线回来 → state+status 人话汇报，再 intake
- [x] 3.3 `AGENT_CONTRACT.md` §1：进度 = 盘上 `_state` + 产物；不信赖聊天；写盘纪律
- [x] 3.4 `template-deck-guide.md`（及 init 同源文案若需要）：清上下文 → `ppt_flow state`

## 4. Playbook 写盘注记（控制范围）

- [x] 4.1 `create-deck.md`、`iterate-style.md`：进出节点 `writeState`；等人写 `waiting_for`（一句即可，不扩 scope）

## 5. Regression + 小白场景冒烟

- [x] 5.1 `npm test` 绿
- [x] 5.2 手动：只给 `deck_ai_sdlc_keynote` → `state --json` 满足 design D6（iterate-style / review-gate / waiting token）；`approve` 后门闩一致（若测双写可用临时 copy，勿弄脏金甲板意图时可 `--waive` 后再对齐回 waived）
