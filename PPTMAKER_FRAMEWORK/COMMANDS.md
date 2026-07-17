# 命令路由表（附录）

> **日常入口是 [BOOTSTRAP.md](BOOTSTRAP.md) + `scripts/ppt_flow.mjs`。**
> 本文件是自然语言 → playbook 的意图路由附录——用户说一句话时，Agent 可用来匹配改动类型；
> **不要**把本文件当成启动手册，也不要跳过 BOOTSTRAP / AGENT_CONTRACT。

> 你说一句话 → Agent 判断意图 → 加载对应 Playbook 执行.
> 每个 Playbook 是一个 MD Controller, 定义有序 Node 序列 + Entry/Exit Gate.

用户不需要记路径名，直接说要改什么即可。英文名称是维护者和 Agent 的检索词：Header Text & Style Refresh、Generated Image Rebuild、Notes-Only Refresh，以及外层的 Structural Versioning Path。Agent 先判断是否增删重排，再看内容由谁渲染、哪个产物已经失效；意图 route 不等于执行路径。

谈页面时同时保留两个维度：`position` 是当前快照里的页序号，正式 `slide_id` 是跨版本身份。用户可以说“第 7 页”“UX gap 那页”或 `UXGap`；Agent 用 `ppt_flow slides resolve` 一次性绑定后，以 `07 · UXGap · Why onboarding breaks` 回显。顺序变化后继续用 ID，不能把旧“第 7 页”硬套到新顺序。

## 全量创建

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "帮我做一个PPT" | `create-deck` | 11 nodes, 从 instantiation → final |
| "我要做一个关于X的演示" | `create-deck` | 同上 |

## 探索 & 预览

> 还没全量交付、也不是改已有 PPTX——pre-commitment 试探。
> 推荐顺序：视觉 LOCK（可用 `iterate-style`）→ `quick-preview` → `build`。
> 不要把「打磨 style master」路由到 post-PPTX 的 `edit-visual`。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "先定视觉方向，反复打磨 style master" | `iterate-style` | 1k loop → LOCK 升 2k |
| "视觉风格不满意，再调一版" | `iterate-style` | review-gate RETRY / 锁后反悔模式 C |
| "内容有了，先出 3 页典型页看看效果" | `quick-preview` | 须 gates 已批；contact sheet |
| "先预览一下再决定要不要全量" | `quick-preview` | PROCEED 再 build |

## 旁路 / 迁移

> 已有 deck、旧布局、或外部素材要迁进本框架宪法树——**不是**从零 `create-deck`，也**不能**跳过 show/gate。
> 全程遵守 AGENT_CONTRACT §11。迁法在 playbook 里以 A/B/C 候选让用户认。

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "把已有的 deck 迁到新框架" | `migrate-import` | 对齐目录 + 早期 show + 重申闸门 |
| "导入以前的 PPT/素材进这个项目" | `migrate-import` | 同上 |
| "旧版 run bundle 要升到三层结构" | `migrate-import` | 映射旧路径；禁止静默裸奔 |

## 环境 / 画画通道

> Image2 通道体检——哪家通、哪家快、建议 base URL。用户**不必**背 `doctor --probe-vendors`。
> 症状时刻（doctor 图像红 / smoke 败 / 出图 502·全挂 /「画不出来」）且本 session 未 probe：白话亮能力——「要不要我逐家试一下你配的画画通道？」

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "哪家画画通道能用" | `probe-image-channels` | 逐家 probe + Summary |
| "帮我试一下图像 API 供应商" | `probe-image-channels` | 同上 |
| "出图一直 502 / 中转挂了" | `probe-image-channels` | 症状 → 通道体检 |
| "生不了图 / 画不出来" | `probe-image-channels` | 症状 → 通道体检 |
| "换一家画画的" | `probe-image-channels` | 报告后 confirm-write 改顺序 |
| "哪家出图更快" | `probe-image-channels` | Suggested 按耗时排序 |

## 迭代打磨

| 用户说 | Playbook | 入口参数 |
|--------|----------|---------|
| "第N页标题改一下" | `edit-text` | slide=N, field=title |
| "第N页标题不够有力" | `edit-text` | slide=N |
| "kicker 改成 XXX" | `edit-text` | slide=N, field=kicker |
| "第N页的图重新生成" | `edit-visual` | slide=N |
| "第N页 KPI 改成 50%" | `edit-visual` | image-owned body text, slide=N |
| "第N页卡片/图表标签改一下" | `edit-visual` | image-owned body text, slide=N |
| "案例从 X 换成 Y" | `edit-visual` | 按受影响页重建生成图 |
| "换个配色试试" | `edit-visual` | scope=all, pilot=true |
| "全部换成蓝色系" | `edit-visual` | scope=all, pilot=true, force=true |
| "整体感觉不够高端" | `edit-visual` | scope=direction (回 Phase 1, 重选 preset) |
| "备注改一下" | `edit-notes` | — |
| "加一页案例在最后" | `restructure-slides` | action=add；Agent 写内容并命名 5–8 字母两块 BlockCase ID |
| "删掉第N页" | `restructure-slides` | action=delete；先把 position snapshot 绑定为正式 ID |
| "把 UX gap 那页放到第 3 页后" | `restructure-slides` | action=reorder；spoken mnemonic + position 在一个 snapshot 解析 |
| "第N页和第M页换个顺序" | `restructure-slides` | action=reorder；preview before/after 后再确认提交 |

