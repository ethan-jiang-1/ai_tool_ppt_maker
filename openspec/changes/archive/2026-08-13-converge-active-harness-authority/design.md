## Context

See `proposal.md` for motivation and the
`harness-charter` delta for observable behavior. The active maintenance context
is one Markdown block scalar inside `openspec/config.yaml`; OpenSpec injects it
into later artifact work, so stale content there has a larger blast radius than
an ordinary reference document.

The direct facts already exist:

- immediate directories under `openspec/specs/` define the current capability
  set and each `spec.md` defines behavior;
- active entry documents and `CONTEXT.md` define navigation and terminology;
- `tests/contracts/source-test-ownership.json` plus the executable inventory
  identify registered script interfaces and executable surfaces;
- the repository filesystem establishes whether a literal owner path exists;
- `harness_coherence.mjs` is the existing provider-free documentation and
  authority checkpoint.

Today, `scanHarnessCoherence()` accumulates all main-spec text into
`activeSurfaceFiles` but never evaluates that collection. This dead projection
allows its broadly named test to pass while the config registry and owner paths
are wrong.

## Goals / Non-Goals

**Goals:**

- make one Agent-visible capability projection structurally enumerable and
  mechanically reconcilable with direct authority;
- keep the direct failure loop to `authority facts -> coherence evaluator ->
  bounded finding -> repair owner -> rerun`;
- delete more stale terminology, paths, and special cases than this change adds;
- give every changed architecture rule a safe planted negative control.

**Non-Goals:**

- changing a Page Image runtime, Controller, CLI, state, schema, gate, provider,
  or run-bundle behavior;
- validating or duplicating the detailed contents of capability specs;
- removing retired protocol tombstones from main specs, which belongs to
  `retire-historical-protocol-surfaces`;
- introducing a generated config, registry command, cache, persistent status,
  compatibility reader, or migration;
- reading or mutating `deck_*`, `dpt_*`, `_generated/`, or archived changes.

## Decisions

### 1. Treat the maintenance context as a projection, not fact authority

The authority chain is:

```text
main-spec directories + owning specs + registered public surfaces
                              |
                              v
             config capability navigation projection
                              |
                              v
                 OpenSpec-injected Agent context
```

Main specs own accepted behavior. Current entry documents and executable
contracts own their respective entry and script facts. The config registry owns
only navigation: capability ID, exact spec path, a bounded scope summary, and
optional exact owner paths. OpenSpec change/archive remains the only route for
changing accepted behavior; editing the projection cannot change that behavior.

Alternative considered: make config the capability authority. Rejected because
it would create a second behavioral registry beside main specs. Alternative:
delete the registry entirely. Rejected for this batch because OpenSpec context
needs a compact routing index and the program explicitly requires its
completeness to be checked.

### 2. Embed one bounded YAML registry in the existing context string

Replace the free-form capability tables with one sequence between exact start
and end markers inside the existing `context: |-` Markdown. Each record has a
closed shape:

```yaml
capabilities:
  - id: harness-charter
    spec: openspec/specs/harness-charter/spec.md
    scope: active guidance and Harness-wide ownership boundaries
    owner_paths:
      - ppt_maker_harness/charter/AGENT_CONTRACT.md
```

A sequence, rather than a mapping keyed by capability, makes duplicate IDs an
explicit testable error. Fixed markers avoid scanning unrelated YAML examples;
the project's declared `yaml` dependency parses the bounded body rather than a
hand-written Markdown-table parser. The outer OpenSpec config shape remains
unchanged.

The exact markers are `<!-- harness-capability-registry:start -->` and
`<!-- harness-capability-registry:end -->`. Their body is one YAML mapping with
only the `capabilities` sequence. Each record has exactly `id`, `spec`, and
`scope`, with an optional `owner_paths` sequence; each field has its ordinary
scalar/list YAML type and owner paths are unique literals. This makes malformed
markers, extra YAML keys, duplicate owner claims, and accidental Markdown
tables root errors instead of parser-dependent behavior.

The schema is deliberately small. `scope` is a non-empty navigational summary
and cannot restate a detailed contract. `spec` must equal the path derived from
`id`. `owner_paths` may be absent or empty when the main spec is the only useful
public route; it must not be padded with a private implementation merely to
populate the field.

Alternative considered: add a new top-level key to OpenSpec config. Rejected
because the OpenSpec config schema owns top-level keys. Alternative: preserve
Markdown tables and parse them. Rejected because table formatting would become
an accidental machine contract.

### 3. Extend the existing coherence evaluator with a pure authority-map seam

Add a pure evaluator to `harness_coherence.mjs` that accepts a parsed registry,
the discovered main-spec capability set, repository file paths, and registered
script surfaces. A thin repository adapter reads the config, specs directory,
filesystem, and ownership manifest, then `scanHarnessCoherence()` includes its
issues in the existing result.

Validation order is:

1. locate exactly one bounded registry and parse its YAML;
2. validate the closed record shape and unique lower-kebab IDs;
3. compare IDs and derived spec paths with immediate main-spec directories;
4. only after a valid capability identity set, validate optional owner paths;
5. return bounded independent root findings without dependent cascades.

