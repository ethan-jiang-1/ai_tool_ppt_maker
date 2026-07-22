---
title: AGENT_CONTRACT — 你的 PPT 助手
stage: root
position: contract
type: playbook
summary: Agent 每次 session 先读这一页。定位：助手，不是质检员。详解在 AGENTS.md。
depends_on:
- BOOTSTRAP.md
feeds_into:
- AGENTS.md
agent_action: read_first
---

# AGENT_CONTRACT — 你的 PPT 助手

> **我是来帮你把 PPT 做成的，不是来卡你的。**
> 能过就帮过，过不了告诉你下一步。不审判，只引导。
>
> **读完这一页就能开工。** AGENTS.md 是详解手册，不是每次都要通读的入口。

## 1. 入口顺序

`BOOTSTRAP.md`（环境 + intake）→ 本文件 → 按 Phase 执行时再翻 `AGENTS.md` 对应章节。
不要跳过 BOOTSTRAP 直接临场发挥目录。

**已有 `deck_*` / 断线 / 清聊天：** 进度在**磁盘**——`_state/state.yaml` 是执行指针 SSOT，整流程 where-am-I 再配合 `ppt_flow status` / 产物。聊天上下文不是进度真相。显式已知 `<run-dir>` 时，先跑 session resume（`ppt_flow state <run-dir> --json` + `status` → 人话汇报 → 从 `current_node` 续），并消费 `workflow_inspection.primary_action` 与 owner-issued `continuation`；再决定是否绿场 intake。节点决策只能由拥有该动作的 public CLI 写入；Agent 不手改 `_state`、不把对话当 approval，等人时只通过 owning route 持久化 `waiting_for` / `note`。

**RUN_BUNDLE locator entry（无已知 run-dir 时）：** 用户可以给出 `RUN_BUNDLE.md` bytes；原始
card 的可读本地路径只是 deck relocation 的受控 fallback，不是前提。按以下顺序、全程零写执行：

1. 调用 `scripts/shared/run-bundle/run_bundle_locator.mjs` 的 locator resolver。它只接受 card
   bytes，以及可选 original-card path 或人类明确给出的 deck/framework root；不以 cwd、目录枚举、名称或时间猜路径。
2. resolver 成功后，只通过 state owner 的 observe/no-heal read 和
   `resolveContinuationTargetVersion` 读取 selector：active `run_version` 优先；否则使用
   `continuation_target_version`。不得用第二个 YAML parser 解析、验证、heal 或解释 state 的其余字段。selector 成功后形成唯一 `<deck-root>/3_versions/vN`。
3. 仅在 exact run 已知后，运行 `bundle_layout --check <run-dir> --structure-only`，再运行该
   framework root 的 `ppt_flow state <run-dir> --json` 与 `status`，然后才按用户的自然语言请求路由。

这不是新的 CLI，也不是 attachment provenance validator。`--check` 只校验 exact version 的结构，既不从 deck root 选版本，也不验证上传来源。resolver 的 `guide` 是零写：`*_unavailable` / `*_unverified` 时只请求命名的 explicit root 或本地修复；`*_conflict` 时请求当前 `RUN_BUNDLE.md` 或修复冲突 card/root 后重新解析，不能拿另一条路径覆盖。不得搜索、重上传建立 provenance、重开 terminal work，或把聊天请求当 approval。terminal deck 仍可只读检查，但只转向既有 rerun / new-version / new-deck 路径。host 无法访问 card 声明的本地 roots 时必须请求所需 root；generic remote-chat attachment integration 不在本框架范围。

Attachment-host integration harness 不属于本仓库；此合同不声称 generic chat attachment 可以成功解析。

## 2. 目录是宪法

结构唯一事实源：`scripts/shared/run-bundle/bundle_layout.mjs`。
- 创建：`--init deck_{NAME} --deck-type … --style …`（禁止手动 mkdir/cp 拼骨架）
- 校验：`--check … --structure-only`（Phase 0）/ 管线跑前自动全量 check
- 不自创目录、不把生成物乱放

**上严下松（组织层级）：** run bundle **根最严**（只许宪法级 control / 三层 / `_state` / `_lessons`）；越往下越松；版本内临时/`.bak` **只**放 `3_versions/v{n}/_scratch/`。禁止在 deck 根堆 `_slidespec.bak*`、自创 `_tmp/` / `backup/`。

## 3. 源 vs 派生

| 可手改（源） | 绝不手改（派生） | 临时（可删） |
|-------------|-----------------|-------------|
| `2_backbone/` | `3_versions/v{n}/_generated/` | `3_versions/v{n}/_scratch/` |
| `3_versions/v{n}/slide-specifications.md` | PNG / JSON / PPTX | 改源前的 `.bak` / 草稿 |
| `3_versions/v{n}/overrides/` | | |

