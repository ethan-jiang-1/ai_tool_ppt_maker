## Context

The framework has three authority surfaces that evolved at different speeds:

1. executable runtime contracts in `scripts/` and `openspec/specs/`;
2. MD Controller declarations in `playbook/` plus persisted `_state/state.yaml`;
3. human/agent teaching material in root, charter, workflow, reference, templates, and README files.

The production path is already strongly guarded by run-bundle layout validation, render policy resolution, image provenance, header-review fingerprints, and regression tests. The coherence defects occur at the boundaries: embedded playbook YAML is not parsed by `state.mjs`; `requires` is not enforced by `checkEntry`; most condition tokens are prose; duplicate node IDs are ambiguous; state writers accept invalid statuses; `speaker_notes_injected` is circular; delegated CLIs can produce duplicate failure envelopes; and recent runtime changes were not propagated through all active documentation and command examples.

The change must remain Node.js ESM only, preserve the run-bundle layout and public 12-command `ppt_flow` surface, retain Markdown as the agent-facing controller format, and avoid changing PPT visual/content outputs.

## Goals / Non-Goals

**Goals:**

- Make every registered playbook node discoverable, uniquely identifiable, parseable, dependency-checked, and testable.
- Make entry/exit results derive from declarations and persisted evidence rather than vacuous or unknown-condition passes.
- Version and heal state deterministically while rejecting invalid writes.
- Replace the Stage-5 circular completion proxy with current artifact evidence.
- Ensure one externally visible JSON failure envelope for every failed CLI invocation, including delegated commands.
- Make active documentation, OpenSpec context, and documented CLI examples agree with current runtime behavior.
- Add whole-framework tests that prevent the same classes of drift from returning.

**Non-Goals:**

- Changing the run-bundle three-tier layout or generated artifact locations.
- Replacing the agent with a workflow server or fully automatic DAG engine.
- Automating subjective content/visual approval or removing human gates.
- Changing image models, generation profiles, slide content, or render output.
- Expanding the public `ppt_flow` command count.
- Refactoring large production modules except where extraction is required for a shared contract.

## Decisions

### 1. Keep Markdown controllers and define one parseable node grammar

Ordered playbooks will continue to contain fenced YAML node declarations. Standalone shared nodes may use document frontmatter. A new orchestration-independent module, `scripts/lib/playbook_model.mjs`, will support exactly those forms and construct an index containing playbook, order, includes, node ID, source file/line, `requires`, `entry`, `exit`, optional `produces`, optional `decisions`, lifecycle metadata, and step blocks. `decisions` is a non-empty list of unique strings for a GATE node whose outcome controls later routing. It will use the already declared `yaml` package for parsing, add no dependency, and will not import runtime orchestration modules.

Node declarations will replace ambiguous `phase` with:

- `lifecycle_phase`: one of `0`, `1`, `2`, `2.7`, `3`, `4`;
- `method_module`: one of `00-setup`, `01-visual`, `02-content`, `03-prompts`, `04-production`, `05-iteration`.

Node bodies will use one compact syntax: `**Step N — MD**`, `**Step N — CLI**`, or `**Step N — GATE**`. Mixed labels such as `CLI/State` will be split into explicit steps. The validator will require at least one step and monotonically ordered step numbers.

If a downstream `node_decision:<node>:<value>` condition is declared, the upstream node must declare that exact value in `decisions`, contain a GATE step, and exit through `decision_recorded` or `user_decision_recorded`. This makes misspelled or orphan branch values a static validation error.

Alternative: split all embedded nodes into separate files. Rejected because it damages the controller's narrative readability without solving more problems.

### 2. Require globally unique node IDs

State persists nodes as `state.nodes.<id>` and `current_node`, so duplicate IDs cannot be resolved safely without context. Generic duplicates such as `verify-output` will become intent-specific IDs. Lookup will use the parsed index, never substring search.

The index will reserve system-owned state IDs, initially `header-review`. Reserved system records are not controller nodes and remain cross-execution because their own version/fingerprint contract governs freshness. A playbook declaration using a reserved ID is invalid, and state migration will not rewrite system evidence as an ordinary controller record.

Alternative: qualify all IDs as `<playbook>/<node>`. Rejected because it would force a broad state-key migration. Global uniqueness is sufficient for the current controller registry.

### 3. `requires` is the only node-to-node prerequisite mechanism

