## 1. Constitution — agentic dual track

- [ ] 1.1 `CONSTITUTION.md`: insert D0 Copy Deck between CLI envelope and 权威树
- [ ] 1.2 `AGENT_CONTRACT` §7: heal-first bullet; `NODE-SPEC` SAFETY = default heal
- [ ] 1.3 `_state` README（及可选 header）一句：坏了会尽量自动整理

## 2. YAML library + array round-trip

- [ ] 2.1 `npm i yaml`；`parseDocument`（D2 选项）+ `stringify`；保留 `STATE_YAML_HEADER`
- [ ] 2.2 删除生产路径手写 `toYaml`/`parseYaml`
- [ ] 2.3 空 + 对象数组 `playbook_stack` round-trip 绿

## 3. Heal path（脏进净出）

- [ ] 3.1 `healState` + `normalizePlaybookStack`；`readState({heal:true})` 默认；switch/resume/start 归一
- [ ] 3.2 不可解 → `state.yaml.broken.<ts>` → seed + write；默认不返回 `{corrupted:true}`
- [ ] 3.3 dirty / 曾有 parse error → stringify 回写；语义已净不无意义刷盘；MAY `state_healed` history
- [ ] 3.4 `ppt_flow state` 默认 heal；可 heal 文件不 exit 2 / `STATE_CORRUPTED`

## 4. Tests + backlog

- [ ] 4.1 单测：round-trip；`{}` heal+回写；malformed backup+usable；switch→write→read→resume；healable 不 corrupted
- [ ] 4.2 `npm test` + `npm run test:e2e`
- [ ] 4.3 `git mv` BUG-007 → `_done/_fixed_bugs/`；README Next ID → BUG-008
- [ ] 4.4 Acceptance；archive 时 sync `framework-charter` + `node-specification`