改动永远从源 markdown 开始，再重跑管线。临时备份不进 `_generated/`，不进 deck 根。

## 4. Phase 顺序与闸门

```
0 初始化 → 1 内容 → 2 视觉 → 2.7 回填 L3 → 3 HTML 生产 → （可选）4 visual-slot refinement → 5 迭代
```

- Phase 1 与 2 可交换，**不可跳过**
- Phase 3 必须在 1+2 **都锁定**后启动
- Phase 4 的普通入口要求当前 HTML delivery review 为 `proceed` 且 evidence complete；若 final-slide identity 可验证，用户可用 `image2 plan --force --reason` 创建**仅离线**的 prerequisite waiver，仍必须授权精确 plan hash 才能生成。它不是完成 gate。每页独立 `accept` 或 `use-html`，普通 HTML 路径始终 provider-free。
- 每个 Phase 结束等用户确认。HTML gate/delivery 决定由 version-scoped owning CLI 写入；`approved`、`waived` 与 `evidence_complete` 是三个独立事实。Stage 2 会展示建议修复和当前 evidence；用户坚持承担可逆风险时，以简短原因显式 continuation，状态保持 `waived`，绝不把 metadata mirror 或成功渲染当 approval。
- **教训捕获：** 解决任何经过 3+ 次尝试才搞定的错误之后，主动问一句 "Worth writing a lesson to `_lessons/`？" 在每个 Phase gate 确认前，检查有没有值得留下但还没写的教训。用 `lessons.mjs add <runDir> --title "<slug>"` 捕获。规矩见 `_lessons/README.md`。

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

新 `--init` deck 在 `slide-specifications.md` frontmatter 中使用 `render.default: full-page`；逐页 `RENDER MODE` 只是高级 override。没有顶层 `render` 的旧 deck 保持 legacy VISUAL TYPE 派生。`render` 内未知键会 fail-loud；顶层误写成 `renders:` 无法在不破坏 legacy 兼容的前提下猜测纠正，排障查看 `layout_contract.render_mode_source`。

每页同时有稳定 `slide_id` 和派生 `position`。用户可说“第 7 页”或“UX gap 那页”，Agent 必须解析为当前快照中的 `07 · UXGap · title`；顺序变化后用 ID 继续追踪，不能把旧页码当永久身份。新 deck 使用 `identity.scheme: mnemonic-v1`；Agent 命名 5–8 个 ASCII 字母、恰好两个 BlockCase 语义块，优先 5–6 个字母，不让用户编随机 token。

## 7. 运行时只有 Node；Stage 2 在框架内；CLI 失败必出 JSON

**唯一运行时：Node.js ESM。** 禁止 Python / bash / 外部 skill 作为生产路径（跨平台会断）。

官方 Stage 2：`unified_pipeline.mjs` → `scripts/05-iteration/legacy-image2/stage2_generate_images.mjs` + `make_contact_sheet.mjs`（均在框架内）。
Style master：`scripts/05-iteration/legacy-image2/generate_style_master.mjs` → `image_api_client.mjs`。
不发现 `.claude/skills` / `.agents/skills`。

**CLI 硬失败**：非零 exit **之外**必须向 **stderr 最后一个非空行**输出唯一 JSON envelope，并用受支持的 `diagnostic` 交付 JS 已知的 source/artifact lineage 与安全 `next`。MD 只使用完整校验的版本；`requires_human:true` 必须停下，`program`/`args` 保持参数边界，未知证据不猜，`_generated/` 不手改。producer 细则见 capability `cli-surface`，consumer 语义见 `charter/NODE-SPEC.md`。

新建 run bundle 的 `AGENTS.md` / `CLAUDE.md` 都先指向 `RUN_BUNDLE.md` 再指向 `deck-guide.md`；运行时 Agent 从 guide 获取同一套 consumer essentials，不依赖 repo-only OpenSpec 路径。

**坏 state / 坏压模：先 heal 或重写合法文件再继续。** 禁止把 YAML/JSON 语法题甩给用户。见 `charter/CONSTITUTION.md`「MD↔JS 互补健壮性」。

## 8. 刷新路径（改完怎么重跑）

| 正式路径 | 改了什么 | 逻辑执行 | 耗时 |
|---------|---------|---------|------|
| Header Text & Style Refresh | resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE 或 Stage-3-owned header 样式，raw-image contract 不变 | Stage 1 → 3 → 4 → 5 | ~5 min |
| Generated Image Rebuild | full-page header、body/画面/IMAGE PROMPT，或 render mode / safe-zone 改动 | Stage 1 → 对所选页强制 Stage 2 → review → 3/4/5（复用已审图） | ~5 min/页 |
| Notes-Only Refresh | speaker notes only | Stage 5 | ~30 sec |
| Structural Versioning Path | 增/删/重排 slide | stable-ID preview → 用户确认 before/after → exact `plan_sha256` 提交干净 vNext → verified raw-only materialization → 本地重建 | 按范围 |

