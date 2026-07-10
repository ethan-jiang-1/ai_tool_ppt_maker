---
title: Template — Per-Bundle deck-guide.md
stage: 00_project_setup
position: template
type: template
summary: 复制到 deck_{NAME}/deck-guide.md。进入 run bundle 后先读它——一屏说清结构、控制流、编辑链、现在哪一步、怎么跑。人和 agent 都看得懂。
depends_on:
- charter/CONSTITUTION.md
- 06_reference_scripts/bundle_layout.mjs
feeds_into: []
agent_action: copy_to_bundle
---

# Template — Per-Bundle deck-guide.md

> **这是模板,不是某个具体项目的 deck-guide。** Phase 0 初始化 run bundle 时:
> 1. 把下面第一个代码块复制到 `deck_{NAME}/deck-guide.md`,替换 `{{...}}` 占位符。
> 2. 把第二个代码块复制到 `deck_{NAME}/CLAUDE.md`(一行指针,保 Claude Code 自动加载)。
>
> `deck-guide.md` 有两个读者:**上半部给人**(大白话,新手一进来就知道怎么办),**下半部给 agent**(控制流、编辑链、命令)。人不会被技术细节淹没,agent 也拿得到执行所需的一切。

---

## 复制到 `deck_{NAME}/deck-guide.md`：

```markdown
# {{DECK_NAME}} — 这个 PPT 项目怎么用

> 这份说明给你(人)看。不用懂目录、不用懂管线、不用写代码。看完你就知道现在能做什么。

## 你在这里

这是你的 PPT 项目文件夹。它已经搭好了骨架。整个项目分**你改的**和**机器生成的**两部分——你只管前者。

## 你现在能做什么(改这几个,其它别碰)

| 想改什么 | 打开这个文件 |
|---------|-------------|
| **每一页讲什么**(标题、要点、画面描述) | `3_versions/{{CURRENT_VERSION}}/slide-specifications.md` |
| **核心隐喻 / 公式**(整个 deck 的主线) | `2_backbone/core-metaphor.md` / `core-formula.md` |
| **视觉风格**(颜色、字体、风格参考图) | `2_backbone/visual-style/` |
| **调研素材**(往里堆资料,写着发现缺了就加) | `1_upstream_raw_material/` |

**`_generated/` 文件夹别碰**——那是机器生成的成品(图片、PPTX)。你改了上面的源文件,机器会重新生成它。想改 PPT,永远改源文件,不要直接改图片或 PPTX。

## 改完之后,怎么让它更新

跟你的 AI agent 说人话就行,比如:
- "第 5 页的例子换成特斯拉" → agent 会改源文件、重新生成那一页
- "颜色太暗了" → agent 会调视觉、重新生成
- "加一页讲风险" → agent 会插一页、重新生成

你**不需要**自己跑命令。真要自己跑,一条就够(下面"给 agent 的技术细节"里有)。

## 现在做到哪一步了?

看 `3_versions/{{CURRENT_VERSION}}/_generated/` 里有没有东西:
- 空的 → 还没生产,跟 agent 说"开始生成"
- 有 `ppt/{{OUTPUT_NAME}}.pptx` → 成品好了 ✅,打开看看

## 这个项目的约定
- **语言**:{{LANGUAGE_POLICY}}
- **内容禁忌**:{{CONTENT_CONSTRAINTS}}
- **视觉禁忌**:{{VISUAL_CONSTRAINTS}}
- **视觉风格**:{{VISUAL_PRESET}}

---
---

# 以下给 AI agent:控制流与命令

> 目录结构是宪法,唯一事实源 `PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs`
> (跑它看树 / `--check deck_{NAME}/3_versions/v1` 校验)。只改 `2_backbone/` 和
> `3_versions/{{CURRENT_VERSION}}/{slide-specifications.md, overrides/}`;`_generated/` 全是派生品。

## 结构(三层梯度)

```
{{DECK_NAME}}/
├── 1_upstream_raw_material/   ← 源·共享·原始素材(只增)
├── 2_backbone/               ← 源·共享·主干:隐喻/公式/约束/大纲/讲稿/视觉(默认事实源)
└── 3_versions/{{CURRENT_VERSION}}/
    ├── slide-specifications.md ← 源·每页规格 + 每页 render mode(管线入口)
    ├── overrides/            ← 源·只放这版偏离 backbone 的东西;空=全继承
    └── _generated/           ← 派生·别碰·可 rm -rf 重建
