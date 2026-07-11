# 流程宪法: Agent 工作流程

> 本文描述 PPTMAKER_FRAMEWORK 的完整工作流程——从零开始到迭代打磨.
> 详细执行步骤在 `AGENTS.md` (按 Phase 查阅), 启动流程在 `BOOTSTRAP.md`.
> **Phase 编号以 `AGENTS.md` / `AGENT_CONTRACT.md` 为准**——本文是摘要，不是第二套编号。

## Phase 总览（与 AGENTS.md 对齐）

| Phase | 做什么 | Gate | Agent 角色 |
|-------|--------|------|-----------|
| **0** 项目初始化 | 环境检查 → 5 问题 intake → 创建 run bundle | 结构合规 (`--check --structure-only`) | 执行者 |
| **1** 内容设计 | 隐喻 → 公式 → Block Map → 四层 slide specs（L3 占位） | 内容确认 (`content_gate`) | 创作者 |
| **2** 视觉风格 | medium → preset → style_master.jpg → review → **§2.7 回填 L3** | 视觉锁定 (`visual_gate`) | 建议者 |
| **3** 生产管线 | Stage 1→5: markdown → PPTX | 每 Stage 一个 gate | 执行者 |
| **4** 迭代维护 | 分类变更 → 最小化重跑 → 记录 | — | 判断者 |

支撑层（贯穿，不是独立 Phase 编号）：
- `workflow/03-prompts/` — 图像提示词能力层
- `workflow/05-iteration/` — 结构化迭代纪律

Phase 顺序：`0 → 1/2（可交换）→ 2.7 回填 L3 → 3 → 4`。Phase 3 必须在 1+2 都锁定后启动。

## 编辑链 (变更分类)

任何用户变更请求必须先分类, 再跑对应链:

| 链 | 用户说 (示例) | 变更类型 | Stage | 耗时 |
|----|-------------|---------|-------|------|
| **A** | "第5页标题改一下" | title/kicker/subtitle | 1,3,4,5 | ~5 min |
| **B** | "第8页的图重新生成" | image prompt/颜色/布局 | 1,2,3,4,5 | ~5 min/页 |
| **C** | "备注改一下" | speaker notes | 5 | ~30 sec |
| **Structural** | "加一页案例" / "删掉第3页" | 增/删/重排 slide | new-version + 受影响页 | 按页数 |

**Agent 分类逻辑**:
1. 改了什么? (text / visual / notes / structure)
2. 影响多少页? (1 页 → targeted; 几页 → rerun affected; 全部 → full rebuild)
3. 要 pilot 吗? (颜色/风格变更 → 先试 3 页, 通过后再全量)

## Gate 机制

每个 Phase 结束必须通过 Gate——**人审确认**. Gate 状态记录在 `project-metadata.yaml`:

- `content_gate: pending|approved|waived`
- `visual_gate: pending|approved|waived`

Stage 2 运行前检查: 两个 gate 必须为 `approved` 或 `waived`.

## Agent 入口序列

```
CLAUDE.md  →  BOOTSTRAP.md  →  charter/AGENT_CONTRACT.md  →  按 Phase 读 AGENTS.md
(自动加载)     (三步启动)        (11 条铁律)            (详细执行)
```

日常命令统一走 `scripts/ppt_flow.mjs`（doctor / init / status / approve / pilot / build）。
`COMMANDS.md` + `playbook/` 是自然语言意图路由**附录**，不是第二套启动入口。

## 迭代节奏

| 频率 | 操作 | 走什么 |
|------|------|--------|
| 高 (每轮对话) | 改 wording, 调单页 prompt | Chain A/B, 直接编辑 |
| 中 (每几次) | 换案例, 调结构 | Structural, proposal 先行 |
| 低 (关键节点) | 换隐喻/公式, 换视觉方向 | 回 Phase 1/2, 全量重跑 |
