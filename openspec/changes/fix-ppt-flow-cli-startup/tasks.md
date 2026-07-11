## 1. Restore ppt_flow startup (BUG-003 / BUG-004)

- [ ] 1.1 Replace all three `STYLE_PRESETS.sort()` call sites in `ppt_flow.mjs` with `[...STYLE_PRESETS].sort()`
- [ ] 1.2 Move `state` command registration into `main()` before `program.parseAsync`; delete the top-level orphan `program.command('state')` block
- [ ] 1.3 Smoke: `node …/ppt_flow.mjs doctor` and `node …/ppt_flow.mjs state --help` no longer throw freeze/ReferenceError

## 2. CLI failure JSON envelope (constitution)

- [ ] 2.1 Add a small helper (e.g. `scripts/lib/cli_error.mjs` or inline) that prints the stable envelope and exits non-zero
- [ ] 2.2 Wire `main().catch` and key usage/gate failures in `ppt_flow.mjs` through the helper (at minimum: uncaught + init unknown style + state `--check-gates` blocked)
- [ ] 2.3 Document envelope fields in code comment pointing at `charter/CONSTITUTION.md`

## 3. Specs already drafted in this change — sync main on archive

- [ ] 3.1 Keep delta specs under `specs/cli-surface/` and `specs/node-specification/` accurate during implement
- [ ] 3.2 On archive, sync into `openspec/specs/` (via openspec archive / sync flow)

## 4. Tests

- [ ] 4.1 Extend `tests/test_ppt_flow.mjs`: doctor/startup does not hit frozen-sort; `state --help` succeeds
- [ ] 4.2 Add test: forced fatal / unknown style yields parseable JSON with `ok:false` and `code`
- [ ] 4.3 Run `npm test` and `npm run test:e2e`

## 5. Backlog hygiene

- [ ] 5.1 `git mv` BUG-003 and BUG-004 into `_done/_fixed_bugs/` and update the three README indexes per `_backlog/README.md`
