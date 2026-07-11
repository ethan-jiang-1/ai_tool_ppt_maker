## Context

宪法执行不对称：`3_versions/v{n}/` 白名单只允许 specs/overrides/`_generated`/README，Agent 想 bak 无处可放；deck 根几乎不拒散落文件 → bak 逃到上层。金甲板已现形。

**宪章原则（组织层级）：上严下松。**

- **越往上越严** — run bundle 根像大门：只许宪法级条目，禁止临时堆箱
- **越往下越松** — 版本内 `_scratch/` 像工位抽屉：本版临时/bak 可松，但不得逃到大门

```
deck 根          ← 最严：仅 control + 三层 + _state + _lessons + .env* + .gitignore (+ 可选 MIGRATION.md)
  ├─ 1_upstream / 2_backbone   ← 中层：有白名单，共享稳定
  └─ 3_versions/v{n}/
       ├─ slide-specifications.md / overrides/   ← 本版源
       ├─ _generated/                            ← 更松：管线派生，可 rm
       └─ _scratch/                              ← 最松：本版唯一临时出口，内部不抠文件名
```

此原则写入 CONSTITUTION + AGENT_CONTRACT，不仅是实现细节。

已有出口不动：`style-master-iterations/`、`_generated/ppt/*.backup.pptx`、`_state/`、`_lessons/`。

## Goals / Non-Goals

**Goals**

- 版本内 `_scratch/` 为临时/备份唯一官方出口
- deck 根 check 拒 bak 等意外条目（上严）
- version 根白名单含 `_scratch/`（下松有名）
- 文档路由表；init/new-version 种子；gitignore
- 金甲板 bak 迁入 `v1/_scratch/`

**Non-Goals**

- deck 根 `_scratch/`
- `_scratch` 进管线 / 当第二真相
- 强制每次改文件自动 bak
- 全量重生页图

## Decisions

### D1 — 名字与位置

`SCRATCH_SUBDIR = '_scratch'`，仅在 version dir。不做 deck 根 scratch。

### D2 — 上严：deck 根允许集

`checkBundle` 在 `deckRoot(runDir)` 上扫描：允许 `deck-guide.md`、`CLAUDE.md`、`project-metadata.yaml`、`README.md`、`.gitignore`、`.env`、`.env.example`、`1_upstream_raw_material/`、`2_backbone/`、`3_versions/`、`_state/`、`_lessons/`；可选 `MIGRATION.md`（迁移 deck 文档，允许）。其余文件/目录 → unexpected（含 `_slidespec.bak*`）。

### D3 — 下松：version 根白名单

在现有允许项上增加 `_scratch/`。`_scratch/` **内部**不白名单文件名（任意 bak/草稿 OK）；仅要求目录存在时可有 README。

### D4 — README 路由表（种子文案）

中文 README 写清欲望→路径，并写「禁止自创 `_tmp`/`backup`/`_bak` 或放到 deck 根」。

### D5 — new-version / gitignore

新版：空 `_scratch/` + README，不拷旧内容。gitignore：`3_versions/*/_scratch/*` 并 `!3_versions/*/_scratch/README.md`（或等价）。

### D6 — 金甲板

apply：`mv` 两份 bak → `3_versions/v1/_scratch/`，直到 `--check` 绿。

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| 旧 deck 根有合法杂文件 | 白名单含 `MIGRATION.md`；其余按 unexpected 修 |
| Agent 仍往 `_generated` 塞 bak | README + CONTRACT 路由表 |
| scratch 膨胀 | 文案：可 rm；非进度 |

## Migration Plan

1. bundle_layout + tests  
2. 宪章/模板文档  
3. 金甲板 bak 搬家  
4. `npm test` + keynote `--check`

## Open Questions

无。
