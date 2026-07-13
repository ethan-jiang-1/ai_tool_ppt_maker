## Context

The framework already guarantees a final-line JSON failure envelope, but the current implementation is primarily a detection layer:

- `lib/cli_error.mjs` validates the six stable error codes and the required top-level fields, then adds a generic fallback envelope on non-zero standalone exit.
- Eleven top-level scripts are registered as directly executable; `image_api_client.mjs` and `visual_config.mjs` are top-level module-only files.
- `ppt_flow.mjs` suppresses a compliant child's final envelope so only one remains visible, but currently retains only child `message` and `hint` at the parent boundary.
- Several stages already possess richer facts before failure: Stage 1 has markdown blocks and fields, Stage 2 has slide ids and prompt/image paths, Stage 3/4 have slide-image mappings, Stage 5 has source/PPTX/receipt inputs, and gate code has changed ids plus runnable actions.
- Some failures are aggregate by nature. Stage 1 reports multiple validation problems, Stage 2 can fail several selected slides, and Stage 4 can find several missing or ambiguous images.
- Documented successful machine output currently exists for `env-check --json`, `ppt_flow status --json`, and `ppt_flow state --json`.
- The existing `cli-surface` capability is narrowly described around `ppt_flow`, while the framework-wide failure rule lives in charter prose. A Coding Agent editing a Stage CLI is likely to inspect `cli-surface`, `scripts/README.md`, and `lib/cli_error.mjs`, but may never route through `framework-charter` or `node-specification`.
- A real run bundle such as `deck_ai_sdlc_keynote` is produced by `bundle_layout.mjs#initBundle`. The producer currently seeds `CLAUDE.md` plus `deck-guide.md`, but no root `AGENTS.md`; agent-agnostic runtime discovery must therefore be fixed in the scaffold producer, not by hand-editing one generated deck.

The consumer is not only a person reading stderr. MD Controllers and agents need trustworthy evidence to decide whether to edit source, rerun a command, ask for human review, fix the environment, or report an internal defect. The design therefore treats a failure envelope as a control message, while keeping the old envelope parseable.

## Goals / Non-Goals

**Goals:**

- Make every JS-controlled non-zero registered CLI return actionable without changing the required top-level envelope fields.
- Preserve facts JS knows at the point of failure: subject, editable source, reason, stage, ordered lineage, and preferred next action.
- Represent aggregate failures without collapsing them into one prose blob.
- Preserve diagnostics through delegated process boundaries while exposing exactly one final envelope.
- Make CLI coverage exhaustive by construction for all direct-entry scripts and all `ppt_flow` commands without maintaining a list of every library helper.
- Keep successful JSON stdout parseable and failure output bounded, deterministic, and secret-safe.
- Make the authoritative producer contract discoverable from repository-maintenance entry points and shared CLI code, and make the MD consumer behavior discoverable from generated run-bundle entry files.

**Non-Goals:**

- Do not add commands, change the 12-command `ppt_flow` surface, or expand the closed top-level error-code set.
- Do not require a source line or slide id when the parser genuinely does not know it; unknown evidence is omitted, never inferred from ambiguous prose.
- Do not add diagnostics to successful payloads solely for symmetry.
- Do not expose prompt bodies, provider response bodies, environment contents, credentials, or stack-sized data as lineage.
- Do not retrofit an existing run bundle by hand; change `initBundle` and verify a fresh temporary scaffold. Legacy bundles without generated `AGENTS.md` remain valid.
- Do not change the existing deck-root/version README placement-map seeds in this change. Their separate golden-sample requirement is already satisfied and does not authorize adding the new controls to an existing deck.
- Do not refactor every programmatic Stage API into a CLI API. Structured context is carried to, and emitted at, the direct CLI boundary.
- Do not ask MD or users to repair deterministic syntax that JS can safely heal, or to hand-edit `_generated/` artifacts.

## Decisions

### 1. Use one unambiguous process-return contract

For every registered direct CLI process after its shared bootstrap has installed the guard, a JS-controlled termination path (normal return, `process.exit`/`exitCode`, caught or uncaught runtime error, rejected promise, or handled `SIGINT`/`SIGTERM`) follows this contract:

| Exit / mode | stdout | stderr final line |
|---|---|---|
| `0`, help or prose success | human output allowed | not a failure envelope |
| `0`, `--json` success | exactly one parseable JSON value, no prose wrapper | not a failure envelope |
| non-zero, prose mode | deterministic human rendering from the sanitized envelope | exactly one failure envelope |
| non-zero, documented JSON-report mode | one schema-validated, secret-safe JSON report may coexist | exactly one failure envelope |

This keeps exit status as the control signal and removes a consumer-side ambiguity about whether a non-zero readiness/check result should be ignored. A registered structured stdout report is evidence; it does not replace the final stderr control message. The shared direct-entry guard owns a bounded output transaction from installation until termination: it captures stdout/stderr before release, replays them unchanged on success, and on failure discards ordinary prose and any child envelope. It then writes a deterministic bounded human rendering derived only from the final sanitized envelope, followed by the one authoritative JSON envelope as the last non-empty stderr line. Query bootstrap instances and ordinary `cli_error.mjs` imports share one process-global transaction record keyed by `Symbol.for`, including pending envelope/report, output mode, active child, buffers, overflow, and commit state. `emitCliError` registers/replaces the pending authoritative envelope in that record rather than immediately bypassing it; the generic guard creates one only if none was registered. A documented JSON failure report is released only through an explicit safe-report API/schema; incidental parseable JSON is not enough. Final commit is synchronous and re-entrancy guarded so `process.exit`, signal handling, uncaught error handling, and the exit hook cannot each publish another envelope.

The wrapped stream writers preserve Node's accepted overloads, callback completion, and boolean return contract while buffering, and restore originals exactly once before final replay/commit. CLI parsers call `setCliOutputMode("json")` immediately after recognizing a documented JSON mode and before command output/progress; default is human. The safe-report registration API is valid only in registered JSON mode.

The human renderer is a view, not another authority. It emits at most: code + message, `where`, each retained sanitized issue as a compact message + source/subject line (up to the same 20-issue wire cap), an omitted-issue count, `next.default`, the first `next.inspect` locator, and a display-quoted `next.invocation`. Missing fields are omitted; lineage and arbitrary prose are not regenerated. It uses only already-sanitized fields, never raw errors, stays within the 20 KiB final rendering budget by dropping trailing rendered issue lines before control guidance, and the final JSON remains the machine authority.

Long-running CLIs retain useful live visibility through `emitCliProgress(event, fields)`, a shared controlled API that validates a registered event id and allowlisted bounded fields (counts, ids, stages, statuses, credential-free paths/hosts). It cannot accept a free-form message or exception/provider/prompt/env/child text. For direct human execution, the bootstrap renders the fixed template through its saved descriptor; JSON modes suppress progress so stdout stays machine-clean. For a child spawned by a framework collector, the parent marks the child with a private environment flag and the same API writes a reserved single-line JSON progress frame to child stderr. The parent consumes, schema-validates, and locally renders known frames in arrival order; unknown/malformed frames remain untrusted capture and are never relayed. The reserved frame is not a failure envelope (`ok:false` is absent) and never survives as raw external output. Progress is informational and never authority. Existing meaningful progress in Stage 2/provider polling and pipeline stages migrates to registered events; ordinary `console.*` remains transactional.

Direct transactions use the same 1 MiB-per-stream capture target as delegated children and continue draining after overflow. Overflow cannot preserve the old output contract safely, so it becomes an explicit bounded `internal` failure with truncation metadata. This is intentionally fail-closed and is covered by tests; deterministic probes establish that normal help, success, and documented reports remain below the bound.

Repository JS SHALL write observable CLI output only through `console`, `process.stdout/stderr`, registered progress/report APIs, or the delegated collector. Direct writes to fd 1/2 (`fs.writeSync`, `/dev/stdout`, `/dev/stderr`) and inherited child output descriptors are forbidden and caught by static tests, with one narrow exception: the shared bootstrap's re-entrancy-guarded final commit/progress renderer may synchronously write already-sanitized bytes through saved original descriptors so `process.exit` cannot drop or recapture them. No call-site exception is allowed. A third-party native addon can bypass patched JS streams by writing directly to the process descriptors; any addon/path observed to do so must be isolated behind a captured subprocess before this contract can cover it. Native output that occurs before JS control is in the same explicit no-envelope boundary as a runtime abort, not silently claimed as protected.