`checkEntry` will automatically evaluate every declared `requires` item as `node_done:<id>` before evaluating explicit `entry` conditions. Playbooks will not duplicate completed-node prerequisites in `entry`.

Entry conditions may contain only deterministic filesystem/state/gate conditions. Subjective human judgment is not valid as an entry condition; downstream nodes depend on the completed upstream node instead.

This removes the current ambiguity where a token can appear in `requires`, `entry`, or both with different enforcement.

### 4. Completion claims and branch decisions are typed and execution-scoped

Node steps that cannot be re-derived from a current artifact will store typed evidence:

```yaml
evidence:
  <evidence-key>:
    met: true
    kind: user | agent | cli
    at: <ISO-8601>
    note: <optional string>
```

Decisions use the parallel shape `{value:<non-empty string>, kind:"user"|"agent"|"cli", at:<ISO-8601>, note?:<string>}`. The API will expose `setNodeEvidence(state, nodeId, key, {kind, note})` and `setNodeDecision(state, nodeId, value, {kind, note}, playbookIndex)`; both validate their inputs and tag the active execution. Decision writes fail closed unless the exact node declaration exists and its `decisions` list contains the value. Persistence still occurs through the existing `writeState` contract. Boolean evidence written by an early implementation will heal to `{met:true, kind:"agent", at:<migration-time>}`. A legacy scalar decision heals to kind `agent`, never to `user`, so migration cannot fabricate human approval.

The condition families are:

- `evidence:<key>`: current-node evidence of any kind, valid only in `exit`;
- `user_evidence:<key>`: current-node evidence whose kind is `user`, valid only in `exit`;
- `decision_recorded`: a valid current-node decision of any kind, valid only in `exit`;
- `user_decision_recorded`: a valid current-node decision whose kind is `user`, valid only in `exit`;
- `node_evidence:<node>:<key>`: evidence on a required, **completed** (not skipped) upstream node in the same execution, valid in downstream `entry`;
- `node_decision:<node>:<value>`: exact typed decision value on a required, **completed** upstream node in the same execution, valid for mutually exclusive branches.

For example, a review node exits with `user_decision_recorded`; the downstream readiness branch declares `node_decision:hitl2:proceed`. The branch condition cannot pass from a skipped predecessor, a prior execution, a scalar legacy decision attributed to the agent, or a decision on a node not declared in `requires`. Free-form unknown conditions are errors rather than an implicit manual fallback.

Existing controllers will normalize conditions by the following target matrix:

| Controller area | Deterministic checks | Typed evidence / decision |
|---|---|---|
| shared classification | dependencies only | `change-classified` and `playbook-selected`, kind `agent`; persist classification fields |
| create instantiation | `run_bundle_exists`, `deck_guide_created` | none |
| intake/direction | required predecessor | user evidence `intake-confirmed`; typed user decision where a branch value is required |
| visual setup | `visual_preset_seeded`, `style_master_exists`, `gate_approved:visual` | user evidence `style-master-reviewed` |
| content/block map | `gate_approved:content` | agent evidence `topics-generated`; user evidence `block-map-confirmed` |
| L1/L2/L4 and research | `slide_specs_exists` | agent evidence `l1-l2-l4-complete`, `sources-collected` |
| L3 completion | new `slide_specs_valid` condition | agent evidence `l3-prompts-filled` |
| production | `pptx_generated`, `speaker_notes_injected`, new `header_review_current` | none |
| review nodes | current artifacts as applicable | one typed decision plus `user_decision_recorded`; downstream branches use `node_decision:<node>:<value>` |
| CLI-only steps without durable artifact | required predecessor | evidence named for the successful operation, kind `cli` |
| agent planning/mapping steps | required predecessor | evidence named for the completed plan/map, kind `agent`; user confirmation uses a separate user-evidence key |
| final verification/delivery | current artifact checks | user evidence for subjective correctness; agent evidence for delivery action |

Legacy prose tokens such as `intake_complete`, `prompt_updated`, `pilot_done`, or `scope_confirmed` will not be added as arbitrary one-off condition functions. They will be removed as duplicated prerequisites, replaced with one of the reusable deterministic conditions above, or represented as typed evidence according to this matrix.

