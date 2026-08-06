# CLAUDE.md

## Trigger

如果用户提到: **ppt, deck, presentation, pitch deck, keynote, slides, slide deck, 演示文稿, 幻灯片** — 进入 PPT 制作模式.

## 入口

1. Read [AGENTS.md](AGENTS.md) — repo 级 agent 指引
2. Read [ppt_maker_harness/BOOTSTRAP.md](ppt_maker_harness/BOOTSTRAP.md) — 三步启动
3. Read [ppt_maker_harness/charter/AGENT_CONTRACT.md](ppt_maker_harness/charter/AGENT_CONTRACT.md) — 11 条铁律
4. 按 Phase 读 [ppt_maker_harness/AGENTS.md](ppt_maker_harness/AGENTS.md)

## 技术栈

Node.js 22.x、24.x 或 26.x ESM (.mjs). 回归测试: `npm test`.

## 版本管理

根目录 `VERSION` 是当前 repo 版本号（semver）。每次 `openspec-archive-change` 完成后，按 `openspec/config.yaml` `rules:` `version:` 段定义的 bump 粒度规则判断是否需要 bump（MINOR/PATCH/不 bump），向用户建议，确认后同步更新 `VERSION`、`VERSION_LOG.md`、`ppt_maker_harness/README.md` 和 `package.json`。
