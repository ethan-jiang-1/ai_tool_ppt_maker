## 1. CLI — where-am-I 卡 + approve 双写

- [ ] 1.1 `state.mjs`：`buildResumeCard(state, statusSnapshot?)` → playbook 断点 + `workflow_summary` + `suggested_next`；heal 保留 `waiting_for`/`note`
- [ ] 1.2 `ppt_flow state`：`deckRoot(resolve(runDir))`；人读 + `--json` 输出完整卡
- [ ] 1.3 `ppt_flow status`：Playbook 断点行；尽量带 `workflow_summary`（可复用 buildResumeCard）
- [ ] 1.4 `ppt_flow approve`：双写 metadata + `_state.gates`；可选 `appendHistory` gate_set
- [ ] 1.5 测试：卡字段；waiting_for → suggested_next/workflow_summary；approve 双写；仍 12 命令

## 2. Schema / NODE-SPEC

- [ ] 2.1 `NODE-SPEC` + `STATE_YAML_HEADER` / `STATE_DIR_README`：`waiting_for`/`note`；README 写清「断线后先 ppt_flow state（整流程位置）」
- [ ] 2.2 heal round-trip 保留 `waiting_for`

## 3. Docs — 小白整流程续跑

- [ ] 3.1 `COMMANDS.md`：**续跑 / 做到哪了**（断线、清聊天、接着做）+ 删「从第一个 node 开始」
- [ ] 3.2 `BOOTSTRAP.md`：已有 deck / 断线回来 → 先 state+status 人话汇报，再 intake
- [ ] 3.3 `AGENT_CONTRACT.md` §1：进度 = `_state` + 产物，不信赖聊天；写盘纪律
- [ ] 3.4 `template-deck-guide.md`：清上下文 → `ppt_flow state`（整流程）

## 4. Playbook 写盘注记

- [ ] 4.1 `create-deck` / `iterate-style` 等：进出节点 writeState；等人 waiting_for

## 5. Regression + 小白场景冒烟

- [ ] 5.1 `npm test` 绿
- [ ] 5.2 手动模拟断线：只给 `deck_ai_sdlc_keynote` → state/status 能讲清「做到哪 + 下一步」；approve 后门闩一致
