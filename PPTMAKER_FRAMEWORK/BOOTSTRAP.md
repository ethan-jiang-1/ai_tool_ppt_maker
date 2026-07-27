# BOOTSTRAP - From zero to a usable deck

这是 Agent 的启动入口。新 deck 只有 Page Authority Image2 协议：先确认本地 Framed runtime，再按实际 raw-generation 操作检查 provider。不要把远端 Image2 凭证或授权当成 source authoring 的前置条件。

## Step 0 - Read the contract

读 `charter/AGENT_CONTRACT.md`、`charter/NODE-SPEC.md`、`reference/glossary.md`，确认 run bundle 与 `--run-dir` 的区别。若用户交给你 `RUN_BUNDLE.md` bytes，按 `AGENT_CONTRACT.md` §1 的 locator entry 先解析本地 deck/framework，再读 `deck-guide.md`；host 无法访问 card 声明的本地路径时，请求明确 root。generic remote-chat attachment integration 不受支持。

## Step 1 - New-deck foundation

未指定历史 run 时，先做基础检查和 unbound Page Authority readiness，然后才 init：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --mode image2-page-authority
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs init deck_NAME --deck-type keynote --style dark-executive
```

`doctor --mode image2-page-authority` 分别报告离线 `framed-runtime` 与 `image2-raw` profile；它不是“source 与 provider 均已准备好”的合并结论。当前 authoring、local Framed composition、assembly、notes 和 delivery review 只需要当前操作的本地事实。只有选中非零 raw-generation 后，才运行：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir deck_NAME/3_versions/v1 --operation raw-generation
```

这时才检查 `IMAGE2_API_KEY`、endpoint 和 raw generator presence。`doctor --smoke` 提交 1 次；`doctor --probe-vendors` 恰好提交 1 次/每个 resolved entry。两者都是明确选择的 live diagnostic，必须先披露并取得确认。probe success 不等于生产授权，也不产生生产 authorization/state。

## Step 2 - Choose page authority while authoring

新 source 的唯一 pipeline 是 `page-authority-image2-v1`，state 的唯一新-deck mode 是 `image2-page-authority`。init 省略 `--mode` 时使用它，source default 为 `framed-image2`；显式 `--mode` 也只接受这个值。每个 version 的权威 mode 在 `_state/state.yaml` 的 `production_mode.by_version`，`project-metadata.yaml` 只是非权威镜像。

- `pure-image2`: Image2 拥有所有最终像素。可读 body labels、values、quotations、captions、timeline dates 或 diagram text 承载语义时必须选择 Pure。
- `framed-image2`: Image2 只生成无文字 full-canvas underlay；固定 `standard-v1` 本地 Text Frame 拥有 kicker、title、subtitle 与 callout。body 必须在 frame 下保持无文字。

只写 closed `VISUAL BRIEF`、registered identity 与 Page Authority source fields。不得写 `IMAGE PROMPT`、`RENDER MODE`、HTML、slide-owned CSS 或 provider 指令。init 只创建 source/control/state scaffolding；不会创建 style master、raw/final evidence、PPTX、notes 或 provider attempt。

## Step 3 - Receipt-bound production

先 author source 并验证，再按此顺序运行 Page Authority lifecycle：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs validate deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 plan deck_NAME/3_versions/v1 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 authorize deck_NAME/3_versions/v1 --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir deck_NAME/3_versions/v1 --operation raw-generation
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 generate deck_NAME/3_versions/v1 --plan-hash <hash>
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 review deck_NAME/3_versions/v1 --json
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs image2 accept deck_NAME/3_versions/v1 --decision proceed
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs build deck_NAME/3_versions/v1
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs state deck_NAME/3_versions/v1 --record-page-authority-delivery-review proceed
```

`plan` 是 provider-free。只有非零 submit plan 才要求人类在 `authorize` 前看到 exact run、stable IDs、generation profile 与 maximum submissions；init、doctor、probe、旧批次或聊天都不是授权。zero-submit work 可继续执行，也不虚构授权。

raw projection 或 delivery evidence 已完整但还没有 `proceed|repair|redirect` 时，这是一个 `confirm` gate：展示当前 artifact 后记录对应决定。source/state 不一致、无效 frame/registry/reference、缺失/部分/陈旧 raw evidence、无效 scope 或未授权 submit 是 hard-stop：使用 state/CLI 指出的直接 owner recovery，不手改 state，也不借用 HTML review、visual-slot、Header-Lock 或 legacy artifact。

## Step 4 - Refresh and structural changes

Framed Text Frame-only 修改可在已接受 raw evidence 上本地完成，不需要 provider credential 或新授权：

```bash
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs doctor --run-dir deck_NAME/3_versions/v1 --operation framed-local-refresh
node PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs refresh deck_NAME/3_versions/v1 --kind title --only <stable-id>
```

Pure display text、underlay visual 或任何 raw-contract 修改必须回到 receipt-bound `image2 plan -> authorize -> generate -> review -> accept`，随后重新 build 和 delivery review。Notes-only work 使用 `refresh <run-dir> --kind notes`。增删重排和其它结构性修改走 Structural Versioning Path：先 preview，展示 position、stable ID、title、before/after 与 exact `plan_sha256`，再以确认的 hash apply。target 只可得到 plan-bound、target-owned `unreviewed` raw materialization 或 `needs_raw_generation` debt；不复制 raw acceptance、provider authorization、final evidence 或 delivery decision，apply 本身零远端。

## Existing-run guidance

只有用户明确给出一个 existing run 时，才先运行 `ppt_flow state <run-dir> --json` 并依据 exact source/state pair 路由。当前 bridge 期间，`html-only`、`html-then-image2` 与 `image2-only` 仍保留各自的既有 controller/dispatch；它们不是 init 选项，也不能用来解释新的 Page Authority source。Page Authority run 只使用它的 receipt-to-delivery lifecycle，绝不进入 HTML review、Image2 refinement 或 Header-Lock。

## Optional Git note

### git

Git 对做 PPT **可选但推荐**，只作为用户拥有的 source/control audit。先确认本次调用所在目录是不是用户明确指定的 worktree；否则视为 `not confirmed as a worktree`，不要检查 history。若没有用户 checkpoint，说明 `no verifiable Git history checkpoint`，不要承诺 recovery。

source 的 canonical backup 是可见 `vN` 与 Structural Versioning Path，不是 Git checkout，也不是 `_generated/`。用户若明确授权 Git，必须给出命名操作和精确范围；普通 checkpoint 授权不包含 inspection。不要在项目根或 framework 内 `git init`，不得嵌套 `git init`。

## Runtime check map

### nodejs
### npm
### @napi-rs/canvas
### pptxgenjs
### commander
### playwright
### echarts
### chromium
### html_fonts
### html_runtime_smoke
### fonts
### disk_space
### git
### api_key
### image_base_url
### stage2_generator
### image_smoke
### image_probe_vendors
