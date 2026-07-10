---
title: VERSION_LOG
stage: root
position: meta
type: changelog
summary: PPTMAKER_FRAMEWORK 的小版本迭代记录。只追 v1.x.x 线。v2 是未来的另一个目录。
depends_on: []
feeds_into: []
agent_action: reference
---

# VERSION_LOG — `PPTMAKER_FRAMEWORK/`

> 这个文件只记录 **v1.x.x** 的变更。大版本（v2、v3…）各有一个独立目录（`_ppt_framework_v2/`、`_ppt_framework_v3/`…），各自的 VERSION_LOG 只管自己的小版本线。
>
> 每次对框架的实质性改动（新增/删除/重构文件、修改管线行为、调整预设参数）都应在顶部追加一条记录。文档措辞微调不必记录。

## 版本号规则

```
v1 . 0 . 0
│   │   └─ PATCH：修 bug、改措辞、小修正（不影响使用方式）
│   └───── MINOR：新预设、新模板、新 catalog 条目、新功能（向后兼容）
└───────── MAJOR：不在这里——MAJOR 升级 = 新建 _ppt_framework_v2/ 目录
```

这个目录是 **v1**。大版本升级（如架构重写、不兼容的管线变更）会新建 `_ppt_framework_v2/`——它不是这个文件里的一条记录，而是一个全新的目录，有自己的 VERSION_LOG 从 v2.0.0 开始。

---

## v1.4.1 — Doc executability + Stage-2 hard gate（2026-07-11）

**代号**：Agent can follow the map

> 收敛入口文档与 Node 实现；把 `image2-ppt` 升为 doctor 硬闸门（本框架产品是 Image2 视觉表达，缺 skill = 不能生产）。

### 变了什么

1. `BOOTSTRAP.md` / 根 `AGENTS.md` / `CLAUDE.md` / `README.md`：栈叙事改为 Node 18 + npm；死链 `charter/charter/`、`workflow/00-setup/workflow/…`、`PTMAKER_*` 拼写、旧 `00_project_setup` / `06_reference_scripts` 路径全部对齐。
2. `env-check.mjs`：`stage2_generator` 缺失从 `warn` 改为 `fail`；READY 文案同步。
3. `bundle_layout.mjs --init`：deck-guide 命令改为 `node` / `ppt_flow`；不再铺 `pyproject.toml`。
4. `WORKFLOW.md` Phase 编号与 `AGENTS.md` 对齐；`COMMANDS.md` 标为意图路由附录。
5. 烧图 PPTX 在已知限制中标为**设计选择**（视觉表达优先于 PPT 内编辑）。

---

## v1.4.0 — Execution Hardening（2026-07-10）

**代号**：Make the Contract Real

> 把 v1.3 的文档契约落实为可执行行为：刷新不会跳过、版本不会带旧产物、override 真正按文件继承、style master 有统一入口、Phase gate 可跨会话执法。

### 变了什么

1. 新增 `generate_style_master.mjs`：读取源 prompt、加载 deck `.env`、桥接凭据并调用实际 image skill。
2. Chain B 的 `--only` 自动强制刷新指定图片；全量视觉刷新新增 `--force-images`；pilot 可用 `--resolution 1k`。
3. visual-style override 改为**按文件**解析，允许只覆盖 palette 而继承 backbone 的 system/style master。
4. 新增 `bundle_layout.mjs --new-version`，只复制 slide specs + overrides，永不复制 `_generated/`。
5. 去除 deck_system/style anchoring 的重复注入：Stage 1 组装完整实发 prompt，Stage 2 以 `--prompt-is-final` 只负责发送与附加 reference image。
6. metadata 新增 `content_gate` / `visual_gate`；Stage 2 readiness check 要求 `approved` 或明确 `waived`。
7. BOOTSTRAP 顺序改为隐喻/公式 → medium → visual preset，落实 Medium before color。
8. 新增统一测试入口 `vitest run`，补充 version/override/cache/gate/deck-guide、文档漂移 guard 与 Stage 1→3→4→5 offline E2E smoke test。
9. 初始化直接生成可执行的 `deck-guide.md`，不再只生成待填 stub。
10. Stage 2 完成后自动生成 `_generated/preview/contact_sheet.jpg`，pilot QA 有固定检查产物。

### 兼容性

- `header_lock.normal_safe_zone` 仍作为输入别名兼容；新 preset 统一写 `body_header_safe_zone`。
- `style_dir()` 保留给旧调用；新管线使用 `style_asset()` 做文件级 fallback。
- 旧 bundle 需在 `project-metadata.yaml` 增加 gate 字段，或明确写成 `waived` 后才能跑 Stage 2。

---

## v1.3.0 — 词汇统一 + Agent 铁律（2026-07-10）

**代号**：One Vocab / Contract

> 收敛一致性、执行遵从性、agent 友好性：一套 RENDER MODE 词汇、一条 Stage 2 官方路径、一页 agent 铁律。

