## Context

上游两份 plan（已定名）：

| Plan | 角色 |
|------|------|
| `agent-interaction-protocol` | 原理：小白×强 AI×把事做对；8 条原则 → 铁律 |
| `style-iterate-and-quick-preview` | 实例：`iterate-style` + `quick-preview` |

本 change = **Change 1** `add-interaction-rhythm-and-explore-playbooks`。  
**Change 2** `guard-offpath-migrate-import-ux`（旁路迁移护栏）**不在本 change**。

现状缺口：

| 层 | 有 | 缺 |
|----|----|----|
| 哲学 | BOOTSTRAP / 铁律 §9 候选题 | show-don't-tell、心跳、步长未成硬规则 |
| 路由 | 全量创建 + 迭代打磨 | 「探索」类意图无 playbook |
| CLI | `style-master` / `pilot` / `approve` / `switchPlaybook` 已可用 | 无 MD Controller 包 loop + 强制 open |
| Spec | playbook「exactly six files」；CONTRACT「内容冻结」 | 加文件/加铁律会与契约冲突 |
| 措辞 | 多处写死「10 条」 | 加 §11 后必须扫尾 |

## Goals / Non-Goals

**Goals:**

1. Agent 每次 session 读到可执行的「交互节律」硬规则
2. 视觉/pilot review 前必须让用户**看见**实物（`open`），禁止只描述
3. 「先打磨视觉 / 先出 3 页看看」有明确 playbook，不误入 `edit-visual`
4. 探索与 `create-deck` 的闸门/栈关系自洽（谁批 visual_gate、何时能 pilot）
5. 零 CLI 代码改动；`round` 用现有 `setNodeStatus` extra

**Non-Goals:**

- migrate/import（Change 2）
- 改 `ppt_flow.mjs` / pipeline / state schema
- partial PPTX；自动强制停 iterate（仅 round≥5 **建议**）
- 重写 §1–10；把 8 原则全文塞进 CONTRACT
- 改 WORKFLOW 全章（COMMANDS + playbook 足够路由）

## Decisions

### D1 — 一个 change 绑「法 + 样板」

协议无入口 = 空话；入口无协议 = 仍 tell。同 change 交付。migrate 仍拆出。

### D2 — 铁律形态：新增 §11「交互节律」（一条，内含短子弹）

标题改为「不可违反的 11 条」。§11 **不是**再拆 8 条并列铁律，而是**一条**里的最短可执行清单（原理留 plan）：

1. 产出可认的候选 + 推荐（recognition ≫ recall）
2. 视觉/样张必须 `open`/渲染（show ≠ tell）
3. 永远给默认可逆路径
4. 用到某能力时顺带披露「还能做 X」
5. 长任务给可见 checkpoint；禁止静默长跑
6. 信心校准步长：早期小步多确认，对齐后放长
7. 每个 checkpoint 问「方向对不对」
8. 第一步先给一个看得见的赢

§9（用户做选择题）保留；§11 补「怎么交互」，不替代 §9。

### D3 — BOOTSTRAP：gate 前 `open` 显式化

- 审 `style_master.jpg`、pilot contact sheet（及同类视觉 review）前，Agent **必须**打开/展示文件
- 仅文字描述外观 = 违规（当文件已存在时）
- pre-key 无图：降级 show（preset 说明 / 母版 prompt）；有 key 且出图后立刻升级真图
- 同步把 BOOTSTRAP / CLAUDE 里「10 条」改为「11 条」

### D4 — `iterate-style` 节点

```
start-iterate → tweak-prompt → generate → review-gate
                                      ↑          │
                                      └── RETRY ──┘
                                    LOCK / BACK
```

| 约定 | 选择 |
|------|------|
| 迭代分辨率 | playbook 写死 `style-master --force --resolution 1k` |
| LOCK | **必须**按 D13.2 双写；再可选 `style-master --force --resolution 2k`；栈切入则 `resumePlaybook` |
| BACK | 回 Phase 2.1 重选 medium/preset；**不**批 visual_gate |
| round | `setNodeStatus(..., { round: N })`；N≥5 时建议换方向或接受 |
| 历史版 | 大改动先存 `1_upstream_raw_material/style-master-iterations/` |
| CLI | 只用现有命令；`style-master` 不拦未批 gate（可 pre-lock 跑） |

### D5 — `quick-preview` 节点

```
validate-ready → pilot-generate → review-preview
```

| 约定 | 选择 |
|------|------|
| 前置 | `content` + `visual` gates 已 `approved`/`waived`（与 `pilot` CLI 一致） |
| validate / pilot | 现有 `ppt_flow validate` / `pilot` |
| 出口 | PROCEED→建议 `build` / RETRY→改 L3 或页 prompt 后重跑 pilot（留在本 playbook）/ BACK→Phase 1/2 或 `iterate-style` |
| 产物 | contact sheet only；禁止承诺 partial PPTX |