标题是否需要 Stage 2 取决于 resolved mode：`body+header-lock` 使用 Header Text & Style Refresh；`full-page` 使用 Generated Image Rebuild。后者的 raw `unified_pipeline --only <id>` 只限定范围，不会自动重生已有图片，必须同时使用 `--force-images`；公共 `ppt_flow refresh --kind visual --only <id>` 会为明确范围加 force。分类见 `scripts/05-iteration/change-classifier.md`。

结构 preview 的 hash 由 Agent 保留，用户只确认变化。stale source/hash mismatch 必须重新 preview，不 rebase。Structural apply、impact 与 materialization 不得调用远端 renderer；只有 manifest 证明完整的 raw render 可以跨版本物化，Stage 3/contact sheet/PPTX/notes 在目标本地重建。`needs_render` 只报告后续成本，不能把结构授权扩张为生图授权。若一版内无法清晰收敛，按新 preview → 新 vNext → 新 deck 升级；受众、主叙事或设计系统分叉时直接建议新 deck。

## 8.1 可选 Git，用户拥有

可见 `vN` 与 Structural Versioning Path 是 deck 的工作版本权威；Git 仅是用户拥有的 source/control 审计与比较层，绝不成为第二个排序来源、生产前提或框架提供的回退机制。`_generated/` 始终是可重建派生品，绝不是 Git 恢复目标，也不要求强制追踪。

Agent 只能在当前 interaction 已知发生实质 source 工作时，在一个 deck 的连续 source-work episode 内最多给一次非阻塞 checkpoint 建议。用户拒绝或暂缓后，本 episode 不再提醒。建议本身不授权检查工作树或执行 Git 操作。

没有用户对**命名操作和精确范围**的明确授权时，Agent 不得暗中检查 Git 状态、cleanliness、`git status` 或 `git diff`，也不得 init、add、commit、push、pull、改 remote、checkout、restore、reset、clean 或丢弃改动；clean worktree 不是任何 deck 阶段的 gate。用户明确授权后，先复述该操作与范围，只协助它本身，不推断涉及文件、暂存状态或效果。普通 checkpoint 授权不包含任何 inspection。本框架不提供 Git history reader、自动 source replacement 或默认 recovery protocol。

## 9. 用户做选择题，你做创造性劳动

隐喻 / 公式 / 视觉：给 **2–3 个候选** + 推荐理由，让用户选。
不要问"你的隐喻是什么"。用户说"不知道" → 换角度或给最佳猜测让确认。

## 10. Medium before color

Phase 2：先锁画风（sketch / diagram / photography / 3D / mixed），再选配色 / preset。
不要先甩色板让用户"喜欢哪个颜色"。

---


## 11. 交互节律

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

---

## 12. Gate 是向导，不是路障

Gate 被触发时，必须给 MD Controller 三样东西：① 什么变了（具体到 slide id + 字段）；② 可执行命令（MD 直接跑）；③ 默认路径（不确定时怎么办）。能在代码层自动修的（格式、fingerprint 清理）直接修好继续。必须人来判断的（视觉质量、标题措辞）给候选 + 推荐。永远不让用户面对一堵墙。

每个 gate 还必须明确其结果：`guide` 是可安全自动修复的建议；`confirm` 是可逆的质量或流程风险，先给推荐修复，再由人以简短原因选择显式 continuation；`hard-stop` 保护 version/reset/plan identity、state/byte/path integrity、并发 writer、provider authorization 或 recoverability。hard-stop 不提供强制绕过。continuation 写入当前版本的 `waived` 决定，永远不是 `approved`，也不代表 evidence complete。对 exact run，先消费 `state --json.workflow_inspection.primary_action` 与 owner-issued continuation；`state --validate-state` 只读，repair 仍走 producer 指定的 public command。完整规则见 `openspec/policies/human-centered-gates.md`。

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
  deck_{NAME}/3_versions/v1 content --plan-hash <current-hash>

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

# gates / playbook state
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  deck_{NAME}/3_versions/v1 --check-gates
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state \
  deck_{NAME}/3_versions/v1 --validate-state
```

## 详解去哪翻

| 需要时 | 打开 |
|--------|------|
| Phase 逐步怎么做 | `AGENTS.md` 对应 Phase 节 |
| 改动分类 | `scripts/05-iteration/change-classifier.md` |
| 常见错误 | `reference/anti-patterns.md` |
| 术语 | `reference/glossary.md` |
| 人类 Quick Start | `reference/quick-start.md` |
| 方法论深挖 | `workflow/02-visual-system/`–`workflow/05-iteration/` 各模块 README |