Each direct executable places a zero-dependency shared CLI bootstrap as its first static import, with a literal entry query such as `import "./lib/cli_bootstrap.mjs?entry=ppt_flow.mjs"`. The bootstrap reads the `entry` token from its own `import.meta.url`, compares the basename of normalized `process.argv[1]` with the exact inventory token (normalizing `\\`/`/` only, not suffix matching), installs the output transaction/error/signal guard during its own module evaluation only on a match, and is inert when the implementation is imported as a library or another executable's dependency. The query gives the shared module caller identity without 11 wrapper modules; tests cover absolute paths, repo-relative invocation, path separators, and misleading suffixes. This catches later dependency module-evaluation errors without duplicating bootstrap logic. ESM syntax/resolution/link failures happen before any module can evaluate, so they remain uncatchable in-process.

Uncatchable termination such as ESM syntax/link failure before bootstrap evaluation, `SIGKILL`, runtime/native abort or direct native output before JS handlers can run, host power loss, or output-device failure cannot emit a process-return envelope and is outside this guarantee. Consumers treat “non-zero/no valid final envelope” as an externally interrupted or crashed producer, not as a valid diagnostic. The shared direct-entry guard handles catchable `SIGINT`/`SIGTERM` once, emits category `interrupted` with a safe rerun action, forwards termination to an active child when applicable, and exits using the conventional signal status without emitting twice.

Alternative considered: exempt expected negative checks from the failure envelope. Rejected because the current standalone guard, `ppt_flow` wrappers, and MD protocol all treat non-zero as failure, and an exception would require every consumer to know command-specific exit semantics.

### 2. Keep the wire extension backward compatible, but require it from migrated CLIs

`diagnostic` is optional to the parser so legacy envelopes and older delegated children remain readable. After this change, every executable in the repository inventory that terminates non-zero under JS control must emit `diagnostic`; generic guard paths create a minimal diagnostic when no richer context reached the boundary.

The required top-level fields and closed `code` set remain unchanged. Their values are now bounded and constructed under the same trust policy: `message` and `hint` are trusted templates with allowlisted metadata, and `where` is a bounded code-location token, never copied arbitrary stderr or exception text. Fine-grained routing belongs in `diagnostic.category` and `diagnostic.reason.kind`, not in new top-level codes.

Alternative considered: make `diagnostic` top-level mandatory for parsing. Rejected because that would break legacy child envelopes and external consumers during rollout.

### 3. Define a versioned, allowlisted diagnostic schema

The v1 shape is:

```json
{
  "ok": false,
  "code": "FAILED",
  "message": "2 slide specification errors block Stage 1",
  "hint": "Edit the named source fields, then rerun validation.",
  "where": "stage1_build_inputs#validateSpecs",
  "diagnostic": {
    "version": 1,
    "category": "source_validation",
    "stage": "stage1",
    "operation": "validate-specs",
    "issues": [
      {
        "message": "invalid RENDER MODE",
        "subject": { "kind": "slide", "id": "s03", "field": "RENDER MODE" },
        "source": { "path": "deck_x/3_versions/v1/slide-specifications.md", "line": 128 },
        "reason": {
          "kind": "invalid_enum",
          "actual": "image_direct",
          "expected": ["full-page", "body+header-lock"]
        },
        "lineage": [
          { "kind": "source", "path": "deck_x/3_versions/v1/slide-specifications.md", "stage": "input" },
          { "kind": "derived", "path": "deck_x/3_versions/v1/_generated/slide_plan.json", "stage": "stage1" }
        ]
      }
    ],
    "next": {
      "action": "edit_source",
      "requires_human": false,
      "inspect": [
        { "path": "deck_x/3_versions/v1/slide-specifications.md", "line": 128 }
      ],
      "invocation": {
        "program": "node",
        "args": [
          "PPTMAKER_FRAMEWORK/scripts/ppt_flow.mjs",
          "validate",
          "deck_x/3_versions/v1"
        ]
      },
      "default": "Fix the named source field; do not edit _generated/ artifacts."
    }
  }
}
```

