# Authority Map — 权威来源地图

> 来源：keel §3–4（fact authority / decision authority / owner）| 2026-08-13
> 范围：顶层 `AGENTS.md`/`CLAUDE.md`/`CONTEXT.md`/`README.md` + `ppt_maker_harness/**` + `openspec/specs/**`（27 个 `spec.md`）。未读 `deck_*`/`dpt_*`/`_backlog`/`docs`/`node_modules`/`.git`。

## 核心结论

**改名已彻底完成（live 范围）**：`PPTMAKER_FRAMEWORK` 零出现；残留的 `PPTMAKER_*`/`pptmaker-*` 是 env/namespace（`cli-surface/spec.md:15-16` 明示保留），不是目录名。概念名 canonical 是 **"PPT Maker Harness"**；目录名 `ppt_maker_harness/` 被明确降级为 "soft bundle" 而非概念名（`CONTEXT.md:7-9`、`AGENTS.md:15`、`README.md:7`）。唯一还写旧名 "framework" 的，是用户跨会话 memory（已单独修正）。

## 逐概念权威映射

| 概念 | 权威来源 | 冲突/重复来源 |
|---|---|---|
| Harness 本体命名 | `CONTEXT.md:7-9`（canonical + `_Avoid_`） | 无（README / 各 spec 一致） |
| 目录名 `ppt_maker_harness/` | `harness-directory-layout/spec.md:23-24`、`bootstrap-env-guidance/spec.md:7-9` | 无 |
| run bundle / deck | `CONTEXT.md:51-53,71-73`、`glossary.md:11` | **谁创建 bundle 两说**（term-drift #13） |
| 版本 `vN` / structural versioning | **无 spec 归位**（`openspec/specs/project-versioning/` 是空目录） | 散在 `slide-identity-and-ordering/spec.md`、`pipeline-orchestration/spec.md`、`AGENT_CONTRACT.md:29-34` |
| 生命周期框架 | `method graph` / `method module`（`README.md:40`、`harness-directory-layout/spec.md:33`） | 旧 "Phase N" 并存（term-drift #1） |
| pipeline | `page-image-workflow`（`NODE-SPEC.md:26`、`BOOTSTRAP.md:30`） | "workflow" 三义（term-drift #12） |
| node | `node-specification/spec.md:3` | — |
| playbook | `playbook-execution/spec.md:7`（MD Controller） | `AGENTS.md:20` 旧义（term-drift #9） |
| slide_id vs position | `slide-identity-and-ordering/spec.md:6-9` | 全仓最一致，无冲突 |
| style master | `glossary.md:19-24`、`style-master-generation/spec.md` | 三种 surface casing（term-drift #3） |
| page image | `CONTEXT.md:241-243`；契约值 `page-image-workflow`/`image2-page-workflow`（`NODE-SPEC.md:9-33`） | — |
| framed / pure | `harness-charter/spec.md:132`、`CONTEXT.md:223` | hybrid 非第三 workflow，一致 |
| `_generated/` | `AGENTS.md:64`、`glossary.md:18` | 一致 |
| state / receipt | `CONSTITUTION.md:100`（state.yaml 真相源）、`NODE-SPEC.md:23`；receipt 派生（`CONTEXT.md:167-169`） | — |
| CLI | `bootstrap-env-guidance/spec.md:8-9`；producer schema 权威 = `cli-surface/spec.md` | — |

## "4 个源码目录" 边界

- 四目录列表**全一致**：`ppt_maker_harness/`、`openspec/`、`tests/`、`tests_e2e/`（`AGENTS.md:44`、`harness-directory-layout/spec.md:23-24`、`README.md:50-63`）。
- 漂移只在「这 4 个目录这回事」怎么称呼：`Harness source` / `Harness Maintenance Domain`（`CONTEXT.md:31-33`）/ `Harness Root`（`CONTEXT.md:27-29`，指单个目录）。

## 有没有唯一的 methodology 事实权威？—— 没有

8 处「从这里开始」互相竞争：

| 文档 | 自称 |
|---|---|
| `CONTEXT.md:3` | "names the durable concepts"（概念/术语权威） |
| `bootstrap-env-guidance/spec.md:7-9` | BOOTSTRAP 是 startup document（规范） |
| `BOOTSTRAP.md:1-3` | "这是 Agent 的启动入口" |
| `harness/CLAUDE.md:20` | First action = BOOTSTRAP → AGENT_CONTRACT |
| `harness/README.md:59-64` | Where To Start |
| `workflow/00-setup/README.md:15` | "先读这个。3 分钟。" |
| 顶层 `CLAUDE.md:7-12` | 4 步入口 |
| 顶层 `AGENTS.md:70-74` | 按任务路由 |

规范层级其实已定义但被埋没：`CONTEXT.md:35-36` 定义 "Normative Harness Specification" = `openspec/specs/**` 是最高权威；`harness-charter/spec.md:128-134` + `bootstrap-env-guidance/spec.md` 约束 charter/BOOTSTRAP。但 **`CONTEXT.md` 本身零引用**（scope 内 grep 无任何文件链它）——术语权威没接进任何入口链。