The shared classification node persists a canonical scope object under its current-execution record: `{mode:"all"|"slides", slide_ids:<unique canonical ID array>, change_kind:<string>, selected_playbook:<string>}`. `mode: slides` requires at least one ID. Mixed-mode title requests without resolvable slide IDs cannot complete classification.

The three changed deterministic conditions have exact semantics:

| Condition | Exact check |
|---|---|
| `slide_specs_valid` | Run the same side-effect-free validation function used by Stage 1 against the current canonical slide specification; pass only with zero errors, no L3 placeholders, and all render-required fields present. |
| `header_review_current` | Resolve the current production profile and relevant content `full-page` IDs. In iteration controllers, relevant IDs come from the current execution's classification scope; in create-deck they are all current content full-page IDs. Pass vacuously only when the relevant set contains no full-page slide; otherwise require current per-ID reviewed hashes/fingerprint for the same version and profile. |
| `speaker_notes_injected` | Validate receipt schema v1, contained paths, current input/PPTX hashes, and exact count equality as specified by `notes-injection`. |

The `CONDITIONS` registry retains its existing boolean function contract. A companion evaluator attaches `{reason, hint}` diagnostics for known failures; `checkEntry`/`checkExit` retain the constitutional `{pass, missing, unknown}` fields and may expose diagnostics additively without breaking callers.

### 5. Introduce an explicit state schema version, an active execution working set, and enforced enums

`state.yaml` will gain `schema_version: 2` with exported constant `STATE_SCHEMA_VERSION = 2`, plus `execution_id` and `execution_started_at` whenever `playbook` is active. A default/inactive state may keep all three fields empty; it may not contain controller records. Existing `started_at` becomes the stable whole-workflow start time; it is no longer overwritten for each playbook. Every controller-node record written during a playbook run will carry the active execution ID. Missing version is treated as legacy v1 and migrated to v2 during the existing heal path. Migration includes known node aliases, evidence/decision normalization, execution tagging, time-field normalization, and cleanup of invalid temporal combinations. Reserved system records are excluded from controller execution tagging.

Top-level `nodes` is the **active execution working set**, plus reserved system records. `startPlaybook(state, playbook, {replace:false})` creates a new execution ID/start time and clears all controller records while preserving reserved records such as `header-review`. It rejects a non-empty stack and rejects replacing an incomplete active execution unless `replace:true` is explicit; nested work must use `switchPlaybook`. A completed execution or empty working set may start the next execution without force. This makes a deliberate second `edit-text` run pending from its first node without depending on lazy overwrite behavior or silently discarding unfinished work.

`switchPlaybook` requires an active execution, deep-clones the active controller working set into a stack entry `{playbook, current_node, execution_id, execution_started_at, controller_nodes}`, then starts a clean nested execution. `resumePlaybook` discards the nested controller working set, restores all five parent fields, and merges the latest reserved system records back in; an empty stack remains a documented no-op. A pointer-only stack is insufficient: a nested controller can reuse the shared `classify-change` node ID and would otherwise overwrite evidence required by its parent. Entry/exit conditions and controller-aware queries fail closed on any controller record whose execution ID does not match the active execution.

History remains a non-authoritative audit log; correctness does not depend on recovering an old working set from history. For legacy v1 stack entries, provenance is irrecoverable: migration assigns stable execution fields and an empty `controller_nodes` snapshot, preserves the active execution's recoverable nodes, and records a diagnostic that the resumed parent must re-enter from a safe pending state. It SHALL NOT guess that one flat shared-node record belonged to multiple executions.

`setNodeStatus` and `setGate` will reject values outside their declared enums. Heal will normalize invalid persisted values to the safest blocking state (`pending`) and preserve a diagnostic note. Moving a completed node back to `in_progress` clears its old `completed` timestamp; completing it clears incompatible failure fields.

State atomic writes will create the temporary file beside the target `_state/state.yaml`, not in `os.tmpdir()`, so the final rename remains same-filesystem and does not fail with `EXDEV` on external volumes or platform-specific temp mounts.

The migration is idempotent. An active legacy state receives one stable migration execution ID generated once and persisted; legacy stack entries receive distinct IDs once. An inactive empty legacy state remains inactive. If an old and new node key both exist, the new key wins and only missing fields are merged from the old key; the legacy key is removed after normalization. Alias resolution uses the active playbook before execution tagging. Ambiguous legacy records that cannot be attributed without guessing are normalized to blocking pending state with a diagnostic rather than copied into multiple executions.

