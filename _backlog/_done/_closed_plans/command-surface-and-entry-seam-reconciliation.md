# Plan: Command Surface And Entry Seam Reconciliation

> Type: design / planning | Updated: 2026-08-02
>
> Status: closed. The main implementation is archived as [OpenSpec change `reconcile-command-surface-and-entry-seams`](../../../openspec/changes/archive/2026-08-02-reconcile-command-surface-and-entry-seams/proposal.md), diagnostic translation/recovery precedence is archived as [OpenSpec change `formalize-diagnostic-recovery-handoff`](../../../openspec/changes/archive/2026-08-02-formalize-diagnostic-recovery-handoff/proposal.md), and the scoped active-documentation terminology repair is archived as [OpenSpec change `retire-stale-full-page-prose`](../../../openspec/changes/archive/2026-08-02-retire-stale-full-page-prose/proposal.md). All commitments in this plan have a completed, verified change. This document preserves the reasoning that led to those changes.

## Why This Exists

The framework has evolved from a fixed, one-shot image workflow into a Page Authority lifecycle with Style Master, progressive Pilot/Expansion raw work, owner-issued hashes, and Controller-derived continuation. Its public discovery surface did not evolve at the same pace. `COMMANDS.md` is still command-first, includes retired paths, and does not give a novice a clear answer to three fundamentally different questions:

1. "I need to set this up. Can you help me?"
2. "I am making a deck and want to change something."
3. "I am stuck. What should I do now?"

This is not merely a documentation cleanup. It crosses intent discovery, current owner entry, diagnostic ownership, observation side effects, compatibility, and test vocabulary. The change must improve the existing system incrementally, without replacing working lifecycle contracts or turning natural-language routing into a new production runtime.

## Observed Drift

- `ppt_flow --help` has twelve top-level commands, including `style-master`; `COMMANDS.md` still claims eleven and teaches a retired one-shot raw sequence.
- Direct `env-check --help` advertises rejected `--image2` input and omits accepted `--mode` / `--operation` forms.
- `ppt_flow doctor` can overwrite a valid delegated child diagnostic's exact `next` action with generic `inspect`.
- `state` and `state --json` can rebuild `_state/page-production-task-projection.md` for an active progressive Controller route, while public guidance calls observation read-only without naming the permitted projection refresh.
- `COMMANDS.md` exposes technical lifecycle detail where a novice needs goals, expected results, confirmation/cost boundaries, and rough timing.
- Active docs/specs retain retired terminology and a stale iteration-classifier pointer, and current focused process-doc validation detects active retired wording.

## Decision

### 1. Add an audit-first Intent Route Catalog

Create `PPTMAKER_FRAMEWORK/playbook/intent-routes-v1.json` as a discovery seam adjacent to, not inside, `controller-manifest-v3.json`.

| Owner | Responsibility |
| --- | --- |
| Controller manifest | Lifecycle nodes and Controllers |
| Intent Route Catalog | Supported user-goal discovery and first safe steps |
| Agent | Natural-language interpretation and bounded clarification |
| Owner CLI / current OpenSpec contract | Mutation, hashes, authorization, evidence, diagnostics |
| `COMMANDS.md` | Novice-facing presentation of what can be asked |

The catalog has these fields:

```text
id
kind
required_context
entry
first_safe_step
risk_boundary
fallback
visibility
```

It must not contain a language parser, shell command strings, hashes, grants, authorization state, or lifecycle-node sequence. It is not a command dispatcher, a `PptControl` registry, or a third production executable.

Authority remains strictly ordered:

```text
owner CLI / current OpenSpec contract
  > playbook lifecycle
  > intent route catalog
  > COMMANDS.md presentation
```

The new catalog cannot rewrite a direct owner, widen authorization, or override an existing lifecycle contract.

### 2. Use Three Intent Kinds With A Closed First Inventory

The catalog has three kinds:

- `foundation`: local runtime, provider readiness, and explicitly confirmed channel probes.
- `work`: create a Deck, resume one exact run, or make a change to one exact run.
- `orientation`: locate an exact run, diagnose a failure, recover before the main entry is available, or report an unrecognized request.

The initial public inventory is deliberately closed:

```text
foundation-local-runtime
foundation-provider-readiness
foundation-channel-probe

work-new
work-resume
work-change
work-change-text
work-change-visual
work-change-notes
work-change-structure

orientation-locate-run
orientation-diagnostic
orientation-env-recovery
orientation-unrouted-intent
```

