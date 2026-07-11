## 1. CLI — resume card + approve dual-write

- [ ] 1.1 Extend `ppt_flow state` text + `--json` with resume card (`playbook`, `current_node`, node status, `waiting_for`/`note`, gates, stack, `suggested_next`)
- [ ] 1.2 Extend `ppt_flow status` with compact Playbook section / JSON fields from `_state`
- [ ] 1.3 `ppt_flow approve` dual-writes `project-metadata` gates **and** `_state.gates` via `writeState`
- [ ] 1.4 Tests: resume-card JSON fields; approve syncs `_state.gates`; still 12 commands

## 2. State schema / NODE-SPEC notes

- [ ] 2.1 Document optional `waiting_for` / `note` on node records in `NODE-SPEC.md` / `_state` README (state.mjs README body)
- [ ] 2.2 Ensure heal path tolerates unknown optional fields (no corruption)

## 3. Docs — ritual + routing

- [ ] 3.1 `COMMANDS.md`: **续跑 / 恢复** section + fix Agent 路由逻辑 (有 state 则续，非默认 first-node)
- [ ] 3.2 `BOOTSTRAP.md`: existing-deck resume before greenfield intake
- [ ] 3.3 `AGENT_CONTRACT.md` §1: `_state` is progress SSOT across cleared sessions; writeState on transitions
- [ ] 3.4 `template-deck-guide.md` + deck-guide crumbs: clear-context → `ppt_flow state`

## 4. Playbook write-discipline notes

- [ ] 4.1 Light notes on key playbooks (`create-deck`, `iterate-style`, others that already mention writeState): enter/leave node → writeState; human wait → `waiting_for`

## 5. Regression

- [ ] 5.1 `npm test` green
- [ ] 5.2 Manual smoke: clear-context story — `state` card readable; `approve visual` then `state --check-gates` matches
