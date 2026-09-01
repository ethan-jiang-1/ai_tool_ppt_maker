## 1. Create negative knowledge home

- [x] 1.1 Create `docs/known-limitations.md` with the following initial entries: (a) 3D models/chart animations not supported (pptxgenjs limitation); (b) font embedding requires LibreOffice, not in pipeline; (c) Puppeteer rendering rejected — too heavy, `@napi-rs/canvas` is sufficient; (d) JSON Schema for design rules rejected — Controller prose is more flexible; (e) bash pipelines are an absolutely prohibited production dependency. Verify: each entry specifies what was considered and why it was rejected.

## 2. Merge CLAUDE.md unique facts into AGENTS.md

- [x] 2.1 Edit `AGENTS.md` to add Trigger section after line 9 (the tech-stack line): `## Trigger\n\n如果用户提到: **ppt, deck, presentation, pitch deck, keynote, slides, slide deck, 演示文稿, 幻灯片** — 进入 PPT 制作模式.` Verify: the Chinese trigger text appears in AGENTS.md. The exact text should match CLAUDE.md's current Trigger paragraph.
- [x] 2.2 Add a new `## 入口` section after the Trigger section, containing the four numbered entry steps from CLAUDE.md: (1) Read AGENTS.md, (2) Read BOOTSTRAP.md, (3) Read AGENT_CONTRACT.md, (4) Follow current method module / MD Controller guidance. This becomes the entry routing before「这是什么项目」. Verify: the AGENTS.md flow reads Trigger → 入口 → 这是什么项目 → 目录地图 → 快速命令 → Harness边界 → 关键约束 → 从哪里开始.
- [x] 2.3 Merge the `npm test` command reference from CLAUDE.md into AGENTS.md「快速命令」table. Verify: the table now has a row for regression tests: `npm test`.

Note: Task 2.4 (removing Node.js version from CLAUDE.md) is intentionally omitted. Step 3.1 (delete CLAUDE.md + symlink) naturally eliminates all duplicate lines from the old CLAUDE.md. Verification in 5.2 covers the final state.

## 3. Convert CLAUDE.md to a symlink

- [x] 3.1 Delete the existing `CLAUDE.md` file, then create a symlink: `ln -s AGENTS.md CLAUDE.md`. Verify: `ls -l CLAUDE.md` reports `CLAUDE.md -> AGENTS.md`.
- [x] 3.2 Run `cat CLAUDE.md` to confirm content resolves through the symlink and shows the full AGENTS.md content (including the newly merged Trigger section). Verify: the same content as `cat AGENTS.md`.

## 4. Standardize ADR status fields

- [x] 4.1 Edit `docs/adr/0001-intent-route-catalog.md`: change `Status: Superseded` (line 3) to `## Status: Superseded`. Verify: status uses H2 format with a controlled value.
- [x] 4.2 Edit `docs/adr/0002-name-ppt-maker-harness.md`: change `Status: Accepted` (line 3) to `## Status: Accepted`. Verify: same.
- [x] 4.3 Edit `docs/adr/0003-make-the-harness-rename-a-clean-break.md`: change `Status: Accepted` to `## Status: Accepted`. Verify: same.
- [x] 4.4 Edit `docs/adr/0004-bind-run-bundles-to-their-creating-harness.md`: change `Status: Accepted` to `## Status: Accepted`. Verify: same.
- [x] 4.5 Edit `docs/adr/0005-page-image-core-and-header-rendering-policy.md`: change `Status: Accepted` to `## Status: Accepted`. Verify: same.
- [x] 4.6 Edit `docs/adr/0006-define-production-schemas-in-yaml.md`: change `Status: Accepted` on line 9 to `## Status: Accepted`. Verify: same.
- [x] 4.7 Edit `docs/adr/0007-refusals-carry-repair-guidance.md`: change `Status: Accepted` to `## Status: Accepted`. Verify: same.
- [x] 4.8 Verify all 7 ADR files: run `grep -E '^## Status: (Proposed|Accepted|Superseded|Rejected|Archived)$' docs/adr/*.md` and confirm exactly 7 matches. Verify: no ADR uses an uncontrolled status value.

## 5. Final verification

- [x] 5.1 Run `ls -l CLAUDE.md` and confirm it is a symlink to AGENTS.md. Verify: symlink target is AGENTS.md.
- [x] 5.2 Run `grep -c 'Node.js' AGENTS.md` — should be exactly 1 (the line in the tech-stack section). Run `grep -c 'Node.js' CLAUDE.md` — should resolve through symlink and match AGENTS.md count (not a separate copy). Verify: Node.js version has exactly one home.
- [x] 5.3 Read `docs/known-limitations.md` and confirm it exists with at least 3 entries. Verify: file exists and is non-empty.
- [x] 5.4 Read the full AGENTS.md through the symlink (`cat CLAUDE.md`) and confirm it includes the Trigger section, four-step entry flow, and `npm test` command. Verify: all merged content is present and readable.