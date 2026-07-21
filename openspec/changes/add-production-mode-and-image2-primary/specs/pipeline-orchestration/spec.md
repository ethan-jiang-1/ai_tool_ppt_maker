## ADDED Requirements

### Requirement: One production policy dispatches every normal adapter operation

Public orchestration SHALL consume one shared production policy resolved from the exact run version.
For each mode it SHALL return the canonical pipeline, final page authority, refinement policy, and
style-master policy: `html-only` maps to `html-first-v1`/HTML/disabled/reserved-HTML-adapter;
`html-then-image2` maps to `html-first-v1`/HTML/required/reserved-HTML-adapter; and `image2-only` maps to
`legacy-image2-first`/whole-page Image2/not-applicable/current. Command routers, playbook validation,
init, and status SHALL not maintain independent mode tables.

The evaluator SHALL validate state mode before source marker and shall stop at the first failed
authority/identity prerequisite. After a consistent policy is established, validate, pilot, gate,
build, refresh, and status SHALL delegate to the existing isolated adapter; no fallback chain SHALL
select an adapter from generated artifacts or from whichever readiness check succeeds.

#### Scenario: HTML-then-Image2 selects HTML composition

- **WHEN** orchestration inspects a consistent `html-then-image2` run
- **THEN** normal production delegates to HTML and reports required modern refinement as completion policy
- **AND** whole-page Image2 is not selected

#### Scenario: Image2-only selects whole-page generation

- **WHEN** orchestration inspects a consistent `image2-only` run
- **THEN** pilot/build/refresh delegate to the whole-page adapter and preserve its gates/provenance

#### Scenario: Generated files suggest another adapter

- **WHEN** stale HTML artifacts coexist with an authoritative consistent `image2-only` run
- **THEN** orchestration ignores them as routing authority
- **AND** it does not try the HTML adapter as fallback

## MODIFIED Requirements

### Requirement: HTML and legacy production adapters remain mutually isolated

Every public run-dir entry SHALL inspect canonical version-scoped production mode and verify the
canonical source marker before branch-specific readiness. The HTML adapter SHALL reject whole-page
prompt/render/header artifacts as authority; the whole-page Image2 adapter SHALL not infer HTML from
structured-looking prose or consume HTML production manifests. Provider-call spies and exact directory
diffs SHALL prove that HTML create/preview/build/refresh/structural operations never touch whole-page
Image2 or modern-refinement remote paths, and that `image2-only` operations never consume HTML output.
Calling the whole-page adapter from a first-class Image2-primary controller SHALL not weaken this
isolation or turn modern visual-slot refinement into a whole-page renderer.

#### Scenario: HTML deck has whole-page generated files

- **WHEN** stale whole-page prompt/image/header directories coexist with a consistent HTML-mode source
- **THEN** HTML orchestration ignores them as production authority
- **AND** consumes only structured-plan and HTML-production evidence

#### Scenario: Image2-primary deck has HTML generated files

- **WHEN** a consistent `image2-only` run contains stray HTML-production bytes
- **THEN** whole-page orchestration does not use them to satisfy production or review gates

#### Scenario: First-class Image2 path reuses the isolated adapter

- **WHEN** create-deck dispatches a new `image2-only` run
- **THEN** it invokes the existing whole-page stages through the shared policy
- **AND** does not label the user workflow as HTML refinement or legacy-only maintenance
