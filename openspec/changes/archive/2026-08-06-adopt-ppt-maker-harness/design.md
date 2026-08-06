## Context

See [proposal.md](proposal.md) for the motivation. The current reusable source
tree is `PPTMAKER_FRAMEWORK/`; its root name appears in direct command paths,
runtime constants, locator APIs, tests, package metadata, and active OpenSpec
specifications. The v1 locator accepts a declared Framework root, a
relation-derived root, and a caller-provided fallback root. That behavior is
incompatible with the agreed exact-local Harness binding.

The change is repository maintenance only. `deck_*`, `dpt_*`, `_backlog/`, and
`openspec/changes/archive/` are not implementation inputs or migration targets.
The active specifications and the change delta specs are the normative planning
surface.

Today the locator is an external-card helper, not a `ppt_flow` input: registered
run commands derive a Deck root directly from their `run_dir`, and some paths
such as `new-version`, slide editing, and standalone `bundle_layout` bypass the
existing adapter helper. The strict v2 binding must therefore become a shared
preflight for authority-carrying run operations, not merely a stricter parser
that no direct command consults.

## Goals / Non-Goals

**Goals:**

- Move the reusable source tree to one canonical `ppt_maker_harness/` root and
  rename the active concept, APIs, test fixtures, and active capability IDs to
  Harness terminology.
- Replace the v1 locator with a strict v2 local binding that has no legacy
  parser, fallback root, or implicit reassignment.
- Require every run-scoped operation that reads or mutates source, state, or
  production authority to pass the v2 binding preflight before its existing
  owner logic runs.
- Keep the existing production namespace and control boundaries intact while
  making all current commands, diagnostics, guidance, and specifications point
  to the renamed root.
- Validate the move with focused locator/CLI tests, the existing regression
  suite, and a scoped active-surface audit.

**Non-Goals:**

- Do not migrate, scan, rewrite, or use existing production Run Bundles.
- Do not support moving a Bundle or Harness through a portable binding, release
  pin, Git revision, content hash, or `harness_id`.
- Do not create global lessons, cross-session memory, a new Agent runtime, or
  a new controller/state authority.
- Do not update project version files during implementation; archive-time
  version evaluation remains governed by `project-versioning`.

## Decisions

### 1. Rename the source root as a clean break

The implementation will move the complete source tree from
`PPTMAKER_FRAMEWORK/` to `ppt_maker_harness/` and then update every active
source, test, CLI, package, and normative-spec reference that uses the old
system name. The old path will be absent in the completed worktree: no symlink,
compatibility shell, duplicate tree, or forwarding executable.

This is a physical and conceptual rename, not a blind text replacement. A
scoped audit will distinguish a former-path citation in an accepted ADR or this
change artifact from an active ownership or executable reference that must be
renamed. `ppt_flow`, `PPTMAKER_*`, and `pptmaker-*` remain stable namespaces;
the npm package name becomes `pptmaker-harness`.

Alternative considered: retain `PPTMAKER_FRAMEWORK/` as an alias. Rejected
because it preserves the misleading conceptual boundary and turns a pre-release
rename into a permanent compatibility obligation.

### 2. Make the v2 locator an exact binding, not a discovery protocol

`RUN_BUNDLE.md` becomes the single direct source of record for a new Bundle's
Harness binding. Its frontmatter has exactly:

```yaml
schema: pptmaker-run-bundle-v2
deck_root: /canonical/absolute/deck/path
harness_root: /canonical/absolute/harness/path
harness_relation: relative/path/from/deck/to/harness
```

The parser canonicalizes both roots, verifies the Harness sentinels, requires
the relation-derived root to equal `harness_root`, and requires the Deck to sit
outside the Harness root. `harness_relation` is retained only as an independent
consistency check for the exact same local root; it is not a fallback or a
portability mechanism.

The locator API changes as follows:

