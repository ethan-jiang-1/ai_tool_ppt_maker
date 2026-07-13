# Plan: 打磨"视觉迭代"环境 — style master 生成 + 小样出图的环境/管道改进

> 类型: 复盘 / 设计 | 更新: 2026-07-11

## 背景 / 现状

触发：一次**真实**的视觉迭代（把 `deck_ai_sdlc_keynote` 的人物从"旧时代"改成现代）——重生成 style master + 出 3 页 pilot 小样。全程亲历一串"环境/管道层"摩擦，据此复盘。

判断：**方法论 / 纪律层设计合理，问题集中在环境/管道层**（凭据 + image API 客户端 + 预览闸门 + 长渲染 + 约束漂移）。以下每条都有本次实证。

## 现状好的部分（保留，不动）

- iterate-style 纪律：归档旧版 → 1k 迭代 → 2k 锁 → round 计数。
- style master 作不可变视觉锚，`--style-reference` 传导到每页。
- pilot 自动选 opener/body/closer 代表页。
- 第 7 条铁律：CLI 硬失败吐单行 JSON envelope（让本次多个 bug 可快速定位）。

## 改进点（6 条，按优先级）

### bug 类（→ `_backlog/bugs/`）

**1. doctor 应做一次真·冒烟测试（1 call）** — `env-check` 把 `image_base_url` 标成"可选 ✓（用默认端点）"，实际出图**硬要求**它 → 一直深到 `style-master` 才炸 `✗ No image API base URL`；key 同理（只看"填没填"、不看"能不能用"）。
- 改：doctor 加一个最小真实 API 调用（或 `--smoke`），把 base_url / 端点 / key 可用性**提前在 Phase 0** 暴露。
- 关联 BUG-006（env 对 `.env` 向上找、对 deps 只看 cwd 的不一致）。
- 证据：本次 `env-check` 全绿假象 vs `style-master` 深层失败。

**2. image_api_client：契约单一真相 + 回放 trace 做 fixture 测试** — 本次连撞两个响应格式不匹配：BUG-008（submit 不认 `data:[{task_id}]` 数组，`:113`）+ `/tasks/{id}/result` 端点不存在（结果其实内嵌在 poll 完成响应 `data.result.images[0].url`；我已改 orchestrator 优先取 poll 内嵌图）。根因："对该 relay 的响应契约没有单一真相，submit/poll/result 各自假设不同形态"。
- 改：抽"从任意响应体提取图 ref"的单一函数（本轮已落 `extractImageRef`/`saveImageRef`），并把 `*.image2-task.json` trace 当 **golden fixture** 写解析单测。
- 证据：BUG-008 卡 + 本轮对 `image_api_client.mjs` 的修改。

**3. `--only` 的 slide-id 反直觉（UX bug）** — 传 `slide_03` → `✗ Unknown pilot slide IDs`，真实是 `s03_one_tool_two_modes`，需先跑 Stage 1 读 `slide_plan.json` 才知道。
- 改：`--only` 接受页号（`3`）/前缀（`s03`）/模糊匹配；或 `pilot` / `status` 直接打印可用 id 清单。
- 证据：本次 pilot 第一次因 id 失败。

### 设计改进类（→ OpenSpec change）

**4. 锁定前预览不该被迫 `--waive` 两门** — 想先看 3 页，框架唯一合法路径是把 content + visual 门写成 `waived`（语义="有意跳过 review"）；可我们明明**正在 review**，state 因此失真。
- 改：一等 `preview` 模式 / gate 态（如 `previewing`），渲染 N 页而**不篡改** approve/waive 语义；`quick-preview` playbook 应支持 pre-approval 预览。
- 证据：本次为出 3 页，先 `approve … content/visual --waive`。

**5. 长渲染 UX：心跳 + 可续 + 单页超时** — pilot 顺序出图、无进度输出；前台等撞 10 分钟墙、管道还吞了输出；某页轮询可独占 600s 吃光预算；`--force-images` 每次全量重渲、不跳过已好页。**这违背框架自己的第 11 条"长任务给心跳"。**
- 改：Stage 2 逐页流式进度；每页独立超时；默认跳过已渲染页（要重渲才 `--force`）；pilot 支持后台 / 断点续跑。
- 证据：本次 pilot 前台 10 分钟超时、输出丢失 → 改后台重跑。

**6. style master 与 deck_system.txt 会漂移** — style master **只读** `style-master-prompt.md`、不读 `deck_system.txt`；本次"现代人"这条我得在**两个文件各写一遍**，两边一旦不一致就会锚图与页面打架。
- 改：生成 style master 时自动注入 / 共享 `deck_system.txt` 的约束块（颜色 / 禁用 / 主体），单一真相。
- 证据：探查确认 `generate_style_master.mjs` 只读 prompt 文件；本次改了两处。

## 风险 / 取舍

| 风险 | 缓解 |
|------|------|
| 冒烟测试要花 1 次 API 调用（钱/时间） | 设为可选 `--smoke` 或"填了 base_url 才测" |
| `preview` 新 gate 态要改 state schema + checkBundle | 与现有 approve/waive 并存，别破坏 pipeline-readiness 语义 |
| style master 注入 deck_system 可能污染"风格指南参考图" | 只注入**约束**（颜色/禁用/主体），不注入某页内容 |
| 逐页超时/续跑改动 Stage 2 核心 | 加回放 fixture 测试兜底（见 #2） |

## 落地关联

- **bug 卡**（`_backlog/bugs/`）：#1（doctor 冒烟 + BUG-006 归一）、#2（trace fixture 测试；BUG-008 已在档）、#3（`--only` id 友好化）。
- **OpenSpec change(s)**：#4 preview 模式、#5 长渲染 UX、#6 style-master 约束共享——可合并为一个 `improve-visual-iteration-env` change 或按需拆分。
- 本 plan 是复盘/设计文档；结论被上述 bug/change 吸收后即可 `git mv` 进 `_done/_closed_plans/`。