Allowed top-level diagnostic fields are:

- `version`: integer `1`, required whenever `diagnostic` exists.
- `category`: one of the closed v1 values `usage`, `source_validation`, `structure`, `artifact`, `gate`, `environment`, `provider`, `delegated`, `interrupted`, or `internal`.
- `stage` and `operation`: bounded ASCII tokens matching `^[a-z][a-z0-9_-]{0,63}$` that locate the pipeline or CLI operation; stage is documented but not a closed enum so new maintenance commands do not require a wire-version change.
- `subject`: one primary `{kind,id?,field?}` object when there is a single subject; `kind` uses the same token grammar, while id/field are bounded trusted domain labels.
- `source`: one primary editable-source locator `{path,line?,column?}`.
- `reason`: `{kind,actual?,expected?}` where `kind` uses the token grammar and values are bounded JSON scalars or short scalar arrays. `actual` and `expected` are allowlisted domain values, never arbitrary exception messages, provider payload fragments, environment values, prompts, or child output; call sites omit them when provenance is not demonstrably safe.
- `lineage`: an ordered source-to-observation array of `{kind,path,stage?}` entries; kind/stage use the token grammar.
- `issues`: a bounded array of leaf issue objects. Each may contain a trusted-template `message`, `subject`, `source`, `reason`, and `lineage`, but cannot recursively contain `issues`, `next`, `delegated`, or another diagnostic.
- `delegated`: bounded `{invocation,child_code?,child_where?}` metadata for a child-process boundary; invocation uses the same `{program,args}` shape and is omitted if any argument is credential-bearing or cannot be proven safe.
- `next`: `{action,requires_human,inspect?,invocation?,default}`. `action` is one of the closed v1 values `fix_arguments`, `inspect`, `edit_source`, `repair_environment`, `repair_prerequisite`, `rerun`, `review`, `approve`, or `report_internal`. `inspect` is a bounded array of `{path,line?,column?}` locators; it names files to read, not files automatically authorized for editing. `default` is a short imperative fallback explanation for MD/humans; it is not executable text and never interpolates raw exception/provider/environment/child content. `invocation` is one preferred `{program,args}` pair assembled only from known program paths, command/option literals, ids, and local paths; it is omitted rather than redacted when any argument may contain credentials, prompt/body content, or another secret. `args` preserves argument boundaries; consumers execute it without a shell and render it for humans using platform-appropriate quoting. It is not a free-form shell command or an array of competing recovery paths. `action:approve` always implies `requires_human:true`; an attached invocation is display-only until the human decision exists.
- `omitted_count`: count of top-level `issues` omitted after sanitization/bounding; absent when no issue is omitted. `truncated`: true when any string, array, lineage, invocation, inspect list, or total-size reduction occurred.

Unknown keys are dropped. Invalid optional diagnostic fields are omitted or bounded rather than causing envelope formatting to fail and masking the original error. If required v1 diagnostic input (`version`, `category`, or required `next` fields) is absent or invalid, the formatter replaces the whole nested object with a valid bounded `internal` / `report_internal` minimal diagnostic while retaining only trusted top-level summary fields; it never emits a partial v1 object.

Category semantics are mutually comprehensible routing labels, not a second error-code hierarchy:

| Category | Meaning |
|---|---|
| `usage` | Invocation arguments/options are invalid or incomplete. |
| `source_validation` | An editable source value violates a content/schema rule. |
| `structure` | Run-bundle/path layout violates the canonical ontology. |
| `artifact` | A required derived input/output is missing, stale, ambiguous, or invalid. |
| `gate` | Review, approval, or policy state blocks progress. |
| `environment` | Local configuration, credential availability, dependency, runtime, font, or filesystem capability blocks execution. |
| `provider` | A remote service/request fails after local prerequisites are valid. |
| `delegated` | A child failed but no trusted more-specific category survived the boundary. |
| `interrupted` | A catchable signal/cancellation stopped otherwise valid execution. |
| `internal` | A framework invariant, unexpected exception, or diagnostic-construction defect occurred. |

