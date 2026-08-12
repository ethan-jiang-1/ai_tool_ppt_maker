# BOOTSTRAP - From zero to a usable deck

这是 Agent 的启动入口。新 deck 使用 Page Image Workflow：先确认本地 Framed header-overlay runtime，再按实际 raw-generation 操作检查 provider。不要把远端 Image2 凭证或授权当成 source authoring 的前置条件。

## Step 0 - Read the contract

读 `charter/AGENT_CONTRACT.md`、`charter/NODE-SPEC.md`、`reference/glossary.md`，确认 run bundle 与 `--run-dir` 的区别。若用户交给你 `RUN_BUNDLE.md` bytes，按 `AGENT_CONTRACT.md` 的 `RUN_BUNDLE locator entry` 验证该 deck 对本地 PPT Maker Harness 的当前绑定，再读 `deck-guide.md`；无法验证时停止并按唯一重建动作处理，不请求替代 root。generic remote-chat attachment integration 不受支持。

## Step 1 - New-deck foundation

未指定历史 run 时，先建立本地 foundation，再初始化用户请求的 deck：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor
node ppt_maker_harness/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive
```

`doctor` 报告离线本地 runtime；它不是“source 与 provider 均已准备好”的合并结论。init 后先取得用户的内容和必要选择，再交给当前 `create-deck` Controller/owner action；不要提前复制一段固定的 production command sequence。

当前 owner 明确选中 raw-generation 操作后，normal readiness 才绑定到 exact run：

```bash
node ppt_maker_harness/scripts/ppt_flow.mjs doctor --run-dir <run-dir> --operation raw-generation
```

这时才检查 `IMAGE2_API_KEY`、endpoint 和 raw generator presence。`doctor --smoke` 提交 1 次；`doctor --probe-vendors` 恰好提交 1 次/每个 resolved entry。两者都是明确选择的 live diagnostic，必须先披露并取得确认。probe success 不等于生产授权，也不产生 production authorization/state。direct `env-check` 只用于 pre-install 或 main entry 无法启动时的 recovery，不是 normal raw readiness 的替代入口。

## Step 2 - Choose one version workflow while authoring

新 source 的唯一 pipeline 是 `page-image-workflow`。`init` 创建当前 authoring draft；人必须先在 `production.workflow` 明确记录一次 `framed` 或 `pure`，source 才能进入 provider-work route。state 在 receipt 绑定后记录 `image2-page-workflow` 和同一 workflow；`project-metadata.yaml` 只是非权威镜像。不得从 deck type、任一 slide 或已有 artifact 推断 workflow。

- `framed`: Provider 生成连续全画布以及 source-owned body、labels、metrics、callouts 和 supporting copy；固定 `standard` Header Rendering Policy 只在本地透明叠加 kicker、title、subtitle。选中的 profile 以一个 CSS-pixel `header_region` 推导 `normalized-canvas` 的 `protected_composition`：`reserved_header` 与其下方全宽的 `body_safe`。这些是 provider 的有限避让提示和 Complete Page Review 指引；本地 header literal 与其派生上下文绝不写入 provider input。`SUBJECT RESTRICTIONS` 是 source-owned 的闭集事实，Framed 将其绑定进 raw/request lineage。
- `pure`: `04-pure-image` 让 Provider 生成包括 header 在内的所有最终像素。

一次选择覆盖整个 `vN`，绝不在 slide 上选择 authority。只写 closed `VISUAL BRIEF`、registered identity 与 Page Image source fields。不得写 retired source-only fields、slide-owned markup/CSS 或 provider 指令。init 只创建 source/control/state scaffolding；不会创建 style master、raw/final evidence、PPTX、notes 或 provider attempt。

## Step 3 - Receipt-bound production

先 author source、记录 workflow 并验证。目标 method graph 是 `03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration`：所选 workflow 负责语义规则和 common final-slide manifest；`05-delivery` 是唯一的 final projection、slide-canvas PPTX、notes injection 与 delivery review owner。

现有直接 CLI grammar 保持不变；由 source/state resolver 与 create-deck Controller 将已绑定的版本送入所选 owner。BOOTSTRAP 不规定固定的一次性 validate/raw/Style Master/authorization/generation/review/accept 脚本。每次都从 current Controller 或 owner-issued action 继续；它决定下一项 provider-free work、需要披露的 remote cost，或需要展示给人确认的 evidence。

init、doctor、probe、旧批次或聊天都不是 production authorization。只有 owner 返回一个非零 submit scope 后，人才需要看到 exact run、stable IDs、generation profile 与 maximum submissions，并在其既有 boundary 作出决定。zero-submit work 不虚构授权。

raw projection 或 delivery evidence 已完整但还没有 `proceed|repair|redirect` 时，这是一个 `confirm` gate：展示当前 artifact 后记录对应决定。source/state 不一致、无效 frame/registry/reference、缺失/部分/陈旧 raw evidence、无效 scope 或未授权 submit 是 hard-stop：使用 state/CLI 指出的直接 owner recovery，不手改 state，也不借用不受支持的 review 或 artifact。

对于 nonzero 的 owner CLI，只读取 stderr 最后一个非空 JSON 回执，并使用 producer 发出的 `diagnostic.category` 与 `diagnostic.next`；不要匹配说明文字，也不要在 Agent/MD 侧复写分类或恢复表。只有该 owner action 明确允许时才做机械修复，然后重跑它指定的 checkpoint；这不替代既有 raw visual `confirm`。

## Step 4 - Refresh and structural changes

显式 change 先进入当前 classifier。仅当 Framed 的 compiled provider input、protected composition、raw contract 与 local header profile 都精确不变时，才可 provider-free 地刷新 local header overlay；任何 header literal、body、visual、composition 或 profile drift 都回到 selected workflow 的 raw rebuild handoff；notes-only work 只走 `05-delivery`。不要从旧 command sequence 猜下一步。

增删重排和 workflow switch 都是 Structural Versioning Path：先 preview，再确认 exact plan 后发布 clean target。target 只可得到 plan-bound、target-owned `unreviewed` raw materialization 或 `needs_raw_generation` debt；不复制 raw acceptance、provider authorization、final evidence 或 delivery decision，apply 本身零远端。

## Unsupported-run guidance

任何 partial、missing、unknown 或 corrupt source/state pair 都是同一个
`repair-current-protocol-identity` hard-stop。普通 observation、build、refresh、review 和
provider 命令不得推断 workflow、初始化 receipt/state、读取 generated artifacts 或修改原始 bytes。

## Optional Git note

### git

Git 对做 PPT **可选但推荐**，只作为用户拥有的 source/control audit。先确认本次调用所在目录是不是用户明确指定的 worktree；否则视为 `not confirmed as a worktree`，不要检查 history。若没有用户 checkpoint，说明 `no verifiable Git history checkpoint`，不要承诺 recovery。

source 的 canonical backup 是可见 `vN` 与 Structural Versioning Path，不是 Git checkout，也不是 `_generated/`。用户若明确授权 Git，必须给出命名操作和精确范围；普通 checkpoint 授权不包含 inspection。不要在项目根或 Harness 内 `git init`，不得嵌套 `git init`。

## Runtime check map

### nodejs
### npm
### @napi-rs/canvas
### pptxgenjs
### commander
### playwright
### chromium
### html_fonts
### framed_render_profile
### html_runtime_smoke
### fonts
### disk_space
### git
### api_key
### image_base_url
### page_image_raw_generator
### image_smoke
### image_probe_vendors
