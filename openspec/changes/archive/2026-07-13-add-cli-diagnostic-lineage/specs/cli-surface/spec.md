## ADDED Requirements

### Requirement: Every non-zero framework CLI return includes a versioned actionable diagnostic

Every registered direct Node CLI under `PPTMAKER_FRAMEWORK/scripts/` that reaches a non-zero JS-controlled termination path after bootstrap SHALL write exactly one failure envelope as the last non-empty stderr line. Covered paths include normal non-zero return/exit, caught or uncaught runtime errors, rejected promises, dependency module-evaluation errors after bootstrap, and handled `SIGINT`/`SIGTERM`. Uncatchable termination such as ESM syntax/resolution/link failure before any module evaluates, `SIGKILL`, runtime/native abort or native fd output before handlers run, host power loss, or output-device failure is outside the emission guarantee. Existing required top-level fields (`ok:false`, `code`, `message`, `hint`, `where`) and the closed top-level code set SHALL remain unchanged. Repository CLIs migrated by this change SHALL additionally include `diagnostic.version: 1`, a bounded `category`, and `diagnostic.next` containing `action`, `requires_human`, and `default`. Parsers SHALL continue to accept legacy envelopes without `diagnostic`.

Each registered executable SHALL place the shared zero-dependency CLI bootstrap as its first static import using a literal entry query (for example `./lib/cli_bootstrap.mjs?entry=ppt_flow.mjs`). During its own module evaluation the bootstrap SHALL read that token from `import.meta.url`, compare the normalized basename of `process.argv[1]` with the exact inventory token (normalizing path separators but not using suffix matching), and install the output/error/signal guard before later dependencies evaluate only for the matching direct entry; library/dependency imports SHALL remain inert. Tests SHALL verify first-import/token equality for every inventory entry, absolute/repo-relative/cross-separator matching, misleading-suffix rejection, inert library import, and a post-bootstrap dependency-evaluation failure. No requirement SHALL claim an envelope for pre-evaluation ESM link failures.

Repository JS SHALL NOT bypass the transaction/collector with direct fd 1/2 writes, `/dev/stdout`/`/dev/stderr`, or inherited child output descriptors. Static tests SHALL scan for these patterns and permit only the shared bootstrap's synchronous final commit/progress renderer to write already-sanitized bytes through saved original descriptors; no CLI call site may do so. A third-party native path that writes directly to process descriptors SHALL be isolated behind a captured subprocess before it is treated as conformant; pre-control native output remains outside the guarantee.

The shared direct-entry guard SHALL transactionally capture stdout and stderr independently up to 1 MiB from installation until JS-controlled termination while continuing to drain overflow. Query bootstrap instances and ordinary helper imports SHALL share one `Symbol.for` process-global record containing pending envelope/report, human/json mode, active child, buffers/overflow, and commit state. Wrapped stream writers SHALL preserve supported Node write overloads, callbacks, and boolean return behavior, and originals SHALL be restored exactly once before replay/commit. `emitCliError` SHALL register/replace the pending authoritative envelope inside the transaction rather than bypass it; generic fallback SHALL register only when none exists. On exit zero the guard SHALL replay captured output unchanged. On non-zero it SHALL discard ordinary captured prose/child envelopes and synchronously release only: (a) one explicitly registered, schema-validated, secret-safe JSON stdout failure report for a documented report mode, when applicable; (b) a bounded human stderr rendering derived solely from the sanitized final envelope; and (c) the one final stderr envelope. Incidental parseable JSON SHALL NOT qualify. Commit SHALL be re-entrancy guarded across explicit exit, signal, uncaught/rejection, and exit-hook paths. Direct capture overflow SHALL fail closed with bounded `internal`/truncation evidence rather than replay partial output or report success.

Documented JSON commands SHALL call `setCliOutputMode("json")` immediately after parsing that mode and before output/progress. JSON report registration SHALL be rejected outside registered JSON mode. Human mode SHALL be the default.