| Current v1 surface | v2 surface |
| --- | --- |
| `pptmaker-run-bundle-v1` | `pptmaker-run-bundle-v2` |
| `framework_root`, `framework_relation` | `harness_root`, `harness_relation` |
| `canonicalFrameworkRoot`, `normalizedFrameworkRelation` | `canonicalHarnessRoot`, `normalizedHarnessRelation` |
| `frameworkDir`, `FRAMEWORK_DIR` | `harnessDir`, `HARNESS_DIR` |
| `FRAMEWORK_SENTINELS` | `HARNESS_SENTINELS` |
| `originalCardPath`, `requestedDeckRoot`, `requestedFrameworkRoot`, and declared/relation/requested selection | no relocation or caller-selected fallback; declared and relation roots must agree |

Resolved locator results expose the verified `harnessDir`; legacy
`frameworkDir` and provenance fields that exist only to explain fallback
selection are removed. Callers use the resolved root directly and do not get a
second root-selection input.

The module also exposes one read-only verification entry for a Deck root already
derived by a direct CLI. It reads that root's card, verifies that its declared
Deck root is the same canonical directory, and applies the same v2 binding
evaluator. `ppt_flow`, `bundle_layout` normal check/new-version, and the lessons
CLI call this entry before their current run-scoped owner logic; they do not
duplicate manifest parsing or invent their own fallback.

Alternative considered: retain v1 parsing or let a caller point a legacy Bundle
at a new Harness. Rejected because either choice silently reassigns a Deck and
creates an unsupported portability contract.

### 3. Reject old bindings before all downstream work

The v2 parser recognizes only the four-field v2 manifest. A missing,
malformed, v1, Framework-named, relation-conflicting, missing-root, or
wrong-sentinel locator fails before a run-scoped command reads or mutates
source, state, provider, generated-artifact, or production authority. It does
not heal or rewrite the manifest. The diagnostic gives the one nearest action:
explicitly reconstruct a current Bundle if the user wants to resume that content
later.

The standalone `bundle_layout --check --structure-only` path remains an
explicit read-only exception. It may report the filesystem layout of a Bundle
that has no current locator, but it cannot read state, select a continuation,
start a controller, inspect production readiness, or write. Normal bundle
checks, new-version publication, `ppt_flow` run commands, and the lessons CLI
are not that exception and must use the binding preflight.

Under `openspec/policies/human-centered-gates.md`, this is a `hard-stop`, not a
`guide` or `confirm`: the protected invariant is the exact local Deck-to-Harness
identity. There is no continuation reason or waiver record because neither can
make the identity reliable. Under
`openspec/policies/agent-assistance-and-control.md`, the locator module is the
one evaluator and source of record; the Agent may present and carry out only the
owner-issued mechanical action. Under
`openspec/policies/simple-reliable-control.md`, deleting v1 parsing, card-path
relocation recovery, and requested-root fallback shortens the control path to
one fact set and one legal failure action.

### 4. Rename the active specification taxonomy with the source tree

The implementation moves the active main specification directories
`framework-charter`, `framework-directory-layout`, and
`framework-script-layout` to their `harness-*` names and updates their contents
to the new terminology. It updates the OpenSpec configuration capability
registry and all active main-spec paths that point into the root. The old
capability directories are removed; the corresponding deltas document their
retirement and their replacements.

Archived changes remain immutable. A schema ID that explicitly names Framework
is renamed to Harness and incremented, including
`pptmaker-framework-governance-ledger-v1` to
`pptmaker-harness-governance-ledger-v2`, together with its contract fixture and
test. No project/protocol namespace that does not explicitly name Framework is
renamed.

Alternative considered: leave the capability IDs untouched while changing only
their prose. Rejected because active OpenSpec IDs are normative owner names;
retaining Framework there would keep the ambiguity in the source of truth.

### 5. Preserve ownership while renaming runtime and guidance surfaces

MD guidance and playbooks receive Harness wording and new paths but remain the
owner of intent, sequencing, creative judgment, and human interaction. JS/CLI
renames deterministic root resolution, manifest parsing, command paths, and
diagnostic labels. JS owns the shared v2 binding evaluator and invokes it before
authority-carrying run work; MD consumes its bounded result without selecting a
replacement Harness. The v2 locator remains the only MD-to-JS binding protocol;
no controller record, global registry, or Bundle mutation is added.