### 变了什么

1. **RENDER MODE 唯一词汇**：对外与 `slide_plan.json` 一律使用 `full-page` / `body+header-lock`。字段为 `layout_contract.render_mode`（不再写 `header_variant`）。旧词 `image_direct` / `normal` 仅作**输入别名**兼容；Stage 3 读 canonical，旧 plan 的 `header_variant` 仍可映射。
2. **Stage 2 官方路径唯一**：`unified_pipeline.mjs` → `image2-ppt/scripts/generate_full_page_images.py`。原 `stage2_generate_images.py` 改名为 `stage2_generate_images.LEGACY.py`（默认不用）。
3. **charter/AGENT_CONTRACT.md**：10 条不可违反铁律（一页）。入口流变为 BOOTSTRAP → AGENT_CONTRACT → 按 Phase 翻 AGENTS（勿整本通读）。CLAUDE / README / QUICK_START / ANTI_PATTERNS 已对齐。

### 兼容性

- 旧 slide specs 若仍写 `RENDER MODE: image_direct` / `normal` → 自动归一化，无需改文件。
- 旧 `slide_plan.json`（含 `header_variant`）→ Stage 3 仍可跑；建议重跑 Stage 1 写出新字段。
- 无 image2-ppt skill 时仍可用 LEGACY Stage 2，但 agent 默认路径不变。

---

## v1.2.0 — 三层分化梯度（2026-07-09）

**代号**：Gradient

> 本版**取代 v1.1 的扁平 `_build/` 布局**。v1.1 把源/派生分开了(对的),但版本轴切错了地方——`cp -r v1 v2` 会把整个 deck(含 research、视觉)复制一份,共性分叉,正是 bug 0007 换个轴复发。v1.2 按"信息分化梯度"重构:越上游越共享,越下游才切版本。

### 变了什么

run bundle 现在是**三层分化梯度**(唯一权威源:`scripts/bundle_layout.mjs`,跑它打印权威树):

```
deck_{NAME}/
├── 1_upstream_raw_material/   ← 上游:原始素材,共享,只增
├── 2_backbone/               ← 中游:主干(隐喻/公式/约束/大纲/讲稿/视觉),共享,默认事实源
└── 3_versions/v{n}/          ← 下游:微调+生产,版本只切这里
    ├── slide-specifications.md   (每页规格,管线入口,每页声明 render mode)
    ├── overrides/               (只放这版偏离 backbone 的东西)
    └── _generated/             (派生品,可 rm -rf 重建)
```

- **版本 = 下游 delta**。`cp -r 3_versions/v1 3_versions/v2` 只复制 slide 规格 + overrides;backbone/上游引用共享,不复制 → 共性永不分叉。
- **下游从 backbone 汲取,可局部 override**。版本 `overrides/<X>` 存在就用它,否则回退 `2_backbone/<X>`(`bundle_layout.resolve_backbone_asset`)——给下游灵活度又不拷贝分叉。
- **目录结构 SSOT = `bundle_layout.mjs`**。所有脚本 import 它取路径,文档树是它的人读镜像。彻底根除"结构信息散在各处、各自漂移"的碎片化(用户核心诉求)。
- **prompt 是一等资产**。每页 prompt 拆成 `_generated/page_prompts/NN_id.prompt.md`(人读)+ `_prompts.json`(机器);style master 的 prompt 存为 `2_backbone/visual-style/style-master-prompt.md`(以前画完就丢)。
- **两个 render mode 显式化**:每页在 slide-specifications.md 声明 `full-page`(整页 image-2)或 `body+header-lock`(image-2 画 body + Python 叠标题)。
- **`deck-brief.md` 拆成 4 个模板**:`template-core-metaphor` / `template-core-formula` / `template-design-constraints`(→ backbone)+ `template-slide-specifications`(→ 版本)。
- **`_build/` → `_generated/`**;**per-bundle guide** 从 `template-deck-guide.md` 生成(`deck-guide.md` 人读控制流 + `CLAUDE.md` 一行指针)。

### 修复的 bug

- **0007**(视觉参数散落、拷贝即分叉)→ 根治:共性只在 backbone 一份;prompt 一等资产;SSOT 单一源。

### 兼容性

- v1.1 的扁平 run bundle(`v{n}/{session_design,style,_build}`)需要迁移到三层:内容 → `2_backbone/` + `3_versions/v1/slide-specifications.md`;视觉 → `2_backbone/visual-style/`;产物目录名 `_build/` → `_generated/`。用 `--run-dir deck_{NAME}/3_versions/v1` 调用管线。

---

## v1.1.0 — 目录结构锁定（2026-07-09）

> ⚠️ 本版的扁平 `_build/` 布局已被 **v1.2 三层梯度**取代。以下为历史记录。

**代号**：One Shape

### 变了什么

