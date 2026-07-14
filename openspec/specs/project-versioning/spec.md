## Purpose

Define repo-level version management: a `VERSION` file as the single source of truth,
a `VERSION_LOG.md` changelog migrated from the soft bundle, agent-driven bump judgment
after each archive, and codified bump rules in `CLAUDE.md` and `openspec/config.yaml`.

## Requirements

### Requirement: VERSION file is the single source of truth for repo version

Repo 根目录 SHALL 包含一个 `VERSION` 纯文本文件，内容为一个 semver 版本号（如 `0.14.3`），无换行、无前后空格。所有版本查询 SHALL 以该文件为准。

#### Scenario: VERSION file exists at repo root

- **WHEN** agent 或脚本读取 repo 根目录的 `VERSION` 文件
- **THEN** 返回当前 semver 版本号字符串

#### Scenario: VERSION file content is valid semver

- **WHEN** `VERSION` 文件内容为 `0.14.3`
- **THEN** 解析为 MAJOR=0, MINOR=14, PATCH=3

### Requirement: VERSION_LOG.md tracks version bump history at repo root

Repo 根目录 SHALL 包含 `VERSION_LOG.md`，记录每次版本变更的历史。该文件 SHALL 从 `PPTMAKER_FRAMEWORK/reference/version-log.md` 迁移而来（含重命名：`version-log.md` → `VERSION_LOG.md`），并完成以下改造：
- 移除或替换 YAML frontmatter 为 repo 级描述（原 frontmatter 属于框架文档索引系统）
- 更新标题为 repo 级 `# VERSION_LOG`
- 重写版本号规则段为当前 semver 方案（0.x 线，MAJOR 0→1 在项目稳定发布时）
- 历史条目中的版本号 SHALL 从 v1.x.y 重编号为 v0.xy.z（MAJOR 1→0，旧 MAJOR.MINOR 合并为新 MINOR）
- 末尾追加分界说明后，新增 `0.14.3` 条目（新版本管理机制下的第一条记录）

迁移完成后，`PPTMAKER_FRAMEWORK/reference/version-log.md` SHALL 不再存在。

#### Scenario: VERSION_LOG exists at repo root with full renumbered history

- **WHEN** agent 查看 repo 根目录
- **THEN** `VERSION_LOG.md` 包含 v0.10.0 到 v0.14.3 的完整历史（原 v1.0.0–v1.4.3）
- **AND** 在重编号历史条目与新增的 `0.14.3` 条目之间有一条分界说明，标注自本 change 起版本管理范畴扩展为 repo 整体

#### Scenario: Historical entries are renumbered from v1.x.y to v0.xy.z

- **WHEN** 迁移和重编号完成
- **THEN** `VERSION_LOG.md` 中不再出现 v1.x.y 格式的版本号
- **AND** v1.0.0 → v0.10.0、v1.4.3 → v0.14.3（旧 MAJOR.MINOR 合并为新 MINOR）

#### Scenario: Framework reference no longer contains version-log after migration

- **WHEN** 迁移已完成且 agent 检查 `PPTMAKER_FRAMEWORK/reference/`
- **THEN** `version-log.md` 文件不存在

### Requirement: Framework README displays current version

`PPTMAKER_FRAMEWORK/README.md` SHALL 在 frontmatter 中声明 `version:` 字段，并在标题旁展示当前版本号（如 `# PPT 信息加工流  ·  v0.14.3`）。两处 SHALL 与 `VERSION` 文件保持一致。

#### Scenario: README frontmatter has version

- **WHEN** agent 读取 `PPTMAKER_FRAMEWORK/README.md` 的 YAML frontmatter
- **THEN** `version` 字段的值与 `VERSION` 文件一致

#### Scenario: README title shows version

- **WHEN** 人类在 GitHub 上打开 `PPTMAKER_FRAMEWORK/README.md`
- **THEN** 标题行展示当前版本号

### Requirement: Agent judges version bump after archiving a change

Agent SHALL 在每次 `openspec-archive-change` 完成后，按 `openspec/config.yaml` `rules:` `version:` 段定义的 bump 粒度规则，判断本次变更是否需要 bump 版本，并 SHALL 向用户建议 bump 粒度（MINOR/PATCH/不 bump）。用户确认后，Agent SHALL 同步更新 `VERSION`、`VERSION_LOG.md`、`PPTMAKER_FRAMEWORK/README.md` 和 `package.json` 中的版本号。

#### Scenario: New capability triggers MINOR bump

- **WHEN** archive 的 change 包含新增 capability
- **THEN** agent 建议 MINOR bump（如 0.14.3 → 0.15.0）

#### Scenario: Breaking change triggers MINOR bump

- **WHEN** archive 的 change 包含破坏性变更（修改现有 spec 的向后不兼容行为）
- **THEN** agent 建议 MINOR bump

#### Scenario: Bug fix triggers PATCH bump

- **WHEN** archive 的 change 仅修复 bug，不新增 capability，不改现有 spec
- **THEN** agent 建议 PATCH bump（如 0.14.3 → 0.14.4）

#### Scenario: Doc-only change does not bump

- **WHEN** archive 的 change 仅涉及文档修改，不影响任何 capability 或 spec
- **THEN** agent 建议不 bump

#### Scenario: Agent updates all version locations after bump

- **WHEN** 用户确认 bump
- **THEN** agent 更新 `VERSION` 文件中的版本号
- **AND** agent 在 `VERSION_LOG.md` 顶部追加新版本条目（日期 + 版本号 + 变更摘要）
- **AND** agent 更新 `PPTMAKER_FRAMEWORK/README.md` frontmatter 和标题中的版本号
- **AND** agent 更新 `package.json` 中的 `version` 字段

### Requirement: Bump rules are codified in CLAUDE.md and config.yaml with distinct roles

版本管理的规则 SHALL 写入两处，各有不同职责：
1. `CLAUDE.md` — 行为铁律（agent 每次 session 读取）：VERSION 文件位置、archive change 后必须判断 bump、bump 粒度速查（一行，指向 config.yaml 权威规则）
2. `openspec/config.yaml` `rules:` `version:` 段 — 分类规则权威源：定义什么变更类型对应什么 bump 级别

#### Scenario: CLAUDE.md contains version behavior rule

- **WHEN** agent 读取 `CLAUDE.md`
- **THEN** agent 知晓根目录 `VERSION` 文件的存在和 archive 后判断 bump 的职责

#### Scenario: config.yaml contains authoritative bump classification rules

- **WHEN** OpenSpec 维护者查看 `openspec/config.yaml`
- **THEN** `rules:` 下 `version:` 段定义了完整的 bump 粒度分类规则表
- **AND** CLAUDE.md 中的速查行引用该段为权威源
