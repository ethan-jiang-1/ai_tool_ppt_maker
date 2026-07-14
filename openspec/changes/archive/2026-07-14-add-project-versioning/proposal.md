## Why

Repo 没有版本号。`PPTMAKER_FRAMEWORK/reference/version-log.md` 记录了软包方法论的版本历史（当前条目 v1.0.0–v1.4.3，本次 change 将重编号为 v0.10.0–v0.14.3），但放在只读方法论软包里是范畴错误——agent 进去学的是"怎么做 PPT"，不应该读到"工具本身的版本历史"。该文件应在 repo 根目录，作为项目整体（软包+脚本+管线+OpenSpec 体系）的版本日志。

OpenSpec 的 change → archive 流程目前跟版本号完全脱节——30+ 个已归档 change，无法从版本号判断项目演进到了什么阶段。

将 MAJOR 从 1 修正为 0（项目未到 1.0 水准），旧 MAJOR.MINOR 合并为新 MINOR（1.4 → 14），当前版本 `0.14.3`。

## What Changes

- 根目录新建 `VERSION` 文件（纯文本 `0.14.3`，SSOT）
- `PPTMAKER_FRAMEWORK/reference/version-log.md` 移动到根目录并重命名为 `VERSION_LOG.md`，历史版本号从 v1.x.y 重编号为 v0.xy.z
- `PPTMAKER_FRAMEWORK/README.md` frontmatter 和标题旁各加版本号
- `CLAUDE.md` 加版本管理铁律（行为指令：何时触发 bump）
- `openspec/config.yaml` `rules:` 下新增 `version:` 段（分类规则：什么变更 → 什么 bump 级别）
- `package.json` `version` 同步为 `0.14.3`

## Capabilities

### New Capabilities
- `project-versioning`: repo 级版本管理——VERSION 文件、VERSION_LOG.md、archive 后 agent 判断 bump 粒度

### Modified Capabilities
None.

## Impact

- 根目录：新增 `VERSION` + `VERSION_LOG.md`（从 framework 挪出并重命名）
- `PPTMAKER_FRAMEWORK/reference/version-log.md`：删除
- `PPTMAKER_FRAMEWORK/README.md`：frontmatter + 标题加版本号
- `CLAUDE.md`：追加版本管理行为铁律
- `openspec/config.yaml`：`rules:` 下新增 `version:` 段；capability 注册表新增 `project-versioning`
- `package.json`：`version` 改为 `0.14.3`
- 不影响任何管线脚本、run bundle 结构、或 PPT 生产能力
