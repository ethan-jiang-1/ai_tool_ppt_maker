# Residue List — 残留清单

> 来源：keel `rot-audit`（只读扫描）| 2026-08-13
> 范围：顶层文件 + `_backlog/` + `docs/adr/` + `openspec/changes/`(active) + `.claude/.agents/.codex/.cursor/`；引用追踪回 `ppt_maker_harness/`、`openspec/specs/`、`tests/`、`tests_e2e/`。未读 `deck_*`/`dpt_*`/`node_modules`/`.git`。
> 判定口径：DELETE=零引用且死 / KEEP=仍被引用或活 / ARCHIVE=历史归档 / UNKNOWN=需拍板。

## 一、已删除（gitignored + 零活引用）

| 文件 | 依据 |
|---|---|
| `.DS_Store` | OS 垃圾，gitignore，零引用 |
| `.env.saved` | 与 `.env` 逐字节相同；仅被 `.gitignore:17` 与历史 bug 笔记 `BUG-046` 引用，无代码读取；且是 API key 的第二份磁盘副本（小安全隐患） |
| `skills-lock.json` | gitignore（`.gitignore:85`）；仅被 `.gitignore` + 本 plan 引用；无 installer 消费；24 条是真实 skill 面的过时子集 |

## 二、已刷新或已收敛（不是删除）

- **`.env.example`** — 保持为 live template，已收敛为 `IMAGE2_API_KEY` 与 `IMAGE2_BASE_URL`。
- **`_backlog/README.md`** — 已改为 Node.js ESM 描述，目录索引已覆盖两个 `_suspended_*` 历史目录。
- **`_backlog/todos/README.md`** — 已移除归档 todo，推荐执行顺序与剩余活跃 todo 一致。
- **`docs/adr/0005–0007`** — 已从 `Proposed` 标为 `Accepted`。
- **`CONTEXT.md`** — 已由 C2 接入 Agent 入口，并与 active specifications 对齐。

## 三、已决定

- **`todo-deck-ai-sdlc-bpm-keynote-v5-production.md`** — 已归档为 DONE-002，保留原始生产与 follow-up 记录。
- **`_suspeded_plans/` / `_suspened_bugs/`** — 已分别更名为 `_suspended_plans/` / `_suspended_bugs/`，并更新所有索引和链接。

## 四、已排除（不是残留）

- 4 个 `vitest*.config.mjs` — 全被 `run_selected_verification.mjs:55/58/63`、`run_development_verification.mjs:31`、`AGENTS.md:29` 引用。
- `.github/workflows/runtime-readiness.yml` — 活 CI matrix。
- `.env` / `.env.example` — live（见上）。
- `openspec/changes/` active — 0 个 active；C1 与 C2 已归档，无半途废弃的 active change。
- `.claude/.agents/.codex/.cursor` — local-only 配置，不是要删的残留。

## 附：skill 面可复现性

**git 不可复现，纯 local。** 四套镜像全被 gitignore；`.claude/skills/` = 35 个 symlink → `~/.agents/skills/` + 7 个真目录（`keel`、`openspec-*`）。真源在 `~/.agents/skills/`（repo 外）。唯一能重建 mattpocock 子集的 `skills-lock.json` 本身被 gitignore 且无安装器 → 今天 fresh clone 拿到 **0 个 skill**。若要可复现：track `skills-lock.json`（+ 安装脚本）并停止 symlink 进 `~/.agents`；否则应文档化为「有意 local-only」。

## 结论

本次审计范围已关闭：三件硬残留已删除，其余 live 文档已刷新，两个开放决策已归档或更名并保留历史证据。