```

版本只切 `3_versions/`：用 `bundle_layout.mjs --new-version` 创建干净版本，只复制下游源 delta，不复制 `_generated/`。改隐喻/视觉主干 = 改 `2_backbone/`（影响全版本），不是开新版本。

## 控制流:五阶段 + 两个 render mode

```
slide-specifications.md ──(Stage 1)──> _generated/slide_plan.json + page_prompts/
                                              │
        每页按 render mode 分两条路:          ▼
  ┌─ full-page(整页,~20%):  image-2 画整页(含标题) ─────────────────┐
  │   开场/分隔/结尾                                                  │
  └─ body+header-lock(~80%): image-2 只画 body ──> Python 叠 kicker+title ┘
       常规页                    (Stage 2)          (Stage 3,固定像素)
                                              │
                        (Stage 4) 打包 PPTX ──> (Stage 5) 注入 speaker notes
                                              ▼
                            _generated/ppt/{{OUTPUT_NAME}}.pptx
```

每页走哪条路:优先看那页显式声明的 `RENDER MODE`,没写则由 VISUAL TYPE 推(开场/分隔/结尾=full-page,其余=body+header-lock)。

## 编辑链:改了什么 → 只重跑哪几步

| 改了 | 跑哪些 stage | 耗时 |
|------|-------------|------|
| kicker / title 文字 | 1,3,4,5 | ~5 min |
| image prompt / 画面 | 1,2,3,4,5 | ~5 min/页 |
| speaker notes | 5 | ~30 sec |
| 视觉主干(backbone) | 重新生成 style master + `1,2,3,4,5 --force-images` | — |

## 进度对照:`ls 3_versions/{{CURRENT_VERSION}}/_generated/`

| 看到 | 说明 |
|------|------|
| 空 | 还没生产 |
| `slide_plan.json` + `page_prompts/` | Stage 1 完成 |
| `page_images_full/` | Stage 2 完成 |
| `header_locked/` | Stage 3 完成 |
| `ppt/{{OUTPUT_NAME}}.pptx` | 完成 ✅ |

## 命令

```bash
# 全量(跑前会自动 --check 结构)
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}} --stage all

# 最小重跑(见编辑链),如只改标题:
node PPTMAKER_FRAMEWORK/06_reference_scripts/unified_pipeline.mjs \
  --run-dir {{DECK_NAME}}/3_versions/{{CURRENT_VERSION}} --stage 1,3,4,5
```

> 完整方法论见 `PPTMAKER_FRAMEWORK/AGENTS.md`。目录宪法见 `06_reference_scripts/bundle_layout.mjs`。
```

---

## 复制到 `deck_{NAME}/CLAUDE.md`（一行指针）：

```markdown
# {{DECK_NAME}}

进入这个 run bundle 请先读 [deck-guide.md](deck-guide.md)——它说清了目录结构、控制流、
编辑链、以及下一步该做什么。目录结构的机器权威源：
`PPTMAKER_FRAMEWORK/06_reference_scripts/bundle_layout.mjs`。
```

---

## 填占位符指南

| 占位符 | 填什么 | 来源 |
|--------|--------|------|
| `{{DECK_NAME}}` | run bundle 目录名(如 `deck_ev_pitch`) | Phase 0 项目命名 |
| `{{OUTPUT_NAME}}` | PPTX 文件名 stem（如 `ev_pitch`，去掉 `deck_`） | 由 bundle 名推导 |
| `{{CURRENT_VERSION}}` | 当前工作版本(如 `v1`) | Phase 0 |
| `{{LANGUAGE_POLICY}}` | slides / 演讲语言 | Intake 第 4 问 |
| `{{CONTENT_CONSTRAINTS}}` | 不能出现在 slides 上的东西 | Phase 0.1 |
| `{{VISUAL_CONSTRAINTS}}` | 视觉禁忌 | Phase 0.1 |
| `{{VISUAL_PRESET}}` | 选中的视觉预设名 | BOOTSTRAP Step 3.5 |

> 约束项如果用户说"没有",写"无"——不要留空的 `{{...}}`。