**run bundle 只有一种形状了。** 之前 run bundle 结构散落在 ~11 个文件里，互相矛盾（脚本文件名、`style/` 内容、JSON 放哪、`-v1` 后缀、trace 扩展名、pptx 名各说各话），agent 照着读根本拼不出一致的目录，只能临场发挥——这就是 bug 0005 的根。现在：

- **源与派生物理分离**。`v{n}/` 下只有两个源目录（`session_design/` + `style/`，你手改），脚本生成的一切进 `_build/`（绝不手改，可 `rm -rf` 后重跑重建）。打开 `v{n}/` 只看到三样东西，边界自明。
- **唯一权威定义**落在 `workflow/00-setup/01-directory-template.md`。AGENTS.md、scripts/README、workflow/04-production/* 全部对齐到它。
- **管线路径写死在 `unified_pipeline.mjs` 常量里**，不再靠人工传 `--out-dir`。stage1/stage3 解耦了"写产物"和"读 style"的位置（新增 `--style-dir`）。
- **脚本就地运行**，不再复制进 `v{n}/scripts/`——少一个分叉源。
- **文件名去掉 `-v1` 后缀**（bug 0004）；版本只由 `v{n}/` 目录承载。
- **新增 per-bundle `CLAUDE.md` 模板**（`workflow/00-setup/template-bundle-claude.md`）——每个 run bundle 的反临场发挥护栏，agent 进目录先读它就知道能改什么、别碰什么。

### 修复的 bug

- **0004**（`-v1` 冗余后缀）→ resolved
- **0005**（目录约定被随意违反）→ resolved

### 已知 follow-up（未纳入本版）

- 脚本级 `--out-dir` allow-list 校验、目录改名自动更新引用（见 `_todos_bugs/0005` 文末）——结构锁定后的加固项。

### 兼容性

- 现有旧 run bundle（产物在 `v{n}/` 根、带 `-v1` 后缀）需要迁移：把生成物移进 `_build/`。脚本对独立调用保留了向后兼容的 style 目录探测，但推荐统一走 `unified_pipeline.mjs`。

---

## v1.0.0 — 小白可用（2026-07-08）

**代号**：Turnkey

### 现在你能做什么

**从零到 PPTX，只跟 Agent 说话。** 你唯一要做的是告诉 Agent 你想要什么 PPT——融资 pitch、战略 keynote、培训课、还是研究报告。Agent 问你几个选择题（听众是谁、多长时间、最想让人记住什么），然后自动生成隐喻候选、推荐视觉风格、搭好 slide 骨架。你确认方向，Agent 跑管线，拿到 PPTX。

**不用懂配色。** 从 5 套经过实战验证的视觉预设里挑一个——Dark Executive（深色高管风，T10 实战胜）、Clean Clinical（白底数据风）、Warm Editorial（暖色编辑风）、Tech Startup（深紫科技风）、Corporate Safe（企业蓝保守风）。选了就能用，不需要调色板。

**不用发明隐喻。** Agent 从 22 个隐喻模式里做匹配，给你 2-3 个候选。你做选择题——"这个对"或"换一个"。

**不用学管线。** 一条命令跑完 5 个 Stage（解析 markdown → AI 生图 → Python 叠加标题 → 打包 PPTX → 注入演讲备注）。改一个字不用重跑全流程——Agent 自动判断影响范围和最小重跑路径。

**改东西说人话就行。** "第 5 页的案例换成特斯拉"、"颜色太暗了"——Agent 听懂自然语言，内部分类到对应的编辑链，告诉你要多久，执行。

**跨 Agent 可用。** Claude Code、Codex、Cursor 都能用。Agent 读到 BOOTSTRAP.md 就知道该干什么。

### 现在你还做不到的（以及怎么办）

- **Slides 上放中文**：预设默认英文。要用中文需要 Agent 手动改 deck_system.txt + 切换 stage3 字体。支持，但不自动。
- **在 PowerPoint 里直接改文字**：PPTX 是图片容器——每页是一张完整图片。要改文字得回到源 markdown 改，然后重跑 Chain A（~5 分钟）。
- **用自己的 Logo**：预设默认无 logo。需要 Agent 在每个 IMAGE PROMPT 中描述 logo 位置，并编辑 deck_system.txt 放开禁止规则。
- **不喜欢 5 个预设**：告诉 Agent "我想自定义风格"，Agent 会切到 Expert Mode 带你从头设计视觉系统。
- **断网后继续生图**：Stage 2 崩了重跑全量（但已下载的图片会跳过，不浪费 API 调用）。

### 这个版本基于什么

v1.0.0 的前身是 T9（30 页 3-session keynote + breakout）和 T10（19 页单 session 战略简报）两个真实项目中长出来的方法论框架——Style Anchoring、Header-Lock、四层 slide 规格、三编辑链。那些核心资产没变，变的是**入口**：从"你得先读完 60 个文件才能上手"变成了"Agent 读 BOOTSTRAP.md，你回答选择题"。
