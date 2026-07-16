## Why

当前页面序号同时渗入 slide ID、派生文件名和按位置注入的 notes；一旦插页、删页或重排，后续页会整体 shift，用户难以继续用“第几页”沟通，系统也可能把未改内容误判成新页面并丢失缓存、review evidence 或 notes 对齐。双渲染管线将来会让每页拥有多种 render artifact，因此现在必须先把“永久页面身份”与“当前页序”分开，并提供可口述、可预览、可回滚的结构编辑入口。

这个方向经过两轮收敛：随机短码虽然稳定却无法口述；单名词呼号虽然好念，却只有一个语义维度、容易重复。最终采用 `UXGap` 这类 `SUBJECT + MOVE` 双语义 BlockCase ID，正式 ID 优先 5 个字母、必要时 6 个，同时保留 derived position 供人继续说“第 7 页”。

## What Changes

- 为每张 slide 定义 deck 历史范围内稳定且不复用的 BlockCase `slide_id`，以及从 source block 顺序派生的 1-based `position`；移动、标题改写和 render engine 变化不改变 ID。
- 新页面由 Agent 根据叙事职责命名为双语义 mnemonic ID；JS 校验 5–6 字母、两个可辨认语义块、保留词、历史唯一性、spoken-key 唯一性和近似冲突，不随机造词。
- 新增共享的 structured slide-document interface，保留 frontmatter、preamble、slide blocks 和 epilogue，统一实现 selector snapshot resolution、连续编号校验、normalize、move、delete、insert 和批量 edit transaction。
- 在 `ppt_flow slides` 下增加 list/resolve/normalize/move/delete/insert/apply-plan 操作。结构编辑默认只预览；显式 `--apply` 才创建干净 vNext 并原子写源。`normalize --apply` 可在当前版本只修 heading 序号。
- 对同一批 position selector 采用 pre-edit snapshot 语义；例如“删第 3、7 页”先解析为两个稳定 ID，再一次提交，避免第一次删除造成第二个页码漂移。
- Stage 1 输出明确的 `position`，duplicate/empty ID 和不连续或错位 heading 序号 fail loud；新昂贵产物不再把 position 作为 identity 或 generation fingerprint 输入。
- Image2 raw image、header-lock output、review evidence 和后续 HTML artifact 通过稳定 ID 与 manifest 关联；Stage 4 按当前 plan order 组装，不再靠目录 glob 推断页面身份。
- Stage 5 将 notes 解析为 `{slide_id, note}`，先与当前 slide plan 做 exact ID-set 校验，再按 plan order 注入 PPTX position。
- Structural Versioning Path 继续先创建干净版本；随后仅自动 materialize 经 stable ID、generation fingerprint/profile 和 bytes hash 验证的上一版本产物。仅重排/删除不得触发远端渲染，插页只渲染新 ID。
- 保留 legacy deck：现有唯一 ID（包括 `s07_problem`）先视为稳定 ID，旧 `NN_<id>.png` 继续可读；普通重排不暗中迁移 ID。新模板使用 BlockCase mnemonic ID，显式 migration 留作独立可审计操作。
- 更新 restructure playbook、自然语言命令路由、迭代方法论和 charter 镜像，使 Agent 显示 `position + BlockCase ID + title`，并把确定性编辑交给 CLI。

## Capabilities

### New Capabilities

- `slide-identity-and-ordering`: 定义稳定双语义 slide ID、derived position、spoken selector、structured slide document、快照式结构编辑事务、版本保护与 edit receipt。

### Modified Capabilities

- `content-parsing`: Stage 1 校验 ID/heading invariants、输出 position，并把昂贵产物命名与页序解耦。
- `image-generation`: raw-image manifest 和缓存复用以稳定 ID 为 identity，position 不进入 generation fingerprint，并支持验证后的跨版本 materialization。
- `header-lock`: Stage 3 以稳定 ID 解析和写出 header-locked artifact，同时保留 legacy filename 读兼容。
- `pptx-assembly`: Stage 4 通过 plan 与 artifact manifest 精确取图，并严格按当前 position 组装。
- `notes-injection`: Stage 5 按 slide ID 校验和关联 notes，再按当前 plan 顺序注入。
- `pipeline-orchestration`: Structural Versioning Path 计算结构变更影响，复用已验证 artifact，并保证 reorder/delete-only 不调用远端 renderer。
- `cli-surface`: 注册 `ppt_flow slides` 命令、preview/apply 行为、edit receipt 与符合现有 envelope 的失败诊断。
- `node-specification`: MD Controller 以 position 或 mnemonic selector 表达意图，消费结构编辑 preview/receipt，并在 requires-human 情况停下确认。
- `commands-reference`: 自然语言增删重排意图路由到新的 preview-first 结构编辑路径，并向用户展示 position、ID 与 title。
- `playbook-execution`: `restructure-slides` 通过同一 transaction 执行 preview、确认、versioned apply、最小刷新和最终核对，不再让 Agent 手工重排 Markdown。
- `framework-charter`: charter、workflow、glossary、模板与 authoring guidance 统一解释 stable ID、derived position、双语义 mnemonic 和 ID-keyed artifact 规则。

## Impact

- **Change domain**: framework repository maintenance。实现只修改 `PPTMAKER_FRAMEWORK/`、`openspec/`、`tests/` 和 `tests_e2e/`；不会把现有 `deck_*` 生产数据当测试夹具或手改其 `_generated/`。
- **Control ownership**: Agent/MD 拥有双语义 ID 的创意命名、自然语言理解和歧义确认；JS/CLI 拥有解析、校验、snapshot resolution、事务应用、版本创建、artifact provenance 与诊断；二者通过 preview/edit receipt 协作。
- **Primary code**: `stage1_build_inputs.mjs`、`lib/slide_ids.mjs`、新的 slide-document/ordering module、`ppt_flow.mjs`、`unified_pipeline.mjs`、Stage 2–5 consumers、provenance/header-review helpers 与 bundle versioning adapter。
- **Source/docs**: slide specification template、`restructure-slides.md`、change classifier、iteration workflow、COMMANDS、AGENT_CONTRACT/WORKFLOW 镜像和 glossary。
- **Compatibility**: 新 deck 的 ID 格式改变，但 legacy IDs 和旧 position-prefixed image filenames 保持读兼容；普通结构编辑不会隐式重命名 legacy ID。
- **Generated artifacts**: reorder/delete 会重建便宜的 plan、contact sheet、PPTX 和 notes receipt，但复用验证通过的昂贵 render artifacts。所有复用由框架写入新版本 `_generated/`，不要求人工复制或编辑派生物。
- **Future dependency**: `dual-render-pipeline` 必须消费 `(slide_id, render_engine, generation_fingerprint)` artifact identity，不再定义第二套页面身份或排序规则。