`work-change` is the classifier entry and the four leaf routes map to the existing `edit-text`, `edit-visual`, `edit-notes`, and `restructure-slides` playbooks. A later user-visible capability must add a route rather than hiding new behavior in prose.

### 3. Preserve The User's Intent Priority And Exact-Run Boundary

`work-resume` is state-first: for a known exact run, inspect `state --json` and follow the owner-issued `workflow_inspection.primary_action`. An explicit change request always wins over a current `primary_action`: it enters `classify-change`, then the corresponding leaf playbook. A new deck is `work-new`.

Resume and every change route require an exact run. If it is not supplied, route to `orientation-locate-run` and ask for `RUN_BUNDLE.md` or an exact deck/run path. The Agent must never scan `deck_*`, infer a latest run from names/timestamps/current directory, or turn an ambiguous locator into a guessed work target. Foundation work is unbound except for a run-bound raw readiness request.

### 4. Make Risk And Non-Persistence Explicit

The catalog's `risk_boundary` enum is:

```text
no-remote
confirm-live-diagnostic
owner-issued-authorization
```

Foundation work is offline-first. A live probe requires disclosed maximum submit count and explicit confirmation. Selecting a route never authorizes raw generation; existing owner-issued, hash-bound authorizations remain unchanged.

Selected route is ephemeral conversation context only. It must never be written to `state.yaml`, receipts, grants, attempts, history, task cards, or projections. An unknown request gets a non-persistent **Route Gap** that explains whether the smallest extension is a route, a playbook, or an owner capability. It does not automatically create a backlog entry, issue, or OpenSpec change; framework maintenance begins only after the user confirms it.

### 5. Present Goals To Novices, Keep Protocol Detail With Owners

Rewrite `COMMANDS.md` as the route catalog's novice-facing rendering. Each common-request row states:

1. What the user can ask for.
2. What the Agent needs to clarify or inspect.
3. What result to expect.
4. The confirmation or cost boundary.
5. Coarse timing: short local work, a human decision, or provider-variable work.

Its main table must not teach state internals, hashes, raw topology, Page Authority mechanics, `style-master`, `image2`, Framed/Pure ownership, or shell grammar. Agent-facing mappings may be anchored separately, without making those mechanics part of the novice surface.

For a new Deck, documentation describes only this durable shape:

```text
local foundation -> init -> user content and necessary choices -> create-deck Controller/current owner action
```

It must not hard-code the retired one-shot `validate -> image2 authorize/generate/review/accept` chain. Current playbooks and owner commands retain detailed lifecycle guidance.

### 6. Repair Diagnostic And Observation Semantics Without Changing Authority

For valid delegated child diagnostics, the parent preserves `category`, `operation`, `subject`, `reason`, `issues`, and the exact producer-owned `next`; it may add only delegated lineage. Missing, invalid, or truncated child output fails closed as delegated/internal with `report_internal`; it must not manufacture generic `inspect`.

The novice diagnostic translation has exactly four parts: what happened, what it affects, what the Agent can mechanically do, and the one real human action or confirmation required. It must not leak raw stderr, secrets, retries, or reclassify ahead of the producer's `next`.

Recovery precedence is:

```text
current CLI failure envelope
  -> known exact run: state --json
  -> no run: locator
  -> unavailable main entry / pre-install: direct env-check
```

Retain compatibility for both text `state` and `state --json` projection refresh behavior, but define it precisely: it is **authority-read-only plus a rebuildable collaboration projection**. It applies only to an exact active progressive Controller route and reports `created`, `updated`, `current`, or `not-applicable` in text and JSON. `status` and `state --validate-state` remain genuine zero-write observations. The task card is never resume, cost, evidence, or authorization truth.

### 7. Keep Existing Public Grammar And Correct Its Description

This change has a zero-breaking public grammar policy:

- keep the twelve-command `ppt_flow` surface unchanged;
- add no production executable, `ppt work`, or generic dispatcher;
- keep direct `env-check` as recovery-only and document only parser-accepted forms;
- preserve archive/version history, using narrow per-file historical exceptions only when truly necessary;
- correct active docs, specs, config pointers, help, tests, and terminology rather than adding broad exception maps.

The older `PptControl` / operation-registry and `ppt work` ideas remain future alternatives only if evidence later shows that current owner families cannot serve discovery safely.