### D6 — COMMANDS「探索 & 预览」

插在「全量创建」与「迭代打磨」之间。表意：

| 意图 | Playbook | 不是 |
|------|----------|------|
| 打磨 style master | `iterate-style` | `edit-visual` |
| 3 页快览 | `quick-preview` | 直接闷头 `build` |

### D7 — Spec 边界

| Spec | 改什么 |
|------|--------|
| `framework-charter` | CONTRACT 含 §11；废除冻结句；+ BOOTSTRAP show-before-gate |
| `playbook-execution` | **RENAME** 目录要求标题（five→registered/seven）；探索 playbook；COMMANDS；gate show；archive 时改 Purpose「six files」 |

不新开 capability。

### D8 — `create-deck` `setup` 最小补丁

保留单次 generate 快路径。Gate 步：

1. 必须 `open` `style_master.jpg`
2. 用户要多轮打磨 → `switchPlaybook(iterate-style)`（勿只改文案糊弄过 gate）
3. 用户一次满意 → **D13.2 双写**（`approve visual` + `_state` setGate）后继续 `seed-topics`

### D9 — `edit-visual` 同样遵守 show

`edit-visual` 的 pilot/confirm review：必须 `open` pilot 产物。不新开 playbook 逻辑，只补 MD 一句，与铁律一致。

### D10 — 探索时序（自洽）

推荐因果链（写入 playbook/COMMANDS 说明即可，不强制状态机新边）：

```
定方向 → iterate-style（可选多轮）→ LOCK visual
      → 内容就绪 → quick-preview → PROCEED → build
```

- **不能**在 visual 未批时跑 `quick-preview`（pilot 会拒）——playbook `validate-ready` 写明
- `iterate-style` 与 `quick-preview` 职责不重叠：前者锁视觉锚，后者预览内容×视觉合奏

### D11 — `iterate-style` 入口模式

| 模式 | 从哪来 | 从哪 node 起 |
|------|--------|--------------|
| A 独立 | COMMANDS「先定视觉」 | `start-iterate` |
| B 栈切入 | `create-deck` setup 审图不满意 | 已有 master → `tweak-prompt`；否则 `start-iterate` |
| C 锁后反悔 | visual 已 approved，用户要大改 | `start-iterate`；见下硬规则 |

**模式 C 硬规则（无 un-approve CLI）：**

1. 开场必须告知：「视觉曾锁定；本轮未再次 LOCK 前，不要跑 `pilot` / `build`。」
2. **不**手改 metadata 把 `visual_gate` 改回 pending；**不**新增 CLI。
3. 迭代照常改 prompt / 1k 出图；旧 `approved` 可暂时留在文件里，但 Agent 行为上视为「重锁中」。
4. 用户再次 LOCK → 再跑一遍 `approve visual`（幂等刷新签字）+ 同步 `_state` gates。
5. 用户 BACK 且已改过 `style_master.jpg` → 警告「图可能与旧锁不一致」，建议 LOCK 或从 `style-master-iterations/` 恢复后再决定。

### D12 — 测试 / 措辞扫尾 / Acceptance

| 项 | 做法 |
|----|------|
| 回归 | `npm test`；未改 runtime 则 e2e 可选 |
| 措辞 | grep「10 条」/「10 non-negotiable」/「exactly six」playbook 相关 → 更新 |
| backlog | 两 plan → `_done/_closed_plans/` + CLS-ID |
| 文案 | **必须**按下方 Copy Deck 粘贴，禁止 apply 临场改写铁律/骨架 |

**Acceptance：**

1. CONTRACT §11 与 Copy Deck 一致；标题 11 条；入口文档条数一致
2. BOOTSTRAP 写明 gate 前 open；pre-key 降级
3. 两 playbook 节点/CLI/出口与 Copy Deck 一致；COMMANDS 表一致
4. create-deck setup + edit-visual pilot 含 show
5. LOCK 双写（metadata `approve` + `_state` `setGate`）写进 playbook
6. delta 与实现一致；零 CLI 代码 diff
7. 两 plan 关闭

### D13 — Copy Deck（apply 照抄；本轮钉死的落地文案）

#### D13.1 — AGENT_CONTRACT §11 正文（整段可贴）

标题：`## 11. 交互节律`