All active material that presents an executable path is updated together:
`BOOTSTRAP.md`, `COMMANDS.md`, Charter/Node guidance, CLI help/examples,
environment checks, lessons help, root project docs, package metadata, tests,
and `openspec/config.yaml`. The source-tree move preserves internal relative
imports where possible; semantic names such as `frameworkDir` and
`FRAMEWORK_DIR` are renamed even where a relative import would still work.

Archive deltas replace requirements but do not rewrite an accepted main spec's
`## Purpose` section. Implementation SHALL therefore update Purpose text
directly for `commands-reference`, `project-versioning`, `run-bundle-layout`,
and `playbook-execution`, alongside their delta-driven requirements. It SHALL
also update current-system uses of the generic Framework term in every remaining
active main spec, including `slide-identity-and-ordering`,
`style-master-generation`, `image-production`, and `html-render-runtime`; those
wording-only edits do not create new behavior or capability deltas.

## Risks / Trade-offs

- **Old local Bundle becomes unusable by the new Harness** -> This is intentional
  clean-break behavior. Keep its bytes untouched, reject it before mutation,
  and require explicit reconstruction rather than conversion.
- **A broad rename misses an active command or import** -> Use a scoped
  `rg`-based audit plus architecture, locator, CLI, and end-to-end tests. The
  audit permits only deliberate historical citations and focused negative
  fixture payloads that prove legacy rejection; neither may become an active
  runtime route.
- **The root move makes interim local paths fail during development** -> Apply
  the tree move and all path/API consumers as one atomic implementation change;
  do not publish an intermediate alias.
- **The relation field could be mistaken for portability** -> Validate it only
  against the declared canonical root and cover rejection of disagreement with
  a focused negative test.
- **A run command bypasses the new binding evaluator** -> Route all registered
  authority-carrying run commands through the same Deck-root verification entry
  and test at least one currently bypassing command (`new-version` or slides)
  plus the standalone layout CLI.
- **A read-only layout diagnostic accidentally becomes an execution bypass** ->
  Retain `--structure-only` as a no-state/no-write inspection and test that it
  cannot establish current run authority.
- **Specification rename is not an automatic archive operation** -> Deliberately
  move and update active `openspec/specs/` and config during implementation;
  do not touch archive artifacts.

## Migration Plan

1. Establish a baseline with the existing relevant tests and record the active
   old-name reference inventory without reading production Bundle data.
2. Move the reusable source tree to `ppt_maker_harness/`, update package and
   root configuration/documents, and rename active Harness capability
   directories/specifications. Keep archive paths untouched.
3. Replace the locator implementation and all consumers with the v2 API:
   rename Harness-facing constants/functions/contexts; remove legacy parsing,
   requested-root handling, and relocation/fallback selection; render only the
   v2 manifest; and add one shared Deck-root preflight used by all
   authority-carrying run commands. Keep `bundle_layout --check --structure-only`
   as a no-authority layout inspection.
4. Update all current CLI, MD guidance, help text, inventories, architecture
   checks, fixtures, and tests to the Harness root. Directly update affected
   active-main-spec Purpose text and all current-system Framework terminology;
   rename every active Framework-named schema to a Harness v2 schema, including
   the governance ledger fixture and contract test.
5. Add focused tests for v2 rendering/resolution, direct/relation mismatch,
   v1 rejection with zero writes, absence of fallback root selection,
   Bundle-outside-Harness enforcement, and preflight coverage for direct and
   standalone run commands. Update existing unit, integration, and E2E source
   paths rather than introducing production data fixtures.
6. Validate in layers: unit tests cover pure locator/schema behavior;
   integration tests cover `init`, normal check, `--structure-only`, and
   bounded CLI diagnostics in temporary directories; existing E2E source files
   receive the renamed path but no new E2E gate is introduced because no
   declared Harness-locator E2E runner exists. Run the supported focused test,
   the core suite, OpenSpec validation, and the scoped active-surface audit
   last.

Rollback before release is a source-control reversal of this one unshipped
change. It restores the prior tree only as a rollback of the entire change, not
as a runtime alias alongside the new Harness. No data migration needs reversal
because production Bundles are not touched.