### 6. Use a Stage-5 receipt for deterministic notes completion

The current `speaker_notes_injected` condition checks whether `wave2` is already completed, while `wave2` itself requires `speaker_notes_injected`; once gate parsing works, that becomes circular.

The run-dir Stage-5 path will use a transactional sequence: invalidate any prior receipt; require exactly one non-backup target PPTX; hash the canonical slide specification; generate the modified PPTX to a same-directory temporary file; atomically replace the target; hash the final PPTX; then atomically write `_generated/qa/notes_injection.json`. Receipt schema version 1 contains normalized run-dir-relative `pptx_path` and `input_path` values, both SHA-256 hashes, slide count, injected-note count, and an ISO timestamp. Lexical paths and resolved realpaths must remain inside the run directory, so `..`, absolute paths, and escaping symlinks cannot become evidence. A small dependency-free `scripts/lib/notes_receipt.mjs` will be shared by Stage 5 and state conditions.

`speaker_notes_injected` will pass only when the receipt exists, its schema and relative paths are valid, hashes match current files, and injected-note count equals slide count. A missing SPEAKER NOTE block is a hard Stage-5 error rather than a nominally successful partial injection. If Stage 5 fails or crashes after invalidation, the missing receipt keeps the gate blocked even when an older PPTX still exists. The low-level standalone `--pptx`/`--input` interface remains available but is documented as Expert mode and does not claim to create a run-dir receipt; canonical run-dir production continues through `unified_pipeline`/`ppt_flow` and produces the receipt.

Stage 5 directly imports `jszip`, so `jszip` will become an explicit package dependency rather than an undeclared transitive dependency.

### 7. Preserve one failure envelope across delegated processes

The direct executable inventory is exactly: `bundle_layout.mjs`, `env-check.mjs`, `generate_style_master.mjs`, `make_contact_sheet.mjs`, `ppt_flow.mjs`, `stage1_build_inputs.mjs`, `stage2_generate_images.mjs`, `stage3_lock_headers.mjs`, `stage4_build_pptx.mjs`, `stage5_inject_notes.mjs`, and `unified_pipeline.mjs`. `image_api_client.mjs` and `visual_config.mjs` are libraries, not direct CLIs; the misleading shebang on the former will be removed. Inventory tests compare this explicit registry with direct-entry guards so the count cannot drift silently.

For `ppt_flow` delegation, `runNode` will stream child stdout, decode stderr safely across arbitrary chunk boundaries, and retain only the latest incomplete/non-emitted stderr line. Once a following line arrives, the previous complete diagnostic line is relayed. The candidate line is capped at 64 KiB; overflow is relayed as diagnostics and cannot be mistaken for an envelope. On child close, the final non-empty line is consumed only if it parses as a valid failure envelope; otherwise it is relayed and the parent synthesizes fallback child context. The parent emits exactly one `ppt_flow` envelope derived from valid child `message`/`hint` fields or the bounded fallback diagnostic, maps the code to the parent's stable vocabulary, and preserves a valid child exit status (falling back to 1).

The child envelope will not also be forwarded to the parent's stderr. Fragmented JSON, no trailing newline, trailing whitespace, a spawn error, a non-compliant prose-only child, and an exit-zero child that emits a failure envelope all receive explicit tests. The last case is treated as a contract failure, not success. Stdout remains streamed so heartbeats and image progress stay observable. This resolves the earlier ambiguous proposal to tolerate two envelopes.

### 8. Validate documented CLI examples against real help surfaces

Documentation coherence will cover more than links and stale words. A test helper will extract commands from `bash`, `sh`, `shell`, and `console` fences plus inline code whose first executable token (after an optional prompt marker and environment assignments) is `node` and whose script is under `PPTMAKER_FRAMEWORK/scripts/` or `scripts/`. It will join backslash continuations, ignore comment/output lines, require one analyzable Node invocation per logical command, identify the script and optional `ppt_flow` subcommand, and verify every documented long flag appears in that command's side-effect-free `--help` output.

Intentionally non-executable examples must use the exact, single-example marker `<!-- coherence:pseudocode reason="..." -->` immediately before the fenced block or paragraph containing the inline span. The reason must be non-empty; the marker applies only to that next example and cannot exempt a file or directory. Shell constructs outside the supported grammar must either be rewritten as an analyzable command or carry this marker. Placeholder values such as `<run-dir>` are allowed; placeholder option names are not.