Action semantics define what MD should do next: `fix_arguments` corrects invocation values; `inspect` reads named evidence without edit authority; `edit_source` changes the named editable source; `repair_environment` fixes local configuration/dependencies; `repair_prerequisite` restores or reruns an upstream requirement; `rerun` repeats the preferred operation without implying another repair; `review` asks a human to assess evidence; `approve` records a human-owned approval; and `report_internal` inspects/reports a framework defect. `review` and `approve` require `requires_human:true`; other actions may also require a human when the named repair exceeds MD authority.

Alternative considered: add many new top-level fields. Rejected because it makes the stable envelope noisy and increases collision risk for existing consumers. Alternative considered: use an untyped free-form context object. Rejected because MD would still need to guess field meanings and secret safety would be untestable.

### 4. Make lineage ordered and aggregation first-class

`lineage` order is causal data flow: editable source first when known, then derived inputs/outputs, ending at the artifact where the failure was observed. It is evidence, not an instruction to edit every listed file. `next.inspect` and `next.action` identify the actual edit or review target.

Aggregate validators use `issues` rather than embedding an unbounded list in `message`, `hint`, or `stack`. Common stage/operation and next action remain at diagnostic top level; per-slide or per-artifact facts stay in leaf issues. The formatter preserves required `version/category/next` first, then top-level stage/operation/subject/source/reason/delegated, then complete issue leaves in input order, and finally remaining top-level lineage. Per-field caps apply before the total-size cap. If total size still exceeds 16 KiB, it drops trailing complete issues (increasing `omitted_count`), then trailing lineage/inspect entries, then optional actual/expected/delegated invocation fields; it never drops required next/default or emits a partial issue. Any reduction sets `truncated:true`.

Alternative considered: emit one envelope per issue. Rejected because the constitutional contract requires exactly one final envelope and multiple envelopes create ambiguous authority.

### 5. Carry structured context to the CLI boundary; never emit from imported library code

`cli_error.mjs` will provide small constructors/sanitizers for source locators, issues, lineage, and `next`, plus a way to attach diagnostic metadata to an `Error` or explicit failure result. It also owns the direct-entry output transaction, registered progress renderer, and explicit safe structured-report registration path. Deep Stage functions may throw/return structured context, but only a direct CLI boundary emits the envelope.

This avoids duplicate envelopes when Stage functions are imported by `unified_pipeline` or invoked through `ppt_flow`. Existing return-code APIs can migrate incrementally by carrying a last failure/result object rather than requiring a whole-pipeline exception rewrite.

Alternative considered: call `emitCliError` at every low-level failure site. Rejected because imported functions and delegated wrappers would produce multiple competing envelopes.

### 6. Preserve child facts with a flat parent merge

The delegated-output collector consumes a child's final stderr JSON line. Only a supported v1 diagnostic from a registered framework child is eligible as structured evidence, and the parent re-runs it through the v1 sanitizer. A legacy envelope, unsupported version, unregistered child, malformed v1 object, or prose-only child is treated as a minimal delegated fallback even if its top-level JSON is parseable. Parent `code`, `message`, `hint`, `where`, and parent-specific `next` remain authoritative. Parent human summaries are reconstructed from the known operation and allowlisted structured evidence; child top-level `message`/`hint` and other prose are never copied verbatim. Eligible child diagnostic facts are copied into the parent diagnostic using this precedence:

1. Parent-supplied context wins for `category`, `stage`, and `operation` when it is more specific to the invoked command. Parent always constructs `next`; child `next` is never copied across the boundary.
2. Child `subject`, `source`, `reason`, `lineage`, and `issues` are preserved unless the parent provides a more specific value.
3. Parent adds `delegated.invocation`, `delegated.child_code`, and `delegated.child_where`.
4. The parent never nests the full child envelope or a recursive child `diagnostic` object.

