# Residue List — 残留清单

> 来源：keel `rot-audit`（只读扫描）| 2026-08-13
> 范围：顶层文件 + `_backlog/` + `docs/adr/` + `openspec/changes/`(active) + `.claude/.agents/.codex/.cursor/`；引用追踪回 `ppt_maker_harness/`、`openspec/specs/`、`tests/`、`tests_e2e/`。未读 `deck_*`/`dpt_*`/`node_modules`/`.git`。
> 判定口径：DELETE=零引用且死 / KEEP=仍被引用或活 / ARCHIVE=历史归档 / UNKNOWN=需拍板。

## 一、可安全删除（gitignored + 零活引用）

| 文件 | 依据 |
|---|---|
| `.DS_Store` | OS 垃圾，gitignore，零引用 |
| `.env.saved` | 与 `.env` 逐字节相同；仅被 `.gitignore:17` 与历史 bug 笔记 `BUG-046` 引用，无代码读取；且是 API key 的第二份磁盘副本（小安全隐患） |
| `skills-lock.json` | gitignore（`.gitignore:85`）；仅被 `.gitignore` + 本 plan 引用；无 installer 消费；24 条是真实 skill 面的过时子集 |

## 二、保留但需内容刷新（不是删除）

- **`.env.example`** — live（`bundle_layout.mjs:414,1676,1690` 复制进每个 run bundle；`openspec/specs/run-bundle-management/spec.md:43`）。但注释里的 `IMAGE2_BASE_URLS`/`IMAGE2_VENDORS`/`OPENAI_API_KEY` 在 `ppt_maker_harness/`、`tests/`、`tests_e2e/` 零读取 → 刷新为仅 `IMAGE2_API_KEY` + `IMAGE2_BASE_URL`。（`doctor --probe-vendors`/`--smoke` 仍存在：`env_check.mjs`、`ppt_flow.mjs:3323-3333`）
- **`_backlog/README.md:12`** — 陈旧声明「Python 双栈」；Python 已迁走（archive `2026-07-10-python-to-nodejs-migration`）。
- **`_backlog/todos/README.md`** — 活跃列表与「当前无活跃 todo」自相矛盾；`../plans/html-first-progressive-rendering.md` 链接已移到 `_done/_closed_plans/`。
- **`docs/adr/0005–0007`** — `Status: Proposed` 但内容已落地（schema-YAML authority 已由 `2026-08-11-publish-production-schema-definitions`、`2026-08-12-converge-active-schema-authority` 落地；Repair Guidance 已在 `CONTEXT.md`）→ 翻 `Proposed`→`Accepted` 或标 superseded。
- **`CONTEXT.md`** — 内容当前（已重写，用 `ppt_maker_harness`，无旧名），但**未接线**：`AGENTS.md`/`CLAUDE.md`/`README.md`/`openspec/specs/` 都不链它，fresh agent 看不见。二选一：(a) 在 `AGENTS.md` 加权威链接；(b) 把 glossary 并入 `openspec/specs/`。

## 三、需你拍板

- **`_backlog/todos/todo-deck-ai-sdlc-keynote-v5-production.md`** — 8/12 done，2026-08-02 后未动，deck 已翻新（旧版 drop/retire）→ 确认完成则 `git mv` 到 `_done/_done_todos/`；仍在进行则刷新。
- **`_backlog/_done/_suspeded_plans/`** — 拼写错误目录名（"suspeded"），2 个 suspended plan，未在任何 `_backlog` README 索引 → 改名 `_suspended_plans/` 或补索引（顺带修 sibling `_suspened_bugs/` 同类 typo）。

## 四、已排除（不是残留）

- 4 个 `vitest*.config.mjs` — 全被 `run_selected_verification.mjs:55/58/63`、`run_development_verification.mjs:31`、`AGENTS.md:29` 引用。
- `.github/workflows/runtime-readiness.yml` — 活 CI matrix。
- `.env` / `.env.example` — live（见上）。
- `openspec/changes/` active — 0 个 active、106 个 archive，无半途废弃的 active change。
- `.claude/.agents/.codex/.cursor` — local-only 配置，不是要删的残留。

## 附：skill 面可复现性

**git 不可复现，纯 local。** 四套镜像全被 gitignore；`.claude/skills/` = 35 个 symlink → `~/.agents/skills/` + 7 个真目录（`keel`、`openspec-*`）。真源在 `~/.agents/skills/`（repo 外）。唯一能重建 mattpocock 子集的 `skills-lock.json` 本身被 gitignore 且无安装器 → 今天 fresh clone 拿到 **0 个 skill**。若要可复现：track `skills-lock.json`（+ 安装脚本）并停止 symlink 进 `~/.agents`；否则应文档化为「有意 local-only」。

## 结论

今天值得删的「硬残留」只有三件：`.DS_Store`、`.env.saved`、`skills-lock.json`。其余要么是「活但需刷新内容」（`.env.example`、`_backlog` README、`CONTEXT.md` 接线、ADR 状态），要么是真正的开放决策（两个 todo、orphan `_suspeded_plans/`）。