This catches active instructions such as `stage3_lock_headers.mjs --run-dir` when the standalone command does not support that flag. Active guides will prefer `ppt_flow` or `unified_pipeline --run-dir`; low-level stage examples must use their real flags.

### 9. Treat documentation coherence as executable policy

The documentation suite will use `scripts/lib/framework_coherence.mjs` to scan all active Markdown for relative links, current paths, external-skill remnants, canonical render terms, render-aware edit chains, version-delta semantics, hierarchy terms, and CLI examples. The module is a library, not a new public CLI. Historical exemptions are file-specific and reasoned; directory-wide exclusions are invalid.

For facts repeated in summary tables, tests will consume canonical constants or explicit expected contract fixtures rather than loose existence checks. The suite will fail with source file, line, rule, and remediation hint.

### 10. Use four non-competing hierarchy terms

Active guidance will use:

- **Lifecycle Phase**: `0 → 1/2 → 2.7 → 3 → 4`;
- **Method Module**: workflow directories `00-setup` through `05-iteration`;
- **Pipeline Stage**: executable stages `1–5`;
- **Playbook Node**: controller steps.

This preserves folder names and the established 2.7 L3-fill checkpoint while removing incompatible claims such as “three macro phases,” “six phases,” and node `phase: 04` meaning a directory rather than lifecycle position.

### 11. Keep validation reusable without expanding the public CLI

Playbook and documentation validators will be exported Node modules and invoked by Vitest through `ppt_flow test`. No thirteenth `ppt_flow` command will be added. `bundle_layout --self-check` remains focused on layout SSOT and does not absorb unrelated coherence responsibilities.

The same playbook index will also feed `ppt_flow state`: completed/pending lists will be calculated against the active controller's full node set, not only node records that already exist in YAML. When exactly one downstream node has all requirements satisfied, `suggested_next` will name it; when multiple branch nodes are eligible, the resume card will list candidates and require an agent/user decision rather than guessing.

### 12. Freeze the controller normalization manifest before implementation

The following table is normative for controller edits. `A:`, `U:`, and `C:` mean agent, user, and CLI evidence respectively; `D[...]` is a typed user decision enum. “current PPTX/notes/header” expands exactly to `pptx_generated`, `speaker_notes_injected`, and `header_review_current`; “gates” expands to `gate_approved:content` and `gate_approved:visual`. Unless a deterministic entry condition is named, entry is dependency-only. Deterministic artifact checks are re-evaluated at exit; evidence is used only for work that cannot be derived from current artifacts.