## OpenSpec Change

[`reconcile-command-surface-and-entry-seams`](../../openspec/changes/reconcile-command-surface-and-entry-seams/proposal.md) now owns these implementation requirements. It modifies existing capability boundaries rather than creating a new production capability:

| Capability | Required outcome |
| --- | --- |
| `commands-reference` | Intent Route Catalog contract and novice-facing `COMMANDS.md` rendering |
| `cli-surface` | Fixed twelve-command inventory, delegated diagnostic pass-through, accurate verification terminology |
| `environment-check` | Normal-versus-recovery routing, actual direct help grammar, offline-first/live-probe disclosure |
| `workflow-inspection` | State/projection observation contract and exact-run routing boundary |
| `playbook-execution` | Catalog-to-classifier/playbook mapping without a second lifecycle controller |
| `image-production` | Active retired terminology cleanup without changing Page Authority evidence/ownership |
| `framework-charter` / `bootstrap-env-guidance` | Locator and new-deck guidance only where the existing contracts require a compatible correction |

Framework source impact is limited to `PPTMAKER_FRAMEWORK/`, `openspec/`, `tests/`, and possibly `tests_e2e/`. MD owns intent and lifecycle choice; JS owns deterministic grammar, diagnostics, and observation/projection behavior; cross-boundary fields remain protocol-owned. Run-bundle impact is `compatible`: no production `deck_*` or `dpt_*` is read, migrated, or modified.

## Implementation Order

1. Add fail-first contract/process tests for catalog schema, closed inventory, safe fallbacks, risk boundaries, exact-run locator behavior, and no persistence.
2. Add test coverage for explicit-change precedence, offline-first foundation, live-probe confirmation, valid delegated diagnostic pass-through, invalid child fail-closed behavior, and both `state` projection modes.
3. Implement the catalog and thin Agent-facing mapping while keeping Controller manifest and owner lifecycle untouched.
4. Correct `ppt_flow` delegation and state/projection reporting; prove authority files remain unchanged during allowed projection refresh.
5. Rewrite `COMMANDS.md`, then reconcile `BOOTSTRAP.md`, script docs, help, main specs, config pointers, and current terminology with actual grammar.
6. Add document-command coherence checks that validate current examples and vocabulary, not merely that a flag appears in `--help`.
7. Run focused process/contract tests, the core tier, affected opt-in tiers, strict OpenSpec validation, and diff checks. No test may call a real provider.

## Acceptance Signals

- The catalog validates its schema, maps every closed public route to a legal discovery entry/fallback, and never becomes persisted state or a runtime dispatcher.
- Explicit change requests reach `classify-change`; resume uses state only for a known exact run; ambiguous work requests go to locator without deck scanning.
- `ppt_flow doctor` preserves valid child `next` data; invalid delegation fails closed.
- Both state renderings expose projection status; no authority artifact changes; status and validation observations stay zero-write.
- `COMMANDS.md` lets a novice state a goal and understand the expected result, timing, and one confirmation boundary without learning implementation mechanics.
- Direct help, parser grammar, current specs/config references, and active documentation agree; no active retired one-shot raw guidance remains.
- Verification vocabulary distinguishes core, focused, sweep, mock E2E, and real E2E; no proposed test triggers a real provider call.

## Risks And Boundaries

- [Catalog silently becomes a second workflow engine] -> limit it to discovery fields and test authority precedence.
- [New docs contradict existing owner contracts] -> preserve current grammar and owner lifecycle; flag a real conflict for discussion instead of overwriting it.
- [Route selection leaks into persistent state] -> test every authority record and projection for absence of `selected_route_id`.
- [Helpful diagnostics become unsafe or vague] -> preserve producer data, fail closed for untrustworthy children, and translate only after the machine contract is intact.
- [A novice surface hides an authorization boundary] -> display one meaningful confirmation/cost boundary while keeping hash and grant mechanics with the owning action.

## Non-Goals

- Do not change Framed/Pure semantics, Style Master lifecycle, Pilot/Expansion/Complete Raw Review state machines, provider authorization, evidence ownership, or one-item generation behavior.
- Do not add `--force`, silent retry, provider fallback, a new generic `ppt work` command, a `PptControl` registry, or a third production CLI.
- Do not infer a run, hand-edit `_generated/`, or read/migrate production `deck_*` / `dpt_*` data.
