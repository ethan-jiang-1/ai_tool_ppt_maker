## 1. Restore ppt_flow startup (BUG-003 / BUG-004)

- [ ] 1.1 Replace all in-place mutators on `STYLE_PRESETS` in `ppt_flow.mjs` with `[...STYLE_PRESETS].sort()`; grep confirms zero `STYLE_PRESETS.(sort|reverse|splice)(` leftovers
- [ ] 1.2 Move `state` into `main()` before `parseAsync`; delete module-top-level orphan `program.command('state')`
- [ ] 1.3 Sync **12 commands** copy: `ppt_flow.mjs` header, `scripts/README.md`, `openspec/config.yaml` `cli-surface` row; optionally add `state` to AGENT_CONTRACT 速查 examples
- [ ] 1.4 Smoke: `doctor`, `state --help`, `--help` — no freeze / no `program is not defined`; help lists `state`

## 2. CLI failure JSON envelope + charter wire format

- [ ] 2.1 Add `scripts/lib/cli_error.mjs`: `CLI_ERROR_CODES`, `formatCliError` (reject empty/illegal), `emitCliError` (no exit); optional `exitCliError`
- [ ] 2.2 **Apply-time charter sync** (not before apply): tighten `CONSTITUTION.md` / `NODE-SPEC.md` / `AGENT_CONTRACT.md` §7 / `openspec/config.yaml` 铁律 to design **D2** — stderr、**最后一个非空行**、单行 JSON（replace「stdout 或 stderr」）
- [ ] 2.3 Enable commander `exitOverride`; map CommanderError → `USAGE`; `main().catch` → `UNCAUGHT`
- [ ] 2.4 Wire every non-zero exit per design **D13** (exactly-once): USAGE / FAILED / GATE_BLOCKED / STATE_CORRUPTED; grep leftovers (`process.exit(1|2)` without prior emit; `command*` return 1 without emit)
- [ ] 2.5 Subprocess wrappers (doctor/build/…): on non-zero child status, emit `FAILED` **after** child returns, then `process.exit(childCode)` (design D11)
- [ ] 2.6 `state --check-gates` blocked → `GATE_BLOCKED` (exit 1, hint names pending gates); corrupted → `STATE_CORRUPTED` (exit 2)

## 3. Tests

- [ ] 3.1 Startup: doctor has no freeze TypeError; if doctor exits non-zero (e.g. missing creds), last non-empty stderr line is `FAILED` JSON; `--help` lists `state`; `state --help` exit 0 and no failure envelope
- [ ] 3.2 Envelope: `nosuch` → `USAGE`; `init … --style not-a-preset` → `USAGE` with hint listing presets; parse **last non-empty** stderr line → `ok:false`
- [ ] 3.3 Envelope: design **D14** minimal fixture → `state … --check-gates` → exit 1 + `GATE_BLOCKED`
- [ ] 3.4 Static guard: `STYLE_PRESETS\.(sort|reverse|splice)\(` absent in `ppt_flow.mjs`
- [ ] 3.5 Unit-test `formatCliError` / `CLI_ERROR_CODES` (required fields; empty message / bad code rejected)
- [ ] 3.6 Spot-check D13: at least one path that used to double-risk (e.g. init unknown style) emits **exactly one** failure JSON object on stderr
- [ ] 3.7 `npm test` and `npm run test:e2e` all green

## 4. Backlog + archive readiness

- [ ] 4.1 `git mv` BUG-003 and BUG-004 to `_done/_fixed_bugs/`; update the three README indexes
- [ ] 4.2 Confirm design **Acceptance** checklist (design.md) is all true before calling the change done
- [ ] 4.3 On archive (later): sync deltas into main specs and update `cli-surface` Purpose from「11」to「12」