| Controller | Target node | Lifecycle / module | Requires | Exit / branch contract |
|---|---|---|---|---|
| shared | `classify-change` | 4 / 05-iteration | — | A:`change-classified`, A:`playbook-selected`, A:`scope-resolved`; persist classification and selected slide IDs |
| create-deck | `instantiation` | 0 / 00-setup | — | `run_bundle_exists`, `deck_guide_created` |
| create-deck | `hitl1` | 0 / 00-setup | instantiation | U:`intake-confirmed`, U:`direction-confirmed` |
| create-deck | `setup` | 2 / 01-visual | hitl1 | `visual_preset_seeded`, `style_master_exists`, `gate_approved:visual`, U:`style-master-reviewed` |
| create-deck | `seed-topics` | 1 / 02-content | setup | `gate_approved:content`, A:`topics-generated`, U:`block-map-confirmed` |
| create-deck | `wave0` | 1 / 02-content | seed-topics | `slide_specs_exists`, A:`l1-l2-l4-complete`, A:`sources-collected` |
| create-deck | `wave1` | 2.7 / 03-prompts | wave0 | `slide_specs_valid`, A:`l3-prompts-filled` |
| create-deck | `wave2` | 3 / 04-production | wave1 | `pptx_generated`, `speaker_notes_injected`, `header_review_current` |
| create-deck | `hitl2` | 4 / 05-iteration | wave2 | D[`proceed`,`repair`,`redirect`], `user_decision_recorded` |
| create-deck | `readiness` | 4 / 05-iteration | hitl2 | entry `node_decision:hitl2:proceed`; current PPTX/notes/header/gates + A:`delivery-checks-passed` |
| create-deck | `rerun` | 4 / 05-iteration | hitl2 | entry `node_decision:hitl2:repair`; A:`repair-completed` after nested change playbook returns |
| create-deck | `final` | 4 / 05-iteration | readiness | A:`deck-delivered` |
| edit-text | `stage-text` | 4 / 05-iteration | classify-change | entry `slide_specs_exists`; invoke `ppt_flow refresh --kind title`; exit current PPTX/notes/header for selected scope |
| edit-text | `verify-text-output` (from `verify-output`) | 4 / 05-iteration | stage-text | U:`text-change-verified` |
| edit-visual | `pilot` | 4 / 05-iteration | classify-change | exact three-slide representative pilot; `header_review_current`, U:`pilot-approved` |
| edit-visual | `confirm` | 4 / 05-iteration | pilot | U:`scope-confirmed` |
| edit-visual | `regenerate` | 4 / 04-production | confirm | current PPTX/notes/header |
| edit-visual | `verify-visual-output` (from `verify-output`) | 4 / 05-iteration | regenerate | U:`visual-change-verified` |
| edit-notes | `inject-notes` | 4 / 04-production | classify-change | `speaker_notes_injected` |
| edit-notes | `verify-notes` | 4 / 05-iteration | inject-notes | U:`notes-verified` |
| restructure-slides | `new-version` | 4 / 05-iteration | classify-change | C:`new-version-created`; persist new run-dir path |
| restructure-slides | `regenerate-affected` | 4 / 04-production | new-version | current PPTX/notes/header in new version |
| restructure-slides | `verify-restructure-output` (new) | 4 / 05-iteration | regenerate-affected | U:`structure-change-verified` |
| quick-preview | `validate-ready` | 2 / 04-production | — | `style_master_exists`, C:`preview-readiness-validated` (content/visual gates may remain pending) |
| quick-preview | `pilot-generate` | 2 / 04-production | validate-ready | C:`pilot-generated` |
| quick-preview | `review-preview` | 2 / 01-visual | pilot-generate | D[`approve`,`retry`], `user_decision_recorded`; approve records current header evidence, retry resets pilot/review |
| iterate-style | `start-iterate` | 2 / 01-visual | — | U:`iteration-goals-confirmed` |
| iterate-style | `tweak-prompt` | 2 / 01-visual | start-iterate | A:`style-prompt-updated` |
| iterate-style | `generate` | 2 / 01-visual | tweak-prompt | `style_master_exists`, C:`style-master-generated` |
| iterate-style | `review-gate` | 2 / 01-visual | generate | D[`approve`,`retry`,`reject`], `user_decision_recorded`; approve writes visual gate, retry resets loop |
| migrate-import | `intake-source` | 0 / 00-setup | — | D[`A`,`B`,`C`], `user_decision_recorded`, U:`success-criteria-confirmed` |
| migrate-import | `align-bundle` | 0 / 00-setup | intake-source | `run_bundle_exists`, C:`bundle-layout-validated` |
| migrate-import | `inventory-map` | 0 / 00-setup | align-bundle | A:`assets-mapped`, U:`mapping-confirmed` |
| migrate-import | `early-show` | 0 / 00-setup | inventory-map | U:`artifact-reviewed` |
| migrate-import | `reaffirm-gates` | 0 / 00-setup | early-show | `gate_approved:content`, `gate_approved:visual`, U:`gates-reaffirmed` |
| migrate-import | `handoff` | 0 / 00-setup | reaffirm-gates | A:`handoff-recorded` |
| probe-image-channels | `intake` | 0 / 00-setup | — | U:`probe-scope-confirmed` |
| probe-image-channels | `run-probe` | 0 / 00-setup | intake | C:`probe-finished` |
| probe-image-channels | `show-report` | 0 / 00-setup | run-probe | D[`finish`,`configure`], `user_decision_recorded`, U:`report-acknowledged` |
| probe-image-channels | `confirm-write` | 0 / 00-setup | show-report | entry `node_decision:show-report:configure`; D[`write`,`skip`], `user_decision_recorded`, evidence `write-handled` (CLI on write, agent on skip) |

The normalized registry therefore contains nine ordered controllers, one shared node, and forty globally unique nodes. The validator fixture SHALL assert this manifest exactly: file inventory, include relationships, node order/IDs, metadata, dependencies, decision enums, and condition lists. Any intentional future controller change must update the fixture and the governing spec together.

