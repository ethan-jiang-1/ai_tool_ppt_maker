## Context

来源：`_backlog/plans/improve-visual-iteration-env.md`（现场复盘）。已落地：BUG-006、IMAGE2_BASE_URL 硬失败、BUG-008 unwrap、`extractImageRef`、skip-if-exists。

**关键现状（打磨时核实）：**

| 事实 | 含义 |
|------|------|
| `pilot` 在调 Stage 2 **前**调用 `checkBundle(true)` | 外层拦 metadata gates |
| `unified_pipeline` 凡 `stages.includes(2)` 即 `validateRunDir(..., true)` | **子进程再次拦 gates**——只改 pilot 外层不够 |
| `force: !!(forceImages \|\| only)` | `--only` 隐式全量重渲所选页 |
| `pilot` 无条件追加 `--force-images`，且 **无** `--force-images` CLI 选项 | 无法「续跑跳过」 |
| Pipeline 就绪读的是 **`project-metadata.yaml`** gates，不是 `_state` | Spec/playbook 文案须与代码一致 |
| `deck_system.txt` 路径 | `2_backbone/visual-style/deck_system.txt`；Stage 1 `loadDeckSystem` **整文件**注入 |

## Goals / Non-Goals

**Goals：** 预览不污染 gate；`--only` 可猜；force 语义单一；长渲染可观察；style master 与 Stage 1 同约束源；可选 smoke；fixture 防回归。

**Non-Goals：** `previewing` gate 态；作业调度器；默认 smoke；重做已修 bug；合并 metadata/`_state` 双写架构。

## Decisions

### D1 — 三档就绪（锁定）

`checkBundle(runDir, mode)`（或等价）：

| mode | 检查 |
|------|------|
| `structure` / `false` | 目录与控制文件 |
| `preview` | + `style_master.jpg` |
| `pipeline` / `true` | + metadata `content_gate`/`visual_gate` ∈ {approved, waived} |

- `unified_pipeline` 增加 **`--preview`**：当 Stage 2 在跑时用 `preview`，否则用 `pipeline`。
- `ppt_flow pilot`：本地用 `preview`；调用 Stage 2 时传 `--preview`；**禁止**写 waive。
- `build` / 默认 `--stage 2`（无 `--preview`）：仍 `pipeline`。
- **不**引入 `previewing` gate 值。

### D2 — `resolveSlideIds`（锁定）

顺序：exact → `/^s0*N\b/i` 或 id 前缀 `sNN` → 纯数字 1-based 索引 → 唯一 case-insensitive substring。多匹配 / 零匹配 → 失败；`hint` 列可用 id（截断）。模块：`scripts/lib/slide_ids.mjs`（或同级），供 `ppt_flow` + `unified_pipeline` 共用。

### D3 — Force 仅显式（锁定；关闭原 Open Question）

`force = !!forceImages` **仅**。删除 `|| only`。`pilot` 默认不传 `--force-images`；新增 `pilot --force-images` 供重渲。文档 / change-classifier 同步。

### D4 — 心跳 + 超时表述（锁定）

- 心跳间隔：**30s**（`HEARTBEAT_MS = 30_000`）。
- 预算：保留 `MAX_WAIT_MS`（600s）；超时错误须含 elapsed / task id，标明**本图**失败。
- 不做跨页作业队列；「续跑」= skip 已存在文件。

### D5 — deck_system 同源注入（锁定）

- 路径：`styleDir/deck_system.txt`（与 Stage 1 相同解析）。
- 内容：复用 Stage 1 的 `loadDeckSystem`（或抽取共享函数）——**整文件文本**，不做脆弱分节解析。
- 缺文件：仅 `style-master-prompt.md`。
- 逃生：`generate_style_master --no-deck-system`（可选但建议实现）。

### D6 — smoke = 认证探针（锁定；关闭原 Open Question）

- `env-check --smoke`：存在性通过后，用 resolved key+base **POST** `/images/generations`（最小 prompt / 1k）；**收到 `task_id` 即成功**，不必等出图（省时省钱）。
- 实现：`fetch` + 与 client 一致的 env 解析（可 dynamic import `resolveApiKey`/`resolveBaseUrls`/`unwrapDataRecord`；**不**引入 npm 依赖，保持 env-check 零 npm）。
- 失败 → 该项 fail → 总 NOT READY。默认无 `--smoke` 不联网。
- `ppt_flow doctor --smoke` 原样转发。

### D7 — Fixtures（锁定）

`tests/fixtures/image-api/`：至少 `submit-data-array.json`、`poll-embedded-image.json`。Export `unwrapDataRecord` / `extractImageRef`（或 `__test__` 导出）供单测。无密钥。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| `--preview` 被误用于全量生产 | 仅 `pilot` 文档化使用；`build` 不传；status/next-steps 区分 preview vs approved |
| `--only` 不再隐式 force 打破 Chain B 习惯 | proposal 标行为变更；改 change-classifier / COMMANDS 示例一律显式 `--force-images` |
| smoke 仍可能产生远端 task | 探针极小；成功即停；失败有清晰 fix |
| 整文件 deck_system 过长 | 与 Stage 1 一致；过长是既有问题，不在本 change 截断 |

## Migration Plan

1. `checkBundle` 三档 + `unified_pipeline --preview` + pilot 接线  
2. `slide_ids` + force 语义 + tests  
3. heartbeat / fixtures  
4. style-master 注入 + `--no-deck-system`  
5. doctor smoke  
6. playbook / docs；关闭 plan  

Rollback：按提交回退；无数据迁移。

## Open Questions

（无 — 原「`--only` 是否取消隐式 force」「smoke 形态」已在 D3/D6 锁定。）
