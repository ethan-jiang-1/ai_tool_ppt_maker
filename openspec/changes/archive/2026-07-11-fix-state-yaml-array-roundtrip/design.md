## Context

生产链路是 **agentic 双轨**：

| 侧 | 特质 | 典型失败 |
|----|------|----------|
| MD / Agent | 聪明、糊糊实实 | 少标点、类型写错、压模差一点 |
| JS / CLI | 精准、笨 | 只抛错、返回 `corrupted`、把题甩给人 |

理想配合：**模糊侧推进意图，精准侧修格式**——读容错、写洗净，MD 下次面对好压模。

BUG-007 样板：手写 YAML 无数组 → `playbook_stack: []` 读成 `{}` → `.push` 崩。NODE-SPEC 今日「损坏 → `{corrupted:true}`」对小白不友好；`ppt_flow state` 的 `STATE_CORRUPTED` 须与默认 heal 对齐。

## Goals / Non-Goals

**Goals:**

1. 宪法写清 MD↔JS 互补健壮性
2. `playbook_stack` round-trip；switch/resume 可用
3. 默认 `readState`：容错 parse → schema heal → 脏则规范回写
4. MD heal-first；不把 YAML 语法题甩给用户
5. 生产 I/O 权威 = `yaml` 包（非手写 mini-YAML）

**Non-Goals:**

- 全仓每个 YAML/JSON 立刻上 repair
- `history.jsonl` 作自动恢复真相源
- 铁律 11→12
- 为「有个叫 repair 的包」硬凑冷门依赖（语义对齐 `jsonrepair` 即可）

## Decisions

### D0 — CONSTITUTION Copy Deck（apply 原样落）

插在「CLI 失败回执宪法」与「权威树」之间：

```markdown
## MD↔JS 互补健壮性（Agentic 双轨 · 不可违反）

**MD/Agent 聪明但糊糊实实；JS/CLI 精准但笨。** 理想配合：模糊侧推进意图，精准侧修格式与契约。

| 要求 | 说明 |
|------|------|
| **读容错** | 状态/压模上的小格式瑕疵（缺标点、类型不对、空 mapping 当数组等）优先由精准侧确定性自愈 |
| **写洗净** | 自愈或成功读写后，磁盘上的 YAML/JSON 须是规范输出，避免 MD 在脏文件上越改越错 |
| **先修后问** | MD/Agent 发现坏 state / 坏压模 → 先 heal 或重写合法文件再继续；禁止把「去修语法」当作小白的下一步 |
| **真不可恢复才回执** | 仍走 CLI JSON envelope（见上节）；可恢复的格式问题应先修再走 |

样板实现：`scripts/lib/state.mjs` 对 `_state/state.yaml`。同一原则可扩到其他压模，但不要求本 change 一次做完。

权威交叉引用：`charter/NODE-SPEC.md`（SAFETY）· `charter/AGENT_CONTRACT.md` §7 · capability `node-specification` / `framework-charter`。
```

`AGENT_CONTRACT` §7 追加一句（中文，与该节语气一致）：

> **坏 state / 坏压模：先 heal 或重写合法文件再继续。** 禁止把 YAML/JSON 语法题甩给用户。

`NODE-SPEC` SAFETY 改为默认 heal；`{corrupted:true}` 仅 `heal:false` 或无法产出可用态时。

### D1 — 读写闭环（对标 jsonrepair）

| 方向 | 做法 |
|------|------|
| **读** | `yaml` 容错 parse → `healState` |
| **写** | 仅 `yaml.stringify` + `STATE_YAML_HEADER` |

依赖：`yaml`（eemeli）。删除生产路径对手写 `toYaml`/`parseYaml` 的依赖。

### D2 — 容错 parse API（锁定）

```js
import { parseDocument, stringify } from 'yaml';

const doc = parseDocument(raw, {
  strict: false,       // 忽略「规范要求但内容仍可消歧」的错
  uniqueKeys: false,   // MD 偶发重复键：后者覆盖，不整文件判死
  logLevel: 'error',   // 少吵
});
// 若 doc.errors 非空但仍有 doc.contents → 尽量 toJS() + heal（小错）
// 若无法得到 plain object → 天大的错 → backup + seed
```

Strip 文件头 `#` 注释后再 parse，或依赖库忽略 comment（与今日行为一致即可）。

### D3 — `healState` / `readState` / 回写策略

```
readState(deckDir, { heal = true } = {})
  missing → createDefaultState()（不写盘，除非调用方 write）
  tolerant parse → healState
    dirty（schema 有改）→ writeState(canonical) + MAY appendHistory({type:'state_healed', ...})
    仅空白/键序与 stringify 不同但语义已净 → 不强制每读必写（避免无意义刷盘）
    曾有 parse errors 但已 toJS 成功 → 视为 dirty，回写洗净
  parse 完全失败 → rename state.yaml.broken.<ts> → seed（尽量保留 deck.*）→ writeState → return
  heal:false → 旧行为：可 {corrupted:true, errors}
```

`healState` 至少：

- 保证 `nodes`/`gates`/`deck` 为对象；`gates.content`/`visual` 缺则 `pending`
- `playbook_stack`：非数组 → `[]`；只保留 plain object 项；`playbook`/`current_node` 字符串化
- 缺 `playbook` 且无 nodes 时：补 `createDefaultState()` 骨架字段，**不要**默认返回 corrupted

`switchPlaybook` / `resumePlaybook` / `startPlaybook`：入口 `normalizePlaybookStack`。

### D4 — `ppt_flow state` × `STATE_CORRUPTED`

- 默认调用 `readState(deckDir)`（`heal: true`）→ 返回可用态则 **不** exit 2
- `STATE_CORRUPTED`（exit 2）仅当：`heal:false` 且 corrupted，或 heal 后仍标记不可用（理论上 seed 后不应发生）
- 若本次 heal 回写过：人读摘要可一行「已自动整理 state.yaml」；`--json` 可带 `healed: true`（可选，不阻塞）

### D5 — Spec 面

| Capability | 改什么 |
|------------|--------|
| `framework-charter` | CONSTITUTION 节 + CONTRACT §7 句 |
| `node-specification` | stack；heal SAFETY；yaml 库；修正 header/`STATE_CORRUPTED` 表述 |

### D6 — Acceptance

1. CONSTITUTION / §7 / NODE-SPEC SAFETY 落地
2. 空/非空 stack round-trip；switch→write→read→resume
3. `{}` stack heal + 回写；不可解 YAML → backup + 可用态
4. `ppt_flow state` 对可 heal 文件不 exit 2
5. BUG-007 归档；`npm test` + `test:e2e` 绿

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| heal 掩盖内容错 | `.broken.*` backup；history `state_healed`；`heal:false` |
| seed 丢进度 | 仅完全不可解时 seed；可解析则保留字段 |
| 每读刷盘 | D3：仅 dirty / 曾有 parse error 才写 |
| 重复键静默覆盖 | `uniqueKeys:false` 有意为之；写回后只留一份 |

## Migration Plan

旧 `playbook_stack: {}` → 下次 read 归一并回写。不可解 → `.broken.<ts>` + 新文件。Rollback = 还原 state/宪法/依赖。

## Open Questions

_无（D0–D6 已关闭）。_