## Risks / Trade-offs

- [Risk] Enabling validation reveals many invalid playbook conditions at once. → Land parser fixtures first, normalize the complete registered set in one change, then make zero validator errors a hard test gate.
- [Risk] Node renames or execution scoping break in-progress decks. → Use versioned, playbook-scoped, idempotent state migration, preserve the active recoverable working set, block rather than guess for ambiguous legacy stack records, and audit `deck_ai_sdlc_keynote` as a real resume fixture.
- [Risk] State heal silently hides invalid data. → Normalize to blocking `pending`, preserve a diagnostic note, and test both healed disk output and API return values.
- [Risk] Same-directory temp files remain after a process crash. → Use a recognizable `.state.yaml.tmp-*` name and clean stale temp siblings opportunistically after a successful read/write; never treat them as state truth.
- [Risk] Capturing child stderr hides live failures. → Continue streaming stdout; retain at most one candidate stderr line; relay the previous line as soon as the next delimiter proves it is not final; cover fragmented/no-newline output.
- [Risk] Documentation command extraction misreads illustrative shell. → Define a deliberately narrow shell grammar and an exact next-example pseudocode marker rather than broad exclusions.
- [Risk] Stage-5 receipt becomes stale after any PPTX mutation. → Hash both the final PPTX and current slide specs; invalidate before retry; write PPTX and receipt through same-directory temporary files; a stale or missing receipt blocks the gate and instructs rerunning Stage 5.
- [Risk] Controller-aware pending lists expose branches that state previously hid. → Report all eligible candidates and auto-suggest only when the next node is unique.
- [Trade-off] Global node IDs require more specific names, but preserve the existing state layout and make resume behavior unambiguous.

## Migration Plan

1. Add regression fixtures for parser, status enum, circular notes gate, delegated envelope duplication, broken links, invalid flags, and stale semantic guidance.
2. Implement the parser/index/validator and state schema migration in non-enforcing test mode, including active-working-set isolation and nested stack snapshots.
3. Normalize every registered playbook: metadata fields, unique IDs, requires, deterministic entries, typed evidence exits/branches, and step syntax.
4. Turn validation into a required test gate and update runtime `checkEntry`/`checkExit` to use the same index.
5. Add transactional Stage-5 PPTX/receipt generation and validation, then declare `jszip` directly.
6. Migrate the explicit eleven-entry executable inventory to the shared envelope wrapper, remove the library-only shebang, and update delegated stderr framing.
7. Correct active docs, CLI examples, links, and `openspec/config.yaml`; enable the full coherence suite.
8. Run layout self-check, all unit/integration tests, direct/delegated CLI probes, OpenSpec strict validation, and a no-source-mutation resume audit on the existing keynote deck.

Rollback is a normal code revert. Run-bundle source and `_generated/` assets are not bulk-migrated. State migration is idempotent and backward reads remain supported for legacy v1 files.

## Acceptance Trace

Every delta requirement has an implementation task and a named proof. Task numbers refer to `tasks.md`.