Path checks reject absolute/traversal/glob paths, directories, archive paths,
`deck_*`/`dpt_*`, `_generated/`, and `internal/` implementation paths. A script
`.mjs` owner must also appear in the existing source/test ownership manifest as
an interface or executable. A non-script owner is admissible only when it is
one of the existing Harness-root entry documents (`AGENTS.md`, `BOOTSTRAP.md`,
`COMMANDS.md`, or `README.md`), a Markdown document below the declared
`charter/`, `playbook/`, `workflow/`, or `reference/` homes, or a Markdown/YAML
definition file below the declared `schema/` home. Those are the existing
Harness source-map categories in the directory-layout contract, not a new
capability-by-capability owner list; `openspec/specs/`, tests, arbitrary source
files, and unclassified directories do not become substitute owner surfaces by
existing on disk. The implementation will register the already-imported
`harness_coherence.mjs` contract seam in the existing ownership manifest and
its required architecture inventory instead of creating a second allowlist.

The old unused `activeSurfaceFiles` accumulation is removed. Semantic retirement
rules remain scoped to the surfaces they actually check; Change 1 does not
pretend to solve the known main-spec tombstones reserved for Change 2.

Alternative considered: add a separate registry validator. Rejected because it
would create two pass/fail paths and leave the current broadly named coherence
checkpoint misleading.

### 4. Classify mismatch as a maintenance hard failure with same-check recovery

Per `human-centered-gates.md`, an unreadable or contradictory injected authority
map is a `hard-stop` for repository-maintenance verification because
deterministic authority existence and required structure are uncertain. It is
not a deck-production gate, asks for no human content decision, and has no
waiver or force option.

Per `agent-assistance-and-control.md`, the Agent performs the normal mechanical
repair through the named owning file and reruns the same checkpoint. Each issue
contains the config/spec/path root cause and one nearest action; it does not
guess another owner, search production data, or write a recovery record.

Per `simple-reliable-control.md`, this adds no state, command, retry, fallback,
or Controller step. It consolidates config/spec/path checking into the evaluator
already used by repository verification and deletes dead scan state and stale
projection content.

### 5. Make terminology cleanup targeted, not mechanical

Implementation updates only the inventoried active maintenance surfaces:

- config lifecycle/render/Chain/Stage prose;
- the `Frozen Identifier` definition in `CONTEXT.md`, removing the historical
  category without inventing a replacement noun;
- the placeholder Purpose in the current `slide-identity-and-ordering` main
  spec, as OpenSpec instructions require direct Purpose repair;
- stale `ppt_flow` file comments, script README wording, test README headings,
  and matching architecture-checker identifiers/diagnostics that call numbered
  source owners "Phase".

The architecture names should describe their actual jurisdiction, such as
foundation method modules, without renaming directory literals. Searches must
exclude presentation-content examples where "phase" has ordinary domain
meaning. No broad search-and-replace is allowed.

### 6. Verify the checker itself at unit and integration levels

Focused unit tests call the pure evaluator with valid synthetic data and planted
missing, extra, duplicate, malformed, forbidden, unadmitted-existing, and
stale-path variants. They assert the specific root code, no mutation, and a
passing rerun with the exact original input. Repository-adapter coverage also
proves that malformed or repeated registry markers fail before YAML-derived
claims are evaluated.

The existing documentation-coherence integration test exercises the repository
adapter against the real checked-in config, current specs, filesystem, and
ownership manifest. Existing architecture tests cover manifest admission after
the coherence contract seam is registered.

No new E2E journey is justified: no public command or user workflow changes.
The full unit/integration sweep and OpenSpec strict validation cover the broader
regression boundary; no provider-bearing test is needed.

## Risks / Trade-offs

- [A manually summarized `scope` can become semantically stale] -> Keep it
  bounded and explicitly non-normative; capability behavior remains in the main
  spec. Structural/path drift is automated, while meaning is reviewed in the
  normal OpenSpec change that edits the capability.
- [Strict path validation could reject a legitimate new owner] -> The nearest
  action is to register a true public script surface through the existing
  ownership manifest, place a non-script fact in an existing published source
  home, or omit a nonessential owner path. No broad exception is added.
- [A config edit can temporarily make OpenSpec context unreadable] -> Apply the
  bounded registry and evaluator/tests in one change, validate the config with
  OpenSpec, and use an ordinary forward correction if a published error is
  found.
- [Terminology cleanup could alter business prose] -> Limit edits to the exact
  maintenance files and code identifiers inventoried by this change; inspect
  every diff and avoid deck/domain examples.
- [Later Change 2 still finds retired prose in main specs] -> This is expected
  and explicit. Change 1 validates authority identity and paths, not all
  protocol semantics, so it does not create a false all-active-prose claim.

## Migration Plan

1. Add focused negative controls for the pure authority-map evaluator.
2. Add the bounded registry and extend the existing coherence repository
   adapter; register its existing contract seam in the ownership manifest.
3. Replace stale context/terminology and targeted ownership labels in the same
   change, then run the focused checker against the restored repository.
4. Run focused contract/architecture tests, the normal development baseline,
   the full sweep, strict OpenSpec validation, and scoped residue searches.
5. Archive through OpenSpec only after all tasks and verification close, then
   ordinary-commit and fast-forward-push `master` with four-SHA reconciliation.

There is no runtime or persisted-data migration. Before push, rollback is an
ordinary edit or commit correction; after push, recovery is a new forward-fix
commit. No history rewrite is part of the plan.