Every CLI-owned subprocess boundary, asynchronous or synchronous, SHALL pipe/capture stdout and stderr; no child output descriptor may use `inherit` and bypass the transaction. This includes `ppt_flow test` / `spawnSync("npm", ["test"])`, which uses the same success-replay/failure-suppression semantics even though npm is unregistered and therefore can only produce delegated fallback evidence on failure.

The parent SHALL NOT stream child stdout or stderr prose to the external caller before it knows the child exit status. It may relay only validated registered progress frames after local rendering. It captures each stream up to 1 MiB while continuing to drain overflow. On success it replays remaining non-frame output according to the existing success contract; on failure it parses a compliant final stderr envelope and publishes only allowlisted child evidence through the parent. Non-frame child prose from either stream is not trusted diagnostic data and is discarded from the externally visible failure channel; a prose-only child receives a minimal delegated fallback based on safe invocation/exit metadata, without quoting raw text. If either capture exceeds 1 MiB, the wrapper emits an explicit truncated delegated failure rather than leaking or silently presenting partial success. Registered children must independently satisfy the same full-channel safety contract as defense in depth.

Alternative considered: store the entire child envelope under `diagnostic.child`. Rejected because repeated wrappers create recursive growth and unclear authority.

### 7. Treat the complete failure channel as a bounded trust boundary

Safety is enforced in three layers:

- Call sites construct diagnostics from allowlisted metadata only: paths, ids, field names, stage names, short domain expected/actual values, artifact roles, and known credential-free command arguments.
- The shared formatter drops unknown keys, enforces bounded token grammars, caps all strings and arrays, caps `issues` and `lineage`, limits source positions to positive integers, and enforces maximum serialized sizes. Exact v1 targets are 1024 characters for top-level `message`/`hint` and each ordinary diagnostic string, 256 characters for top-level `where`, 2048 characters for paths and invocation arguments, 20 issues, 12 lineage entries per issue/diagnostic, 16 inspect locators, 32 invocation args, 16 KiB of UTF-8 serialized diagnostic data, and 20 KiB of UTF-8 data for the final one-line envelope. Truncation is explicit inside diagnostics; top-level trusted templates are bounded without appending secret-derived text.
- The entire emitted failure channel is covered: top-level `message`/`hint`/`where`, diagnostic fields, deterministic human rendering, registered progress, direct-entry output transactions, registered JSON failure reports, child capture, and provider error summaries. No safe-looking bounded field may be populated from arbitrary exception, provider, environment, prompt, or child text. New envelopes never emit `stack`; the parser may tolerate and discard a legacy stack for backward compatibility.

Raw `.env` text, authorization headers, API keys/tokens, prompt bodies, image bytes, provider request/response bodies, stacks, arbitrary `Error.message`, and unbounded child output are never copied into failure output, including top-level fields and invocation arguments. Provider failures are normalized at the provider boundary into status, hostname/role without userinfo/query, bounded safe reason codes, and attempt metadata; sanitizing only the final diagnostic object is insufficient. The generic guard fallback emits a fixed safe summary and `internal` diagnostic instead of quoting captured stderr or the thrown value; it includes the known direct-executable source locator and code-location token as inspect evidence when available, then uses `report_internal`. Tests inject distinct sentinels through each source and assert absence from complete stdout/stderr as applicable.

Alternative considered: rely on generic secret-pattern scanning alone. Rejected because arbitrary payload scanning is incomplete; allowlisted construction and size bounds are the primary protection.

### 8. Discover direct-entry candidates and audit only public CLIs

`EXECUTABLE_INVENTORY` remains the explicit public CLI registry. Tests recursively scan `scripts/**/*.mjs` for direct-entry indicators such as `process.argv[1]` comparison, `import.meta.url` main guards, standalone-envelope installation, or direct Commander parsing. The detected direct-entry candidate set must equal the executable inventory.

This catches a new CLI that forgot registration and a stale registry entry without forcing every helper module into a second hand-maintained module-only list. Detection is deliberately structural and may use narrow explicit exceptions only for a file whose library code legitimately inspects `process.argv`; each exception names one path and reason.

Every registered direct executable then needs an audit record for each applicable return category, or an explicit reason that a category is not supported. A separate command inventory must equal the 12 commands registered by `ppt_flow`.