## 内容 & 方向变更

| 用户说 | Playbook | 说明 |
|--------|----------|------|
| "这段论证逻辑有问题" | `create-deck` | 回 checkpoint-final-review → rerun → seed-topics |
| "换个案例, 用X代替Y" | `edit-visual` | 案例烧在 body 图片中；受影响页走 Generated Image Rebuild |
| "每页的数据都更新一下" | `edit-visual` | KPI/card/chart 等 image-owned 数据按受影响页走 Generated Image Rebuild |

## Agent 分类顺序

1. 增/删/重排 slide：先进入 Structural Versioning Path。Agent 解析 selector，生成 no-write preview，向用户展示 before/after；内部保留 `plan_sha256`，确认后用同一 hash 提交干净 vNext。用户不需要记 hash。
2. 判断所有权和失效产物：resolved `body+header-lock` 的 KICKER/TITLE/SUBTITLE 及 Stage-3-owned header 字体、颜色、位置、行高、间距可用 Header Text & Style Refresh；full-page header、body 文案/数据、画面、prompt、render mode 或 safe-zone 改动使用 Generated Image Rebuild；只有 speaker notes 失效时使用 Notes-Only Refresh。
3. 解析明确 slide scope；Generated Image Rebuild 对已有图片必须实际强制重生并 review。raw `unified_pipeline --only` 只限定范围，不隐式 force。
4. 大范围视觉变化先跑代表性 pilot，经用户 review 后再扩展到确认范围。

Structural apply、impact 和 cross-version materialization 一律 renderer-free。retained raw 只有 stable ID、engine、kind、generation fingerprint/profile 和 bytes 全部验证后才能物化；Stage 3/contact sheet/PPTX/notes 在目标本地重建。`needs_render` 是成本提示，不是授权：Agent 先报告 ID 数量与成本，再单独获得 Generated Image Rebuild 授权。stale preview 重新生成，不 rebase。若一版内反复冲突，按“新 preview → 新 vNext → 新 deck”升级；受众、主叙事或设计系统分叉时直接建议新 deck。

标题请求统一进入 `edit-text` 并调用 `ppt_flow refresh --kind title`：resolved `body+header-lock` 使用 Header Text & Style Refresh；resolved `full-page` 使用 Generated Image Rebuild，按 CLI 回执执行 `pilot --only <ids> --force-images`、header review 和 reviewed-image reuse。Header safe-zone 高度或 render-mode 改动会改变 raw-image contract，即使表面上也属于“页眉”，仍必须使用 Generated Image Rebuild。

## 可选 Git 与版本回访

可见 `vN` + Structural Versioning Path 是 deck 工作版本的唯一框架权威；Git 可另行作为用户拥有的 source/control 审计与比较，不是第二个 slide order 来源、创建/渲染前提或原地回退工具。`_generated/` 是可重建派生品，不手改、不手动跨版本复制、不 force-track，也不是 Git recovery target。

用户要回访 deck `vN` 时，保留所有可见版本，走既有 escape ladder：标题/小问题修当前版本；同一方向的大改发布 clean vNext；vNext 中明确 `needs_render` 后另行授权 rebuild；受众、目标或叙事实质改变时建议新 deck。本 change 不提供 Git history reader、source-content comparison、`git checkout` / `git restore` fallback、框架 source replacement、recovery receipt 或默认 recovery protocol。

用户若要处理自己的 Git history，Agent 必须先取得对一个**命名 Git 操作和用户给定范围**的明确授权，并复述后只协助该操作。普通 checkpoint 同意不包括 `git status`、`git diff` 或其它 inspection；没有该授权时不得检查 cleanliness，也不得 init/add/commit/push/pull、改 remote、restore/reset/checkout/clean 或丢弃改动。

## 续跑 / 做到哪了

> 小白断线、清聊天、合盖再开——进度在 **deck 磁盘**，不在聊天。这是**整流程** session resume，不是新 playbook；活跃 playbook = `_state.playbook`。

| 用户说 | 动作 | 说明 |
|--------|------|------|
| "接着做" / "继续" | session resume ritual | `state`+`status` → 从 `current_node` 续 |
| "我做到哪了" / "上次做到哪" | 同上 | 先人话汇报（Summary/Next），再动手 |
| "清了聊天继续" / "断线了继续" | 同上 | 禁止默认绿场 intake / 从 node 1 重开 |

## Agent 路由逻辑

```
用户说了一句话
  → 读 COMMANDS.md, 匹配意图
  → 若已有 deck 且（续跑说法 | 用户只丢了 deck 路径）
       → session resume ritual（state+status → 人话 where-am-I → 从 current_node 续）
  → 否则确定 playbook 名 + 入口参数
       → 加载 playbook/<name>.md (MD Controller)
       → 有 in-progress _state 且同 playbook → 从 current_node 续
       → 确认的绿场 → 从第一个 node 开始
  → 节点进出 writeState；等人写 waiting_for / note
```
