## RENAMED Requirements

- FROM: `### Requirement: Framework README displays current version`
- TO: `### Requirement: Harness README displays current version`

## MODIFIED Requirements

### Requirement: VERSION_LOG.md tracks version bump history at repo root

Repo 根目录 SHALL 包含 `VERSION_LOG.md`，记录每次版本变更的历史。该文件 SHALL
作为 repo 级历史记录，并完成以下改造：

- 移除或替换 YAML frontmatter 为 repo 级描述
- 更新标题为 repo 级 `# VERSION_LOG`
- 重写版本号规则段为当前 semver 方案（0.x 线，MAJOR 0→1 在项目稳定发布时）
- 历史条目中的版本号 SHALL 从 v1.x.y 重编号为 v0.xy.z（MAJOR 1→0，旧
  MAJOR.MINOR 合并为新 MINOR）
- 末尾追加分界说明后，新增 `0.14.3` 条目（新版本管理机制下的第一条记录）

`ppt_maker_harness/reference/` SHALL not contain a second `version-log.md`.

#### Scenario: VERSION_LOG exists at repo root with full renumbered history

- **WHEN** agent 查看 repo 根目录
- **THEN** `VERSION_LOG.md` 包含 v0.10.0 到 v0.14.3 的完整历史（原
  v1.0.0–v1.4.3）
- **AND** 在重编号历史条目与新增的 `0.14.3` 条目之间有一条分界说明，标注自本
  change 起版本管理范畴扩展为 repo 整体

#### Scenario: Historical entries are renumbered from v1.x.y to v0.xy.z

- **WHEN** 迁移和重编号完成
- **THEN** `VERSION_LOG.md` 中不再出现 v1.x.y 格式的版本号
- **AND** v1.0.0 → v0.10.0、v1.4.3 → v0.14.3（旧 MAJOR.MINOR 合并为新
  MINOR）

#### Scenario: Harness reference does not contain a version log

- **WHEN** agent 检查 `ppt_maker_harness/reference/`
- **THEN** `version-log.md` 文件不存在

### Requirement: Harness README displays current version

`ppt_maker_harness/README.md` SHALL declare a `version:` field in frontmatter
and display the current version beside its title. Both values SHALL match the
repository `VERSION` file, and the document SHALL identify the reusable system
as the PPT Maker Harness.

#### Scenario: README frontmatter has version

- **WHEN** an Agent reads the YAML frontmatter of
  `ppt_maker_harness/README.md`
- **THEN** its `version` field matches the `VERSION` file

#### Scenario: README title shows version

- **WHEN** a human opens `ppt_maker_harness/README.md` in the repository
- **THEN** its title displays the current version and PPT Maker Harness name

### Requirement: Agent judges version bump after archiving a change

Agent SHALL 在每次 `openspec-archive-change` 完成后，按
`openspec/config.yaml` `rules:` `version:` 段定义的 bump 粒度规则，判断本次
变更是否需要 bump 版本，并 SHALL 向用户建议 bump 粒度（MINOR/PATCH/不 bump）。
用户确认后，Agent SHALL 同步更新 `VERSION`、`VERSION_LOG.md`、
`ppt_maker_harness/README.md` 和 `package.json` 中的版本号。

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
- **AND** agent 更新 `ppt_maker_harness/README.md` frontmatter 和标题中的版本号
- **AND** agent 更新 `package.json` 中的 `version` 字段

## ADDED Requirements

### Requirement: Package metadata identifies the Harness

The npm package name SHALL be `pptmaker-harness`. Changing that package identity
SHALL not by itself update the repository version; the existing archive-time
version-bump decision and user confirmation remain authoritative.

#### Scenario: Package metadata is inspected during the rename

- **WHEN** a maintainer reads the root `package.json`
- **THEN** its package name is `pptmaker-harness`
- **AND** the package-name transition has not silently changed `VERSION`