Audit categories are help, deterministic usage failure, contextual hard failure, delegated hard failure where applicable, catchable interruption, prose success, and JSON success where documented. This is not a Cartesian demand that every command implement every category; it is a demand that applicability be explicit and tested. Focused Stage tests verify rich lineage at representative structured failure sites, while the inventory test verifies the universal final-envelope/channel contract and shared signal handling.

Alternative considered: compare `EXECUTABLE_INVENTORY` only with a failure-argument object. Rejected because both lists can omit the same new executable and still pass.

### 9. Make the existing cli-surface capability coherently global

`cli-surface` is the single authoritative producer contract for every direct Node CLI, not only `ppt_flow`. It owns the wire schema, output channels, exhaustive executable/command audit, contextual lineage obligations, secret safety, and delegated wrapping. Because OpenSpec delta application merges requirement blocks but does not update an existing Purpose section, implementation must explicitly update the main `openspec/specs/cli-surface/spec.md` Purpose before sync/archive and add a test asserting it describes all direct CLIs while retaining the fixed 12-command `ppt_flow` surface.

`node-specification` owns only how MD consumes the protocol: fallback behavior, evidence trust, parent/child authority, human-decision boundaries, and generated-artifact ownership. It references `cli-surface` and does not redefine producer field shapes or obligations. The `cli-surface` delta itself contains the durable wire shapes and enum semantics rather than depending on this design document. Therefore a Coding Agent can implement a CLI correctly without discovering `node-specification`, while an MD Controller implementer can consume the protocol without reading Stage code.

Constitutional documents mirror and point to `cli-surface`; they are not the only location of the executable contract. Stage capability specs do not duplicate the global wire schema; focused Stage tests verify that known domain facts populate it.

Alternative considered: keep the producer contract under `framework-charter` because it is constitution-level behavior. Rejected because capability names are retrieval routes for Coding Agents, and an Agent editing CLI code may never inspect a broad charter capability. Alternative considered: create a new `cli-diagnostics` capability. Rejected because `cli-surface` already exists, is the natural retrieval target, and can coherently expand to cover all public CLI surfaces.

### 10. Use separate producer and generated-consumer discovery paths

Repository-maintenance discovery starts at root `AGENTS.md`: any edit to CLI entry points, output channels, exit paths, delegation, `cli_error.mjs`, or MD diagnostic consumption must read the main capability plus active deltas from `openspec status`. `scripts/README.md` and the `cli_error.mjs` module header carry short producer pointers; `md_controller_reader.mjs` and `state.mjs` headers carry short consumer pointers. Detailed schema remains in OpenSpec and is not duplicated into code comments.

Runtime discovery is produced, not hand-maintained per deck. `bundle_layout.mjs#initBundle` adds a deck-root `AGENTS.md` alongside `CLAUDE.md`; both are short pointers to `deck-guide.md`. The generated guide tells runtime Agents to parse the final CLI envelope, follow structured `next`, respect `requires_human`, and never edit `_generated/`. The producer-owned `workflow/00-setup/template-deck-guide.md` carries the same consumer essentials so the documented manual/Expert seed cannot contradict `initBundle`; neither guide references repo-only `openspec/` paths. `AGENTS.md` becomes a canonical allowed deck-root control file, but remains optional for legacy deck validation.

`deck_ai_sdlc_keynote` is not edited. This change does not alter the root/version README placement-map seeds governed by the existing golden-sample requirement, so it creates no README refresh obligation. A fresh temporary scaffold proves the new producer behavior, and implementation diff review proves no file under the existing run bundle was changed.

Documentation/coherence tests verify both routes and their authority targets. This makes discovery an enforceable production property rather than an assumption about Agent curiosity or one tool's nested-AGENTS semantics.

Alternative considered: add only `PPTMAKER_FRAMEWORK/scripts/AGENTS.md`. Rejected because nested instruction loading differs among Coding Agents and it does not help an Agent entering a generated run bundle. Alternative considered: hand-add `AGENTS.md` to the golden deck. Rejected because it fixes one output instead of its producer.