| Capability / requirement | Tasks | Named proof |
|---|---|---|
| node — Node frontmatter | 1.1, 2.1–2.3, 4.1 | `test_playbook_validation`: exact fenced/frontmatter parsing, duplicate source lines, fail-closed lookup |
| node — Node body step types | 1.1, 2.1–2.2, 4.1 | `test_playbook_validation`: MD/CLI/GATE grammar and numbering fixtures |
| node — Five node statuses | 1.2, 3.2 | `test_state_yaml`: enum rejection, restart cleanup, healed diagnostics |
| node — checkEntry | 1.1, 2.3–2.4 | `test_state_yaml` + `test_playbook_validation`: requires-first, evidence placement, unknown fail-closed |
| node — checkExit | 1.1, 2.3–2.4 | `test_state_yaml`: deterministic/evidence pass and absent-node failure |
| node — Gate Conditions Catalog | 2.2, 4.2, 7.7 | `test_playbook_validation`: zero uncataloged conditions and family placement errors |
| node — Query interface | 2.5, 4.5 | `test_state_yaml` + `test_ppt_flow`: unwritten pending nodes, execution filtering, branch candidates |
| node — Playbook stack | 1.2, 3.4 | `test_state_yaml`: nested shared-node overwrite regression, five-field snapshot round-trip, legacy safe fallback |
| node — Atomic state writes | 3.5 | `test_state_yaml`: same-filesystem rename, crash sibling, EXDEV regression |
| node — Index validation | 1.1, 2.1–2.2, 4.4 | `test_playbook_validation`: all nine controllers plus shared node, cycles/order/reserved IDs |
| node — Typed evidence/decisions | 2.4, 4.2 | `test_state_yaml`: provenance, ISO timestamps, skipped/prior-execution branch rejection, scalar migration |
| node — Versioned state migration | 1.2, 3.1–3.4 | `test_state_yaml` + `test_header_review`: v1→v2 idempotence, aliases, reserved records, ambiguous-stack diagnostic |
| node — Execution isolation | 1.2, 3.4 | `test_state_yaml`: repeated same playbook starts clean; nested resume restores parent working set |
| node — Gate enum enforcement | 1.2, 3.2 | `test_state_yaml`: invalid writes reject and invalid persisted values block |
| playbook — Iteration chains | 1.1, 4.3, 7.4 | `test_ppt_flow` + `test_playbook_validation`: body-lock/full-page title routes and exact 3-slide visual pilot |
| playbook — Registered validation | 2.2, 4.4 | `test_playbook_validation`: registered inventory has zero errors |
| playbook — Lifecycle/module metadata | 1.1, 4.1 | `test_playbook_validation` + `test_docs_consistency`: enum and hierarchy fixtures |
| playbook — Legacy duplicate resume | 1.2, 3.3 | `test_state_yaml`: edit-text/edit-visual alias collision behavior |
| playbook — Resume cards | 2.5, 4.5 | `test_ppt_flow`: complete pending list, unique suggestion, multi-candidate, waiting priority |
| notes — Stage 5 injection | 1.3, 5.2–5.4 | `test_stage5_inject_notes` + `test_unified_pipeline`: counts, empty-note failure, atomic output/receipt |
| notes — Standalone Stage 5 | 5.1, 6.2, 7.2–7.3 | `test_stage5_inject_notes` + `test_docs_consistency`: real flags/help and Expert-mode boundary |
| notes — Current receipt | 1.3, 5.2–5.4 | `test_stage5_inject_notes` + `test_state_yaml`: hash/path/schema/stale/missing/multi-PPTX cases |
| notes — Direct jszip | 5.1 | dependency import/install assertion in `test_stage5_inject_notes` |
| CLI — ppt_flow failure envelope | 1.4, 6.1, 6.3 | `test_cli_error` + `test_ppt_flow`: exactly one final envelope and stable code set |
| CLI — Standalone envelopes/help | 6.1–6.2 | per-script direct probes + `test_cli_error`: help is side-effect free, imports do not exit |
| CLI — Executable inventory | 6.2, 6.4 | `test_runtime_constitution`: explicit eleven-entry registry matches direct guards; libraries excluded |
| CLI — Delegated parent envelope | 1.4, 6.3 | `test_ppt_flow` + `test_cli_error`: fragmented/no-newline/prose/spawn/exit-zero-child cases |
| CLI — Documented flags | 1.5, 7.2–7.3 | `test_docs_consistency`: supported shell grammar, exact pseudocode marker, real help flags |
| charter — Canonical hierarchy | 1.5, 7.1, 7.6–7.7 | `test_docs_consistency`: Lifecycle/Module/Stage/Node and Phase 2.7 agreement |
| charter — Runtime-aligned guidance | 1.5, 7.1, 7.3–7.7 | `test_docs_consistency`: Stage 2, render chains, version semantics, 11 iron laws |
| layout — Cross-references | 1.5, 7.1–7.3, 7.5 | `test_docs_consistency`: full active link/path scan with source-line diagnostics |
| layout — Narrow exceptions | 7.1–7.2, 7.5 | `test_docs_consistency`: broad-exclusion rejection and next-example marker scope |
| commands — Render-aware title intent | 4.3, 7.4, 7.7 | `test_ppt_flow` + `test_docs_consistency`: body-lock, full-page, mixed-scope cases |

The change is ready to implement only when this one-requirement-per-row trace remains complete, OpenSpec strict validation passes, the structural audits in Task 8 pass, and no unresolved design question remains.

## Open Questions

None. The evidence representation, validator exposure, hierarchy vocabulary, delegated-envelope behavior, Stage-5 completion proof, and state migration policy are resolved above.