The human rendering SHALL be a deterministic non-authoritative view containing at most code/message, `where`, retained sanitized issues as compact message + source/subject lines (up to the 20-issue wire cap), omitted-issue count, `next.default`, the first inspect locator, and a display-quoted safe invocation. It SHALL omit absent fields, SHALL NOT regenerate lineage or arbitrary prose, and SHALL use only the already-sanitized envelope. Its complete rendering SHALL be bounded to 20 KiB by dropping trailing rendered issue lines before control guidance. The JSON envelope remains the machine authority and last non-empty stderr line.

#### Scenario: Aggregate failure remains readable to a human

- **WHEN** a sanitized aggregate diagnostic retains multiple issues and omits others
- **THEN** the human view lists retained issue message/location summaries within its bound
- **AND** states the omitted issue count before showing the next action

Long-running human-mode CLIs MAY stream live informational output only through shared `emitCliProgress(event, fields)`. Each event SHALL have a registered fixed template and allowlisted bounded fields limited to safe counts, ids, stages, statuses, credential-free paths, and sanitized hosts. The API SHALL reject free-form messages and exception/provider/prompt/environment/child text. For direct execution, bootstrap SHALL render the fixed template. For a framework-collected child identified by a private parent-set environment flag, the API SHALL write a reserved single-line JSON progress frame to child stderr; the parent SHALL schema-validate known event/fields and locally render it, while suppressing unknown/malformed frames. The frame SHALL omit `ok:false`, SHALL NOT be parsed as an envelope, and SHALL NOT be exposed raw. Progress SHALL NOT be control authority. JSON modes SHALL suppress progress. Ordinary `console.*` output remains inside the transaction.

#### Scenario: Long-running safe progress remains visible

- **WHEN** Stage 2 or a pipeline stage emits a registered progress event in human mode
- **THEN** the fixed safe rendering is visible before process completion
- **AND** the same event is suppressed in JSON mode

#### Scenario: Delegated progress crosses the parent boundary safely

- **WHEN** a registered Stage child emits a valid reserved progress frame
- **THEN** the parent consumes the raw frame and locally renders its registered event
- **AND** malformed, unknown, or prose lookalikes are not relayed

#### Scenario: Progress call attempts to carry unsafe text

- **WHEN** a progress field contains an unregistered key or unsafe free-form/provider/prompt value
- **THEN** the API does not release that value
- **AND** the output transaction remains authoritative for subsequent failure

When JS knows structured context, the diagnostic SHALL include the applicable subject, editable source locator, stage/operation, reason, ordered lineage, delegated boundary, or bounded issues. Unknown facts SHALL be omitted rather than inferred. Invalid optional diagnostic input SHALL be dropped or bounded and SHALL NOT prevent emission of the valid minimal envelope. If JS can deterministically heal a format/schema defect, it SHALL heal and continue before returning failure.

#### Scenario: Deterministic usage failure has a minimal diagnostic

- **WHEN** a registered CLI rejects missing, conflicting, or invalid arguments
- **THEN** it exits non-zero with one final envelope
- **AND** the envelope includes a v1 diagnostic with category `usage`
- **AND** `diagnostic.next` tells MD how to correct or inspect usage without fabricating source lineage

#### Scenario: Contextual Stage failure reports known lineage

- **WHEN** a Stage CLI fails while it knows the slide or artifact, source path, and pipeline stage
- **THEN** those facts are represented in the v1 diagnostic
- **AND** lineage is ordered from editable source toward the observed derived artifact when known
- **AND** the next action identifies source inspection or a prerequisite/rerun invocation instead of instructing edits to `_generated/`

#### Scenario: Aggregate validation reports bounded issues

- **WHEN** a validator finds multiple source or artifact failures in one invocation
- **THEN** it emits one final envelope
- **AND** uses bounded `diagnostic.issues` for per-item facts
- **AND** reports `omitted_count` or `truncated` when the complete issue set exceeds the wire bounds

#### Scenario: Direct CLI writes unsafe prose before failing

- **WHEN** a registered direct CLI writes stdout/stderr prose containing a sentinel and later exits non-zero
- **THEN** the transaction does not release that prose
- **AND** stderr contains only the deterministic safe human view followed by the final envelope

#### Scenario: Direct CLI succeeds within the transaction bound

