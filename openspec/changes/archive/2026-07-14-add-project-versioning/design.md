## Context

当前 `PPTMAKER_FRAMEWORK/reference/version-log.md` 以 semver 追踪了软包方法论的版本历史（v0.10.0–v0.14.3，原 v1.0.0–v1.4.3）。但软包是**只读方法论知识库**——agent 进去学的是"怎么做 PPT"，读到"工具版本历史"是噪声。版本号是 repo 级元信息，范畴上不属于方法论。

同时，OpenSpec 的 change → archive 循环没有版本意识——30+ 个已归档 change 散落在 `archive/` 目录中，无法从版本号判断项目演进到了什么阶段。需要一个轻量的 repo 级版本管理，不引入新工具、不依赖 CI。

本次 change 将 MAJOR 从 1 修正为 0（项目未到 1.0 水准），旧 MAJOR.MINOR 合并为新 MINOR（v1.4.3 → v0.14.3），保留全部历史积累。同时将版本管理的范畴从"软包方法论"扩展到"整个 repo"。

## Goals / Non-Goals

**Goals:**
- 根目录 `VERSION` 文件作为唯一版本号源（纯文本，semver）
- `VERSION_LOG.md` 在根目录记录每次 bump，从 v0.14.3 起（原 v1.4.3，MAJOR 修正为 0）
- Agent 在 archive change 后自动判断是否需要 bump 并建议粒度
- `PPTMAKER_FRAMEWORK/README.md` 展示当前版本号
- `package.json` `version` 与 VERSION 保持同步

**Non-Goals:**
- 不改 OpenSpec 本身的 archive skill
- 不加 npm version / git tag 自动化
- 不引入新脚本——全靠 agent 规则驱动
- 不修改任何管线脚本或 run bundle 结构

## Decisions

### Decision 1: Agent 规则驱动，而非脚本驱动

版本 bump 是**agent 的判断 + 人的确认**，不是自动化脚本。原因：
- 版本粒度判断需要理解 change 的语义（"这是新功能还是 bug fix？"），模型能做
- 项目的"人-Agent 协作边界"已经确立：agent 拥有过程，人确认内容决策
- 脚本会引入不必要的复杂度——bump 要改 4 个文件（VERSION + README + VERSION_LOG + package.json），但操作本身只是文本替换，不需要脚本

实现方式：`CLAUDE.md` 放行为铁律（agent 每次 session 读到，"什么时候做"），`openspec/config.yaml` `rules:` 下 `version:` 段放分类规则（"怎么判断粒度"）。两者分工明确，不重复——详见 Decision 5。

### Decision 2: VERSION_LOG.md 从 framework 挪到根目录，历史版本号重编号

`PPTMAKER_FRAMEWORK/reference/version-log.md` 的历史记录是 repo 级资产。挪到根目录并重命名为 `VERSION_LOG.md`（大写+下划线，与 `VERSION` 命名一致），同时：
- 移除/更新 YAML frontmatter（原 frontmatter 的 `summary: PPTMAKER_FRAMEWORK 的小版本迭代记录` 和 `stage: root` 等字段属于框架文档索引系统，repo 根目录文件不需要）
- 更新标题：`# VERSION_LOG — PPTMAKER_FRAMEWORK/` → `# VERSION_LOG`
- 重写版本号规则段：旧规则描述的是 v1.x + MAJOR=新目录，新规则描述 0.x semver（MAJOR 0→1 在项目稳定发布时）
- 历史条目中的版本号从 v1.x.y 重编号为 v0.xy.z（MAJOR 1→0，旧 MAJOR.MINOR 合并为新 MINOR）：如 v1.4.3 → v0.14.3、v1.0.0 → v0.10.0
- 重编号历史之后追加分界说明，再新增 `0.14.3` 条目：标注自本 change 起版本管理范畴正式扩展为 repo 整体
- 软包内删除该文件

### Decision 3: 版本号 MAJOR 从 1 修正为 0，保留历史积累

现有 `version-log.md` 最新版本是 v1.4.3。修正 MAJOR 从 1 到 0 的原因：
- 项目未到 1.0 水准——视觉资产系统、版本管理本身都还在建立
- 但项目已有 30+ archived changes、完整管线、14 个 registered capability——远非从零开始
- 因此不重置为 0.0.1 或 0.1.0，而是将旧 MAJOR.MINOR 合并为新 MINOR：v1.4.3 → v0.14.3

同步更新 `package.json` `version` 从无意义的 `1.0.0` 到 `0.14.3`。

### Decision 4: Bump 粒度规则

| 变更类型 | Bump | 例 |
|---------|------|-----|
| 新 capability / 破坏性变更 / 架构变化 | MINOR (0.14→0.15) | visual-asset-management, breaking API change |
| Bug fix / 小改进 / 措辞调整 | PATCH (0.14.3→0.14.4) | fix typo, improve error message |
| 纯文档（不改行为） | 不 bump | README 修改, 注释调整 |

MAJOR (1.0) 留到"框架稳定、可对外发布"时。

### Decision 5: CLAUDE.md 与 config.yaml 规则分工

两处都涉及版本规则，但读者和内容不同：

| 文件 | 读者 | 放什么 |
|------|------|--------|
| `CLAUDE.md` | Agent（每次 session） | 行为铁律：根目录 VERSION 位置、archive change 后必须判断 bump、bump 粒度速查一行 |
| `config.yaml` `rules:` `version:` | OpenSpec 维护者 | 分类规则表（权威源）：什么变更 → 什么 bump 级别 |

CLAUDE.md 解决 "什么时候做"，config.yaml 解决 "怎么判断"。不重复——CLAUDE.md 只给一个速查链（"archive 后按 config.yaml version rules 判断"），不复制规则表。

## Risks / Trade-offs

- **Agent 漏判**：archive 后 agent 可能忘记建议 bump → 缓解：规则写在 CLAUDE.md 里，每次 session 都读
- **人不同意 bump 粒度**：agent 建议的粒度可能不对 → 缓解：bump 永远是 agent 建议 + 人确认，人不确认就不 bump
- **VERSION_LOG 格式漂移**：没有 schema 约束 → 缓解：VERSION 是 SSOT，VERSION_LOG 是人读辅助，不一致时以 VERSION 为准