```markdown
小白×强 AI：你扛「做对」，用户只「认/纠」。违反任一条 → 停下修正。

1. **可认，别出考题。** 每步给 2–3 个具体候选 + 你的推荐 + 为什么；用户挑/改，不从零空想。
2. **Show, don't tell。** 视觉/样张必须打开给用户看（`open`/展示文件）。文件已在盘上时，禁止只用文字描述外观。
3. **默认 + 可逆。** 永远给合理默认（「拿不准我先按 X，随时可改」）；早期一切廉价可重来。
4. **相关时刻亮能力。** 用到某能力时顺带说「我还能做 Y，要不要」——用户无法索取自己不知道的东西。
5. **长任务给心跳。** 禁止静默长跑；要有可见 checkpoint。对用户，沉默 ≈ 坏了/走丢了。
6. **信心校准步长。** 早期小步、多确认；对齐后放长、少打断。步长是变量。
7. **Checkpoint = 方向对不对。** 每次停顿都框成「我们还指着正确方向吗」。
8. **第一步先给看得见的赢。** 首次交互就产出用户能快速判断的实物。

pre-key 尚无图：可用 preset/母版 prompt 降级展示；一旦出图，立刻升级为真图 show。
```

CONTRACT 文首「10 条」→「11 条」。§1–10 不动。

#### D13.2 — LOCK 双写（闸门真相）

管线 / `pilot` / `status` 读的是 **`project-metadata.yaml` 的 `visual_gate`**（`ppt_flow approve` 只写这里）。  
Playbook 进度另有 **`_state/state.yaml` 的 `gates.visual`**（`setGate`）。

**LOCK 必须两步都做（顺序固定）：**

1. `node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve <run-dir> visual`
2. Agent：`setGate(state, 'visual', 'approved')` + `writeState`

可选：`ppt_flow.mjs style-master <run-dir> --force --resolution 2k`  
若从 `create-deck` 栈切入：再 `resumePlaybook`。

#### D13.3 — `iterate-style.md` 骨架要点（版式对齐 `edit-notes.md`）

Frontmatter：`playbook: iterate-style`；`description: 探索——打磨 style master（1k 迭代 → LOCK 升 2k）`；`includes: []`。

| Node | 类型 | 关键步骤 |
|------|------|----------|
| `start-iterate` | MD | 读 prompt+图（有则 open）；模式 C 宣读 D11.1；确认 1–3 打磨维度 |
| `tweak-prompt` | MD | 大改先存 `style-master-iterations/`；改 prompt；round≥5 建议换向 |
| `generate` | CLI | `ppt_flow.mjs style-master <run-dir> --force --resolution 1k`；递增 round |
| `review-gate` | Gate | **必须 open** 图；RETRY→tweak / BACK→Phase 2.1+D11.5 / LOCK→D13.2（+可选 2k + resume） |

引用 checklist：`workflow/01-visual/04-iterate-review-lock.md`。

#### D13.4 — `quick-preview.md` 骨架要点

Frontmatter：`playbook: quick-preview`；`description: 探索——3 页 pilot 快览（contact sheet）`；`includes: []`。

| Node | 类型 | 关键步骤 |
|------|------|----------|
| `validate-ready` | MD+CLI | gate pending → 停并导向 lock；否则 `ppt_flow validate` |
| `pilot-generate` | CLI | `ppt_flow.mjs pilot <run-dir>`（默认 1k） |
| `review-preview` | Gate | **必须 open** contact sheet；PROCEED→建议 build / RETRY→改 L3 后回 pilot / BACK→Phase 1/2 或 iterate-style |

禁止承诺 partial PPTX。

#### D13.5 — COMMANDS「探索 & 预览」表（插在全量创建与迭代打磨之间）

```markdown
## 探索 & 预览

> 还没全量交付、也不是改已有 PPTX——pre-commitment 试探。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ `quick-preview` → `build`。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "先定视觉方向，反复打磨 style master" | `iterate-style` | 1k loop → LOCK 升 2k |
| "视觉风格不满意，再调一版" | `iterate-style` | review-gate RETRY / 模式 C |
| "内容有了，先出 3 页典型页看看效果" | `quick-preview` | 须 gates 已批；contact sheet |
| "先预览一下再决定要不要全量" | `quick-preview` | PROCEED 再 build |
```

#### D13.6 — setup / edit-visual 补丁句

`create-deck` setup Gate：

> **必须 open** `style_master.jpg`。多轮打磨 → `switchPlaybook` → `iterate-style`。一次满意 → `approve … visual` + 同步 `_state` gates.visual，再进 seed-topics。

`edit-visual` pilot 审图：

> **必须 open** pilot 产物。禁止只描述。

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 每步都停 | 信心校准步长写进 §11 |
| pre-key 无图 | 降级 show |
| CONTRACT 膨胀 | Copy Deck 限长 |
| iterate 无限 | round≥5 建议 |
| 与 edit-visual 混淆 | COMMANDS + D10 |
| 栈切入丢上下文 | D11；resume |
| 双闸门漂移 | D13.2 强制双写 |
| 模式 C 旧 approved 残留 | D11 行为锁 + BACK 警告 |

## Migration Plan

纯文档/playbook。Rollback = 还原 md + 删两 playbook。无数据迁移。

## Open Questions

_无（D1–D13 已关闭；migrate = Change 2）。_