- **WHEN** a help, prose-success, or documented JSON-success invocation exits zero within both capture bounds
- **THEN** its stdout/stderr bytes are replayed unchanged and no failure envelope is added

#### Scenario: Direct output transaction overflows

- **WHEN** either captured stream exceeds 1 MiB before termination
- **THEN** the CLI drains remaining writes but fails closed with explicit bounded truncation/internal evidence
- **AND** does not expose a partial success or raw overflow content

#### Scenario: Human-owned decision is explicit

- **WHEN** execution is blocked on visual review, content approval, or risk acceptance
- **THEN** `diagnostic.next.requires_human` is `true`
- **AND** the default or invocation does not imply permission for MD to fabricate approval

#### Scenario: Catchable interruption is not reported as a defect

- **WHEN** a registered CLI receives handled `SIGINT` or `SIGTERM`
- **THEN** it forwards termination to an active child when applicable and emits exactly one final v1 envelope
- **AND** category is `interrupted` with a safe rerun action rather than `internal`

#### Scenario: Process dies before JS can return

- **WHEN** a CLI has a pre-evaluation ESM link failure, is terminated by `SIGKILL`, or runtime/native code aborts before handlers can execute
- **THEN** no envelope is promised
- **AND** a consumer treats missing final envelope as an external interruption/crash, not a valid diagnostic

### Requirement: Diagnostic v1 is bounded, allowlisted, and shell-independent

The v1 formatter SHALL accept only these diagnostic fields and leaf shapes:

- `version`: integer `1`.
- `category`: one closed value defined below.
- `stage`, `operation`: optional tokens matching `^[a-z][a-z0-9_-]{0,63}$`.
- `subject`: optional `{kind,id?,field?}`; kind uses the token grammar and id/field are trusted bounded domain labels.
- `source`: optional editable-source `{path,line?,column?}`; positions are positive safe integers.
- `reason`: optional `{kind,actual?,expected?}`; kind uses the token grammar and actual/expected are trusted bounded JSON scalars or arrays of at most 16 scalars, never arbitrary exception/prose/provider/environment values.
- `lineage`: optional ordered array of `{kind,path,stage?}` from source toward observation; kind/stage use the token grammar.
- `issues`: optional array of non-recursive `{message?,subject?,source?,reason?,lineage?}` leaves; issue message is trusted domain text, and a leaf cannot contain diagnostic/issues/next/delegated.
- `delegated`: optional `{invocation?,child_code?,child_where?}`; child code uses the closed top-level code set and child where is a trusted bounded code location.
- `next`: required shape defined below.
- `omitted_count`: optional non-negative safe integer counting only omitted top-level issues; absent when none are omitted. `truncated`: optional boolean that is true whenever any bounded value/entry or total-size content was reduced.

Unknown keys/values SHALL be dropped. Strings, arrays, source positions, issue/lineage counts, invocation arguments, and total serialized size SHALL be bounded with explicit truncation. Required `version/category/next` SHALL be retained first, followed by top-level context/delegation, complete issue leaves in input order, and top-level lineage. Per-field caps apply before the total cap; remaining overflow SHALL drop trailing complete issues (updating `omitted_count`), then trailing lineage/inspect entries, then optional actual/expected/delegated invocation data. A partial issue SHALL NOT be emitted, required next/default SHALL NOT be dropped, and any reduction SHALL set `truncated:true`. If `version`, `category`, or a required `next` field is absent or invalid, formatting SHALL replace the nested object with a valid minimal `internal` / `report_internal` diagnostic rather than emit a partial object or fail.

Category semantics SHALL be:

| Category | Producer meaning |
|---|---|
| `usage` | Invocation arguments/options are invalid or incomplete. |
| `source_validation` | Editable source violates a content/schema rule. |
| `structure` | Run-bundle/path layout violates canonical ontology. |
| `artifact` | A derived prerequisite/output is missing, stale, ambiguous, or invalid. |
| `gate` | Review, approval, or policy state blocks progress. |
| `environment` | Local config, credentials, dependency, runtime, font, or filesystem capability blocks execution. |
| `provider` | A remote service/request fails after local prerequisites are valid. |
| `delegated` | A child failed but no trusted more-specific category survived wrapping. |
| `interrupted` | A catchable signal/cancellation stopped execution. |
| `internal` | A framework invariant, unexpected exception, or diagnostic-construction defect occurred. |

