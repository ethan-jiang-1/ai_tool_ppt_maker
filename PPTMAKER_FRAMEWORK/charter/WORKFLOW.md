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

## Refresh Path（变更分类）

用户只需自然语言描述改动。Agent 必须先判断是否改变 slide 集合/顺序，再按“内容由谁渲染、哪个下游产物失效”选择最小安全路径。英文名是正式名称；中文只作解释；旧字母不是缩写，只作兼容对照。

| 正式名称（兼容旧称） | 用户说（示例） | 能改什么 | 逻辑执行 | 耗时 |
|----------------------|----------------|----------|----------|------|
| **Header Text & Style Refresh**（页眉文字与样式刷新；formerly Chain A） | "第5页 body-lock 标题改一下" | resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE，以及 Stage 3 拥有的字体、字号、字重、颜色、位置、行高和间距；raw-image contract 不变 | 1 → 3 → 4 → 5 | ~5 min |
| **Generated Image Rebuild**（生成图重建；formerly Chain B） | "第8页的图重新生成" | full-page header、body 文案/数据、image prompt、画面/配色，以及 mode/safe-zone 等 raw-image contract | Stage 1 → 强制重生所选 Stage 2 → review → 3/4/5（复用已审图） | ~5 min/页 |
| **Notes-Only Refresh**（仅备注刷新；formerly Chain C） | "备注改一下" | speaker notes | Stage 5 | ~30 sec |
| **Structural Versioning Path**（结构版本路径；formerly Structural） | "加一页案例" / "把 UX gap 那页放到第3页后" | 增/删/重排 slide | stable-ID preview/hash 确认 → 干净 vNext → verified raw-only materialization → target-local 3/contact sheet/4/5；缺 raw 才另行授权 Generated Image Rebuild | 按页数 |

Structural Versioning Path 是外层版本流程，不是第四条并列 refresh path。

结构讨论显示 `position · slide_id · title`：position 是当前快照，ID 才跨版本。Agent 保存 preview hash，用户只确认 before/after；stale 时重新 preview。结构提交和 materialization 都是 renderer-free，`needs_render` 不等于生图授权。长期无法收敛时使用新 preview → 新 vNext → 新 deck 的逃生阶梯。

**Agent 分类逻辑**:
1. 改了 slide 集合/顺序吗? 是 → Structural Versioning Path；新版本中的受影响页仍需继续分类
2. 内容由谁渲染? Stage 3 header / 生成图片 / Stage 5 notes
3. 哪个产物失效? 标题意图用 `ppt_flow refresh --kind title` 解析 resolved mode：body-lock=Header Text & Style Refresh，full-page=Generated Image Rebuild
4. 影响多少页? (1 页 → targeted; 几页 → rerun affected; 全部 → full rebuild)
5. 要 pilot 吗? (生成图片/颜色/风格变更 → 先试代表页, 通过后再全量)

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

日常命令统一走 `scripts/ppt_flow.mjs`（13 个 top-level commands，含 `slides`）。
`COMMANDS.md` + `playbook/` 是自然语言意图路由**附录**，不是第二套启动入口。

## 迭代节奏

| 频率 | 操作 | 走什么 |
|------|------|--------|
| 高 (每轮对话) | 改 wording, 调单页 prompt | 先查内容所有者和 render mode，再选 Header Text & Style Refresh / Generated Image Rebuild |
| 中 (每几次) | 换案例, 调结构 | image-owned 案例走 Generated Image Rebuild；增删重排走 Structural Versioning Path，proposal 先行 |
| 低 (关键节点) | 换隐喻/公式, 换视觉方向 | 回 Phase 1/2, 全量重跑 |