## Risks / Trade-offs

- [Risk] The cross-cutting migration is large and a generic fallback could create a false sense of completion. -> Mitigation: require contextual failure cases in the audit registry and focused lineage assertions for every stage/domain that has structured facts.
- [Risk] Aggregate diagnostics become too large for stderr or model context. -> Mitigation: fixed per-string, per-array, per-issue, and total-size bounds with explicit truncation metadata.
- [Risk] A formatter error hides the original failure. -> Mitigation: required top-level fields remain strict, but optional diagnostic data is sanitized best-effort and never prevents the minimal envelope from being emitted.
- [Risk] Paths reveal local directory names. -> Mitigation: paths are allowed because they are necessary for local repair, but credentials and file contents are not; tests use temporary roots and secret sentinels.
- [Risk] Transactional direct/child output delays live progress and can overflow on unusually chatty success. -> Mitigation: migrate meaningful long-running status to registered safe progress events, replay remaining captured output unchanged on success, keep the 1 MiB-per-stream bound explicit, fail closed on overflow, and test progress secrecy, representative long-running success, and overflow behavior.
- [Risk] Static direct-entry detection has false positives or false negatives. -> Mitigation: combine several structural indicators, compare against the explicit public inventory, and permit only path-specific reasoned exceptions.
- [Risk] Code-adjacent pointers drift or duplicate the protocol. -> Mitigation: keep pointers short, forbid schema duplication outside `cli-surface`, and enforce canonical targets in documentation-coherence tests.
- [Risk] Structured invocation is rendered or executed through a shell and loses its safety advantage. -> Mitigation: specify `{program,args}` execution through `spawn`/`execFile` with `shell:false` and test paths containing spaces/metacharacters.
- [Risk] Framework source edits appear to conflict with the runtime soft-bundle read-only rule. -> Mitigation: document this as repository maintenance; runtime deck agents still do not mutate framework source.

## Migration Plan

1. Freeze current behavior and new contracts with failing schema, direct-entry/bootstrap, direct-output transaction, success-byte, JSON-report, progress, delegation, signal, overflow, and sentinel tests. Keep probes temporary and network-free.
2. Implement v1 sanitizer/parser/constructors and deterministic human rendering in `cli_error.mjs`; verify legacy parsing and minimal `internal` fallback before changing any call site.
3. Add the query-token bootstrap to all inventory entries, transactional direct output, safe-report registration, and registered direct progress. Make every JS-controlled non-zero return minimally conformant while preserving bounded success bytes.
4. Replace all async/sync delegated output with the collector, reserved progress frames, parent re-sanitization/precedence, signal forwarding, and unregistered-child fallback. Verify `ppt_flow test`, one Stage child success, one v1 child failure, one legacy child failure, and overflow before enrichment.
5. Migrate contextual facts from source outward in small groups: Stage 1; environment/bundle/style; Stage 2/contact sheet/provider; Stages 3-5; `unified_pipeline`; then all 12 `ppt_flow` commands and gates. Run each group's focused tests before proceeding.
6. Add repository-maintenance pointers and producer-owned run-bundle controls/templates. Verify only a fresh temporary scaffold; do not edit `deck_ai_sdlc_keynote` or placement-map README seeds.
7. Update constitutional/MD consumer references and the main `cli-surface` Purpose after runtime behavior is stable, then run all focused suites, full `npm test`, static audits, strict OpenSpec validation, and diff checks.

Rollback remains wire-compatible because consumers can ignore `diagnostic` and parsers still accept legacy envelopes. Operational rollback SHALL proceed from contextual call sites inward while retaining bootstrap/minimal-envelope support until every migrated call site and delegated parent has been reverted; removing the transaction/collector first would reintroduce duplicate or unsafe output. Generated run-bundle controls are create-if-absent and need no legacy-deck rollback.

## Open Questions

None. The v1 field set, bounds/truncation order, structured invocation model, complete JS-controlled failure-channel boundary, bootstrap/transaction/progress model, direct-entry audit, parent/child precedence, non-zero process semantics, producer/consumer capability split, and generated Agent discovery routes are resolved above.