`diagnostic.next` SHALL have shape `{action, requires_human, inspect?, invocation?, default}`. `requires_human` is boolean. `inspect`, when present, SHALL be a bounded array of `{path,line?,column?}` read locators and SHALL NOT itself authorize editing. `default` SHALL be a bounded imperative explanation, not executable text. Action semantics SHALL be:

| Action | Consumer direction |
|---|---|
| `fix_arguments` | Correct invocation arguments/options. |
| `inspect` | Read named evidence; no edit permission is implied. |
| `edit_source` | Change the named editable source. |
| `repair_environment` | Fix local configuration/dependencies/capability. |
| `repair_prerequisite` | Restore or rerun an upstream requirement. |
| `rerun` | Repeat the preferred operation without implying another repair. |
| `review` | Ask a human to assess named evidence. |
| `approve` | Record a human-owned approval. |
| `report_internal` | Inspect/report a framework defect. |

`review` and `approve` SHALL require `requires_human:true`; other actions MAY also require a human when outside MD authority. A preferred invocation SHALL be `{program,args}` with a non-empty program and bounded string args assembled only from known credential-free values. It SHALL be omitted when any argument may contain a credential, prompt/body content, or other secret, and SHALL NOT be free-form shell text. A machine consumer SHALL execute it without a shell (`spawn`/`execFile`, `shell:false`); human rendering SHALL preserve argument boundaries with platform-appropriate quoting. `diagnostic.delegated.invocation` SHALL use the same shape and safety rule. An approval invocation SHALL NOT authorize automatic execution.

#### Scenario: Recovery path contains spaces and metacharacters

- **WHEN** a known recovery invocation targets a run directory whose path contains spaces or shell metacharacters
- **THEN** `program` and each argument remain separate JSON values
- **AND** executing the invocation does not interpolate the path as shell syntax

#### Scenario: Oversized diagnostic is safely reduced

- **WHEN** a failure contains more issues, lineage entries, arguments, or text than v1 permits
- **THEN** the CLI still emits a valid minimal envelope
- **AND** retained diagnostic data stays within configured bounds
- **AND** `truncated` and/or `omitted_count` reveals that evidence was reduced

### Requirement: The complete failure channel is secret-safe

Secret safety SHALL cover the entire externally visible failure channel, not only the nested diagnostic: top-level envelope fields, deterministic human rendering, registered progress, direct output transactions, registered JSON failure reports, captured child output, and provider error summaries. New envelopes SHALL NOT emit stacks; parsers MAY tolerate and discard legacy stack fields. Top-level `message`/`hint` SHALL be bounded trusted templates populated only with allowlisted metadata, and `where` SHALL be a bounded code-location token; generic fallback SHALL NOT quote captured stderr, arbitrary `Error.message`, or a rejected value. Raw `.env` content, API keys/tokens, authorization headers, prompt bodies, image bytes, raw provider request/response bodies, stacks, and unbounded child output SHALL NOT be copied into output.

Provider and child-process boundaries SHALL normalize unsafe failures into allowlisted metadata before formatting. Bounded fields such as `reason.actual`, `reason.expected`, and `next.default` SHALL NOT receive arbitrary exception messages, provider/environment values, prompts, or child output merely because those values fit their size limits. Tests SHALL inject distinct sentinels through credentials, environment text, prompt content, provider body, thrown stack, child stdout, child stderr, and those bounded field inputs, then assert absence from the complete captured output.

Exact v1 bounds SHALL be 1024 characters for top-level `message`/`hint` and each ordinary diagnostic string, 256 characters for `where`, 2048 characters for paths and invocation arguments, 20 issues, 12 lineage entries per issue/diagnostic, 16 inspect locators, 32 invocation args, 16 KiB of UTF-8 serialized diagnostic data, 20 KiB of UTF-8 data for the complete final envelope, and 20 KiB for the preceding deterministic human rendering.

#### Scenario: Provider failure does not expose payloads

