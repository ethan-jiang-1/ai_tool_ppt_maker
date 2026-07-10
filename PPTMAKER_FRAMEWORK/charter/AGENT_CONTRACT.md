---
title: AGENT_CONTRACT — 不可违反的 10 条
stage: root
position: contract
type: playbook
summary: Agent 每次 session 先读这一页。违反任一条 = 下游成本指数增长。详解在 AGENTS.md。
depends_on:
- BOOTSTRAP.md
feeds_into:
- AGENTS.md
agent_action: read_first
---

# AGENT_CONTRACT — 不可违反的 10 条

> **读完这一页就能开工。** AGENTS.md 是详解手册，不是每次都要通读的入口。
> 违反任一条 → 停下来修，不要"先做完再说"。

## 1. 入口顺序

`BOOTSTRAP.md`（环境 + intake）→ 本文件 → 按 Phase 执行时再翻 `AGENTS.md` 对应章节。
不要跳过 BOOTSTRAP 直接临场发挥目录。

## 2. 目录是宪法

结构唯一事实源：`scripts/bundle_layout.mjs`。
- 创建：`--init deck_{NAME} --deck-type … --style …`（禁止手动 mkdir/cp 拼骨架）
- 校验：`--check … --structure-only`（Phase 0）/ 管线跑前自动全量 check
- 不自创目录、不把生成物乱放

## 3. 源 vs 派生

| 可手改（源） | 绝不手改（派生） |
|-------------|-----------------|
| `2_backbone/` | `3_versions/v{n}/_generated/` |
| `3_versions/v{n}/slide-specifications.md` | PNG / JSON / PPTX |
| `3_versions/v{n}/overrides/` | |

改动永远从源 markdown 开始，再重跑管线。

## 4. Phase 顺序与闸门

```
0 初始化 → 1 内容 → 2 视觉 → 2.7 回填 L3 → 3 生产 → 4 迭代
```

- Phase 1 与 2 可交换，**不可跳过**
- Phase 3 必须在 1+2 **都锁定**后启动
- 每个 Phase 结束等用户确认，并把 `project-metadata.yaml` 对应 gate 写成 `approved`。Stage 2 会执法检查。用户坚持跳过 → 提醒返工成本，将状态明确写成 `waived`

## 5. L3 时机（最易漂）

| 层 | Phase 1 | Phase 2 锁定后 |
|----|---------|----------------|
| L1 Meta / L2 Concept / L4 Notes | **写全** | — |
| L3 IMAGE PROMPT | **占位** | **§2.7 回填** → `--validate` |

Phase 1 跑 `stage1 --validate` 一定失败（L3 还是占位）——别在 Phase 1 gate 它。

## 6. 词汇只有一套

| 人写 / 文档 / slide_plan | 含义 |
|--------------------------|------|
| `full-page` | AI 画整页（含标题） |
| `body+header-lock` | AI 画 body，Node `@napi-rs/canvas` 叠标题 |

不要写 `image_direct` / `normal`（旧词；输入端仍兼容，输出与文档禁止再用）。

## 7. 运行时只有 Node；Stage 2 在框架内

**唯一运行时：Node.js ESM。** 禁止 Python / bash / 外部 skill 作为生产路径（跨平台会断）。

官方 Stage 2：`unified_pipeline.mjs` → `scripts/stage2_generate_images.mjs` + `make_contact_sheet.mjs`（均在框架内）。
Style master：`scripts/generate_style_master.mjs` → `image_api_client.mjs`。
不发现 `.claude/skills` / `.agents/skills`。

## 8. 编辑链（改完怎么重跑）

| 改了什么 | `--stage` | 耗时 |
|---------|-----------|------|
| 标题/kicker 文字 | `1,3,4,5` | ~5 min |
| 画面 / IMAGE PROMPT | `1,2,3,4,5 --only <id>`（指定页自动强制刷新） | ~5 min/页 |
| speaker notes | `5` | ~30 sec |

**改标题不要跑 Stage 2。** 分类见 `scripts/change-classifier.md`。

## 9. 用户做选择题，你做创造性劳动

隐喻 / 公式 / 视觉：给 **2–3 个候选** + 推荐理由，让用户选。
不要问"你的隐喻是什么"。用户说"不知道" → 换角度或给最佳猜测让确认。

## 10. Medium before color

Phase 2：先锁画风（sketch / diagram / photography / 3D / mixed），再选配色 / preset。
不要先甩色板让用户"喜欢哪个颜色"。

---

## 一页速查：统一入口

默认只用 `ppt_flow.mjs`。独立 stage 脚本只留给 Expert 调试。

```bash
# 环境
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor

# 建 bundle
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_{NAME} \
  --deck-type {keynote|pitch|report|training} --style {preset}

# 看进度与下一步（也检查结构）
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs status \
  deck_{NAME}/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve \
  deck_{NAME}/3_versions/v1 content

# 生成风格母版；用户确认后记录 visual gate
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs style-master \
  deck_{NAME}/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs approve \
  deck_{NAME}/3_versions/v1 visual

# 自动选代表页 pilot；通过后全量生产
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs pilot \
  deck_{NAME}/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build \
  deck_{NAME}/3_versions/v1
```

## 详解去哪翻

| 需要时 | 打开 |
|--------|------|
| Phase 逐步怎么做 | `AGENTS.md` 对应 Phase 节 |
| 改动分类 | `scripts/change-classifier.md` |
| 常见错误 | `reference/anti-patterns.md` |
| 术语 | `reference/glossary.md` |
| 人类 Quick Start | `reference/quick-start.md` |
| 方法论深挖 | `workflow/01-visual/`–`workflow/05-iteration/` 各模块 README |
