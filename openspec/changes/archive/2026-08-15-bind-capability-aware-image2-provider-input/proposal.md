## Why

Page Image adapters currently serialize provider-useful semantics together with local lineage metadata and authorize that oversized JSON as the exact provider prompt. Real Image2 routes expose different prompt budgets, while the Harness records neither an owner-declared route capability nor the unit needed to prove that the exact submitted bytes fit; a model alias or one observed failure cannot safely supply those facts.

This change converges on one provider-bytes authority: each Image2 operation compiles compact exact bytes under an explicit non-secret capability profile, validates those final bytes against that profile before any provider work, and binds the same profile and bytes through plan, authorization, attempt, and transport. It follows `openspec/policies/human-centered-gates.md`, `openspec/policies/agent-assistance-and-control.md`, and `openspec/policies/simple-reliable-control.md`: the human owns the consequential route-capability declaration, while the Agent and JS owners perform deterministic resolution, counting, stale detection, repair guidance, and same-check replay without repeated confirmation.

## What Changes

- **BREAKING**: add one canonical, owner-declared `image2-provider-profile.yaml` source under the Run Bundle visual-style package, with matching version override semantics, for non-secret endpoint/route/model identity and operation-specific prompt budgets. Missing, unknown, malformed, or owner-unconfirmed profiles hard-stop provider-facing planning; they are never inferred from credentials, aliases, State, inspection, or remote failures.
- Seed new Run Bundles with a neutral, non-authorizing profile template and recognize the canonical backbone/override locations. Existing production Run Bundles remain byte-preserved and require the Agent to obtain the owner's route-capability facts and repair this source before provider work; the Harness performs no automatic migration.
- Bind Style Master text generation and Page Image reference generation to operation-specific entries from the same resolved profile source. Runtime initialization must match the plan-bound profile identity to the non-secret environment identity while credentials and base URL remain in `.env`.
- Replace Pure and Framed provider-input shapes with workflow-specific compact canonical JSON. The exact compact UTF-8 serialization becomes `compiled_provider_input.utf8`, its SHA-256 remains the sole provider-input digest, and transport continues to submit those bytes opaquely. Local raw contracts, generation profiles, presentation provenance, paths, and lineage digests remain local owners rather than prompt fields.
- Preserve Pure semantic content and Framed's exact exclusive-header instruction, subject restrictions, protected composition, shared design-system text, provider-rendered content, visual clauses, and identity role clause without summary or truncation.
- Keep the existing 32,768 UTF-8-byte compiler safety bound, then enforce the selected profile's positive data-driven prompt budget against the final canonical bytes using a closed exact unit (`unicode-code-points`, `utf16-code-units`, or `utf8-bytes`). Budget failure occurs before plan publication and is revalidated before authorization, provider initialization, grant, and attempt claim.
- Bind the selected capability-profile digest, identity, operation, limit, and unit through Style Master/Page Image generation profiles, immutable plans, authorization scopes, derived inspection, and provider request/attempt lineage. Any profile or compiler-shape change makes prior plans stale; historical evidence remains immutable and only the existing fresh-plan / Generated Image Rebuild route can continue.
- Extend production-schema declarations and static architecture guards for the source, operation-specific generation-profile facts, compact request shapes, budget binding, and clean cutover. Tests use 4,000, 16,000, and a third arbitrary limit plus ASCII/CJK/emoji fixtures to prove the behavior is data-driven rather than provider-special-cased.
- Keep existing direct CLI envelope fields and emission rules. Capability owners supply bounded, typed profile/budget/runtime/stale facts, while `cli-surface` classifies and emits their secret-safe source, environment, and existing lifecycle-owner recovery through the current boundary; this change adds no probe, retry, fallback, silent truncation, alternate provider route, or new human approval.

The shortest control loop is: resolved owner-declared profile source -> one shared exact-unit evaluator over final compiled bytes -> earliest profile/source or budget hard-stop -> Agent repairs the owning source/runtime identity -> rerun the same provider-free plan checkpoint. Profile absence protects attributable route capability; profile mismatch protects exact runtime identity; over-budget input protects authorization integrity. None has a waiver or force path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `run-bundle-layout`: reserve the canonical provider-capability source and matching version override, and distinguish it from secrets, State, lifecycle records, and derived inspection.
- `run-bundle-management`: seed and validate a neutral non-authorizing source template without migrating existing Run Bundles or creating lifecycle authority.
- `style-master-generation`: resolve, budget-check, and lifecycle-bind the Style Master operation profile before planning or provider work.
- `image-generation`: make workflow-specific compact bytes the sole Page Image provider-input authority and bind operation-profile budget through planning, authorization, attempts, transport, invalidation, and cutover recovery.
- `production-schema-conformance`: declare and statically guard the profile source/bindings, compact request shapes, operation budgets, and absence of parallel prompt authority.
- `environment-check`: require and safely report the non-secret runtime profile identity for Image2 readiness while preserving the bounded, connectivity-only meaning of live probes.
- `cli-surface`: classify profile-source, runtime-identity, final-budget, and stale compiler/profile failures into existing secret-safe categories and owner actions without changing commands, envelope fields, or action vocabulary.
- `harness-charter`: keep active setup and diagnostic-recovery guidance clear that declared capability is a source/environment prerequisite, while live diagnosis remains connectivity-only and no new authorization is created.
- `playbook-execution`: direct the existing visual-system/controller route to obtain the one Deck Author capability declaration and consume the producer-issued repair without adding a Controller node, gate, or parallel recovery path.
- `harness-script-layout`: register and guard the shared provider-profile/budget seam so Style Master and Page Image consume one resolver/evaluator while pre-install setup retains its import-safe boundary.

## Impact

- Harness source: `ppt_maker_harness/scripts/shared/run-bundle/`, `scripts/shared/image2/`, `scripts/02-visual-system/`, `scripts/03-framed-image/`, `scripts/04-pure-image/`, `scripts/00-setup/`, `scripts/ppt_flow.mjs`, `scripts/contracts/`, production schema definitions, and applicable Charter/Controller/reference guidance.
- Verification: focused and E2E tests under `tests/` and `tests_e2e/`, plus OpenSpec main-spec sync and strict validation. No new dependency or provider call is required for validation.
- Control owner: capability JS owns parsing, canonicalization, exact-unit counting, binding, stale facts, and provider preflight; `cli-surface` owns direct diagnostic classification/emission; MD/Agent guidance owns obtaining the one genuinely new owner declaration and executing the existing recovery route. No second MD, consumer, or inspection authority is introduced.
- Run-bundle contract impact: `migration` by clean admission cutover, not data rewrite. Existing source and immutable evidence remain unchanged; a Bundle without a valid profile source receives one repair action, and any former compiler/profile plan is historical-only until a fresh exact plan and authorization are created.
- Production data: no `deck_*` or `dpt_*` directory is read, modified, migrated, or used as a fixture by this change. Real generation and capability probing remain outside implementation verification unless separately authorized by the owner.