- **WHEN** an image request fails after credentials and prompt content have been loaded
- **THEN** output MAY name stage, provider host/role, HTTP status, safe reason code, slide id, and artifact paths
- **AND** stdout/stderr do not contain credential, raw environment, prompt, provider-body, or stack sentinels

#### Scenario: Prose-only child contains sensitive text

- **WHEN** a delegated legacy child exits non-zero and its final prose contains a secret sentinel
- **THEN** the parent does not copy that raw prose into its envelope or fallback output
- **AND** emits a bounded delegated diagnostic using safe command/exit metadata

#### Scenario: Generic fallback receives a sensitive thrown message

- **WHEN** a CLI reaches its generic guard with a thrown/rejected value containing a secret sentinel
- **THEN** the final envelope uses a fixed safe summary and `internal` diagnostic
- **AND** its next step points MD to the known executable/code location and `report_internal`
- **AND** no top-level or nested field contains the thrown/rejected text

### Requirement: Direct-entry and return audits cover the observable CLI surface

`EXECUTABLE_INVENTORY` SHALL remain the explicit public direct-CLI registry. Tests SHALL recursively scan `PPTMAKER_FRAMEWORK/scripts/**/*.mjs` for direct-entry indicators, including a main guard based on `process.argv[1]`/`import.meta.url`, direct Commander parsing, or standalone-envelope installation. The detected candidate set SHALL exactly equal the executable inventory. A narrow exception SHALL name one path and reason; a complete module-only inventory SHALL NOT be required.

Every registered executable SHALL have an audit record for each applicable return category: help, deterministic usage failure, contextual hard failure, delegated hard failure, catchable interruption, prose success, and documented JSON success. An unsupported category SHALL have an explicit not-applicable reason. Non-zero probes SHALL verify one final v1 envelope; successful help/prose SHALL verify exit zero and no failure envelope; successful JSON SHALL verify exactly one parseable stdout value and no failure envelope. Fixtures SHALL be deterministic, temporary, and network-free.

#### Scenario: New direct-entry script is not registered

- **WHEN** a new `.mjs` gains a direct-entry main guard or direct CLI parser
- **AND** it is absent from `EXECUTABLE_INVENTORY`
- **THEN** the audit fails and names the candidate path

#### Scenario: Helper module is not maintenance noise

- **WHEN** a library-only `.mjs` has no direct-entry indicators
- **THEN** it does not need a module-only registry entry
- **AND** it is not required to implement CLI return probes

#### Scenario: Registered JSON-mode failure keeps both channels valid

- **WHEN** a documented JSON command explicitly registers and emits its schema-valid secret-safe failure report before exiting non-zero
- **THEN** stdout remains parseable according to that report contract
- **AND** stderr ends with exactly one v1 failure envelope

#### Scenario: Incidental JSON is not released as a failure report

- **WHEN** a failing command writes parseable JSON without using a documented safe-report registration path
- **THEN** the direct transaction discards it with other untrusted failure output
- **AND** only the final envelope is externally visible

### Requirement: The CLI producer contract is discoverable during repository maintenance

Repository-root `AGENTS.md` SHALL route any Coding Agent that adds or changes a direct CLI, command, exit path, stdout JSON path, stderr diagnostic, delegated process boundary, or `cli_error.mjs` to `openspec/specs/cli-surface/spec.md`, active `cli-surface` deltas discovered through `openspec status`, and the shared helper. `PPTMAKER_FRAMEWORK/scripts/README.md` and the `cli_error.mjs` module header SHALL contain short pointers to the canonical main capability without duplicating schema details.

The main `openspec/specs/cli-surface/spec.md` Purpose SHALL be updated during implementation to describe all registered direct framework CLIs while retaining `ppt_flow`'s fixed 12-command surface. This update SHALL occur explicitly because delta requirement synchronization does not rewrite an existing Purpose section. Tests SHALL enforce the root route, code-adjacent pointers, and global Purpose.

#### Scenario: Coding Agent begins a CLI-sensitive change

- **WHEN** the Agent follows repository-root maintenance instructions
- **THEN** it is routed to the main `cli-surface` capability and active deltas before editing
- **AND** that capability alone contains the complete producer obligations

