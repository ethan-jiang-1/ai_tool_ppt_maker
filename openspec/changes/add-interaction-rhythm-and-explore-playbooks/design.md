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
| LOCK | `ppt_flow approve … visual`（或等价写 gate）；再 `style-master --force --resolution 2k` 一次；然后 `resumePlaybook`（若从栈切入） |
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
3. 用户一次满意 → `approve visual` 后继续 `seed-topics`

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
| B 栈切入 | `create-deck` setup 审图不满意 | 可跳到 `tweak-prompt`（已有 master）或 `start-iterate` |
| C 锁后反悔 | 用户打回视觉 | `start-iterate`；先视情况 `approve` 回退/保持 pending 由 agent 按 gate 规则处理——**本 change 约定**：反悔时将 visual 视为需重锁，agent 用 `approve` 前先说明；不新增 CLI |

模式 C 保持轻量：playbook 写「若已 approved 仍要大改，先告知用户将重走 visual lock」，不发明 un-approve 命令（可用对话 + 必要时手改 metadata；或 `waived` 路径——**禁止**静默覆盖。优先：用户确认后重新走 LOCK 流程并再次 `approve`）。

### D12 — 测试 / 措辞扫尾 / Acceptance

| 项 | 做法 |
|----|------|
| 回归 | `npm test`；未改 runtime 则 e2e 可选 |
| 措辞 | grep「10 条」/「10 non-negotiable」/「exactly six」playbook 相关 → 更新 |
| backlog | 两 plan → `_closed_plans/` + CLS-ID |
| Acceptance | 见下 |

**Acceptance：**

1. CONTRACT §11 存在且可执行；标题 11 条；入口文档条数一致
2. BOOTSTRAP 写明 gate 前 open；pre-key 降级
3. 两 playbook + COMMANDS 路由；时序/前置写清
4. create-deck setup + edit-visual pilot 含 show
5. delta 与实现一致；零 CLI 代码 diff（除文档）
6. 两 plan 关闭

## Risks / Trade-offs

| 风险 | 缓解 |
|------|------|
| 每步都停 | 信心校准步长写进 §11 |
| pre-key 无图 | 降级 show |
| CONTRACT 膨胀 | 一条 §11 + 短子弹 |
| iterate 无限 | round≥5 建议 |
| 与 edit-visual 混淆 | COMMANDS + D10 |
| 栈切入丢上下文 | D11 入口表；resume 回 setup 下一 node |
| visual 反悔无 un-approve CLI | D11 模式 C 对话约定；不扩 CLI |

## Migration Plan

纯文档/playbook。Rollback = 还原 md + 删两 playbook。无数据迁移。

## Open Questions

_无（D1–D12 已关闭；migrate = Change 2）。_
