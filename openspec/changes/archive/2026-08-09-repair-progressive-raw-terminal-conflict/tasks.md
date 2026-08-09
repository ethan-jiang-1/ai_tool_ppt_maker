## 1. Progressive Raw Owner

- [x] 1.1 In `image-generation`, extend the progressive raw attempt-chain evaluator so it recognizes only a childless, tuple-identical `succeeded` plus `unknown` terminal pair, preserves the existing childless `known_failure` plus `unknown` compatibility pair, and keeps all other terminal shapes as integrity hard-stops.
- [x] 1.2 Keep candidate-success selection internal until the existing materialization provenance and raw-byte validation completes; retain the immutable unknown record and exact grant accounting without schema/store changes, retries, replacements, or provider work.
- [x] 1.3 Make inspection, planning, and generation consume the completed single owner-issued effective-attempt verdict, including normal continuation after a valid pair and fail-closed behavior for invalid evidence.
- [x] 1.4 Make exact reconciliation of an already effective terminal pair provider-free and idempotent: return its current owner action without lookup, an appended terminal record, or a raw attempt/provenance/grant write.

## 2. CLI Diagnostics

- [x] 2.1 In `cli-surface`, consume the progressive raw owner's issued action for a valid effective terminal and remove any generic `rebuild_progressive_raw_work` recovery claim when no registered command can execute it.
- [x] 2.2 Map the unrepairable terminal-branch integrity failure to the existing bounded, secret-safe `report_internal` diagnostic, without suggesting retry, force, state editing, replacement authorization, or provider work.

## 3. Regression Evidence

- [x] 3.1 Add provider-free progressive raw-owner regressions for the incident sequence in one three-item authorized batch: the first item reaches `unknown`, the second has a validated `succeeded` plus `unknown` pair, and lifecycle continuation selects the existing grant's third eligible item with no mutation or submit.
- [x] 3.2 Add an owner regression for reconciling the already-effective parent and prove that it makes no lookup, terminal-record, provenance, grant, or provider write while returning the current action.
- [x] 3.3 Add focused negative owner regressions proving that missing or invalid success provenance/media, identity mismatch, descendants, and other sibling shapes remain integrity hard-stops with no effective terminal or provider submission.
- [x] 3.4 Add public `ppt_flow image2` regressions proving that a valid pair has no integrity/rebuild diagnostic and that an unrepairable invalid branch produces only the bounded `report_internal` maintenance diagnostic.
- [x] 3.5 Run the focused owner and public CLI suites, then the protected `npm test` regression suite; finish with `openspec validate repair-progressive-raw-terminal-conflict --strict` and `git diff --check`.