#### Scenario: Main capability has been synchronized

- **WHEN** implementation is complete and main specs are inspected
- **THEN** the `cli-surface` Purpose describes the global direct-CLI producer contract
- **AND** it still identifies `ppt_flow` as the 12-command unified entry point

### Requirement: ppt_flow preserves actionable diagnostics across command boundaries

Every `ppt_flow.mjs` command that exits non-zero under JS control SHALL emit exactly one final failure envelope with v1 diagnostic. Parent `code`, `message`, `hint`, `where`, and `next` remain authoritative. Parent summaries and next action SHALL be constructed from the known operation and allowlisted structured evidence, never copied from child top-level `message`/`hint`, child `next`, or prose. Only a supported v1 diagnostic from a registered framework child is eligible as evidence, and the parent SHALL sanitize it again before preserving safe child subject/source/reason/lineage/issues. A legacy envelope, unsupported/malformed diagnostic, or unregistered child SHALL use the minimal delegated fallback. The parent SHALL add flat delegated metadata and SHALL NOT relay or recursively nest the complete child envelope.

For a legacy or prose-only child, `ppt_flow` SHALL emit a safe minimal delegated diagnostic using known credential-free invocation/exit metadata. Every CLI-owned asynchronous or synchronous subprocess SHALL pipe/capture both output streams; no `stdio:inherit` child path may bypass the transaction. This includes the unregistered npm child used by `ppt_flow test`. Framework-child spawns SHALL set the private delegated-progress flag. The parent SHALL capture each child stream independently up to 1 MiB while continuing to drain overflow, instead of streaming prose before exit status is known; only validated registered progress frames may be locally rendered live. On child success it SHALL replay remaining non-frame output according to the existing success contract. On child failure it SHALL discard non-envelope prose from both streams, SHALL NOT infer slide/source facts from or quote that prose, and SHALL expose only the parent envelope. Capture overflow SHALL produce an explicit truncated delegated failure rather than leak output or present partial success. All registered children remain subject to the same full-channel safety contract as defense in depth.

#### Scenario: Synchronous unregistered child fails with prose

- **WHEN** `ppt_flow test` invokes npm synchronously and npm exits non-zero with stdout/stderr prose
- **THEN** no inherited child descriptor bypasses capture and no npm prose is released
- **AND** the parent emits one minimal delegated diagnostic naming only safe invocation/exit metadata

#### Scenario: Delegated Stage failure keeps causal evidence

- **WHEN** a child Stage exits with a v1 diagnostic naming source and slide lineage
- **THEN** the parent emits exactly one final envelope
- **AND** parent control fields and next action remain authoritative
- **AND** safe child causal evidence remains available with delegated child code/location

#### Scenario: Parent action overrides generic child recovery

- **WHEN** a child suggests a direct rerun but `ppt_flow` knows pilot review is required
- **THEN** parent `diagnostic.next` provides the pilot/review workflow
- **AND** child source/reason/lineage remain intact

### Requirement: The complete ppt_flow command surface has return-audit coverage

The command-return registry SHALL cover exactly the 12 commands registered by `ppt_flow.mjs`: `doctor`, `init`, `status`, `approve`, `style-master`, `validate`, `pilot`, `build`, `refresh`, `new-version`, `test`, and `state`. Each command SHALL register every applicable return category or an explicit not-applicable reason. A new, removed, or renamed command SHALL fail the set comparison.

#### Scenario: Registered and audited commands differ

- **WHEN** commands registered before `parseAsync` are compared with the audit registry
- **THEN** the test fails on every missing or stale command name

#### Scenario: Contextual gate failure guides MD

- **WHEN** a command is blocked by a known gate or review condition
- **THEN** the diagnostic identifies the gate/affected ids when known
- **AND** `next.action` and `next.requires_human` distinguish rerun from human decision
- **AND** `next.invocation` supplies the preferred argument-safe `ppt_flow` invocation when known

#### Scenario: Successful status and state JSON remain clean

- **WHEN** `status --json` or `state --json` exits zero
- **THEN** stdout contains exactly one parseable JSON value without prose wrappers
- **AND** stderr does not end with an `ok:false` envelope
