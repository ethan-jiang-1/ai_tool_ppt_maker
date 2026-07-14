## 1. 版本文件创建（顺序执行）

- [x] 1.1 根目录新建 `VERSION` 文件，内容 `0.14.3`（纯文本，无换行）
- [x] 1.2 将 `PPTMAKER_FRAMEWORK/reference/version-log.md` 移动到根目录并重命名为 `VERSION_LOG.md`（`git mv`，保留全部历史）
- [x] 1.3 编辑 `VERSION_LOG.md`：（a）更新 frontmatter summary 为 repo 级描述；（b）更新标题为 `# VERSION_LOG`；（c）重写版本号规则段为当前 semver 方案（MAJOR 0→1 在稳定发布时）；（d）将历史条目中的版本号从 v1.x.y 重编号为 v0.xy.z（v1.0.0→v0.10.0, v1.4.3→v0.14.3 等）
- [x] 1.4 在 `VERSION_LOG.md` 中重编号历史之后追加分界说明，再新增 `0.14.3` 条目（标注 MAJOR 修正 + 版本管理范畴扩展为 repo 整体）

## 2. 版本号同步（可并行）

- [x] 2.1 `PPTMAKER_FRAMEWORK/README.md` frontmatter 新增 `version: 0.14.3` 字段
- [x] 2.2 `PPTMAKER_FRAMEWORK/README.md` 标题行改为 `# PPT 信息加工流  ·  v0.14.3`
- [x] 2.3 `package.json` `version` 改为 `0.14.3`

## 3. Agent 规则注入（可并行）

- [x] 3.1 `CLAUDE.md` 追加版本管理行为铁律段：VERSION 文件位置 + archive 后必须判断 bump + bump 粒度速查（一行，指向 config.yaml 权威规则）
- [x] 3.2 `openspec/config.yaml` `rules:` 下新增 `version:` 段，包含完整 bump 粒度分类规则表

## 4. Capability 注册（依赖 3.2，同文件不同段）

- [x] 4.1 `openspec/config.yaml` capability 注册表「项目基础」分类新增 `project-versioning` 条目

## 5. 验证

- [x] 5.1 确认 `VERSION` 内容为 `0.14.3`
- [x] 5.2 确认 `PPTMAKER_FRAMEWORK/README.md` frontmatter `version:` 和标题版本号均为 `0.14.3`
- [x] 5.3 确认 `package.json` `version` 为 `0.14.3`
- [x] 5.4 确认 `PPTMAKER_FRAMEWORK/reference/version-log.md` 已删除
- [x] 5.5 确认 `VERSION_LOG.md` 存在于根目录，历史条目已重编号为 v0.10.0–v0.14.3
- [x] 5.6 确认 `VERSION_LOG.md` 中重编号历史与新增 `0.14.3` 条目之间有分界说明
