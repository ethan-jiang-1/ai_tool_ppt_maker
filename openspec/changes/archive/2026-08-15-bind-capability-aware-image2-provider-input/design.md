## Context

See [proposal.md](proposal.md) for motivation. The current Page Image adapters already own canonical provider-input compilation and the transport already submits `compiled_provider_input.utf8` without rewriting it, but the compiled JSON still contains local `generation_profile` and presentation-lineage facts. The fixed Page Image 32,768 UTF-8-byte ceiling is a Harness compiler safety bound. Style Master separately retains a fixed 4,000-byte brief limit introduced before the Harness had a route-capability contract; that number is an old provider assumption, not a second permanent compiler invariant.

Current lifecycle identities already close over generation-profile digests:

- Style Master plan, grant, request, attempt, provenance, and selection bind `candidate_generation_profile_sha256`.
- Page Image raw plans bind the canonical target generation profile as `provider_profile_sha256` and each item binds `generation_profile_sha256`; authorization scopes and provider request hashes close over those facts.
- Selected-adapter request wrappers contain the local raw contract, generation profile, and compiled bytes, while the actual provider body uses only the bound model, prompt bytes, media references, and transport fields.

The design must preserve those exact authorization and uncertain-submission rules. It must also preserve `00-setup`'s zero-static-npm-dependency entry: a Run Bundle YAML resolver cannot become a top-level environment-check dependency.

## Goals / Non-Goals

**Goals:**

- Establish one non-secret Run Bundle source for the endpoint/route/model capability facts that a human owner can actually confirm.
- Compile one workflow-specific compact Page Image prompt and make it the only authorized and submitted prompt bytes.
- Replace provider-specific prompt-limit constants with one operation-profile budget evaluator over the final exact prompt, while retaining a separate 32,768 UTF-8-byte Harness safety ceiling.
- Reuse current generation-profile, plan, authorization, request, attempt, invalidation, and stale-plan closures instead of duplicating capability fields across every durable record.
- Give missing profile, runtime mismatch, over-budget input, and compiler cutover one bounded fail-closed recovery path each without provider work or production-data migration.

**Non-Goals:**

- Discover, probe, benchmark, or infer provider capability from an API key, model alias, endpoint response, error message, request ID, or successful smoke request.
- Guarantee that a provider honors content, typography, identity, or Framed composition guidance; Complete Page Review remains the pixel-quality authority.
- Automatically summarize, compress, truncate, split, or reroute a prompt, or introduce retry/failover/provider fallback.
- Persist credentials, base URLs, provider response bodies, raw prompt prose in Human Navigation, or a second capability ledger in State.
- Change Task Mandate semantics, public Image2 command forms, CLI envelope fields/action vocabulary, provider deadlines, image media contracts, or Framed local composition.
- Read, modify, migrate, or use a production `deck_*` or `dpt_*` directory as a test fixture.

## Decisions

### 1. One Run Bundle source owns declared Image2 capability

**Owner:** Run-Bundle Layout owns the path; shared Image2 JS owns parsing and the immutable resolved binding; the Deck Author owns the declaration's truth; MD/Agent guidance obtains that one consequential declaration and performs the source edit.

Reserve these override-first source locations:

- `2_backbone/visual-style/image2-provider-profile.yaml`
- `3_versions/vN/overrides/visual-style/image2-provider-profile.yaml`

The file uses one exact unversioned source shape. A newly initialized Bundle receives the following neutral, non-authorizing template:

```yaml
schema: pptmaker-image2-provider-profile
profile_id: null
endpoint_profile: null
owner_declaration:
  authority: deck-author
  status: pending
operations:
  style-master-text-generation: null
  page-image-reference-generation: null
```

A selectable source has the same outer keys, `status: confirmed`, non-empty lower-kebab `profile_id` and `endpoint_profile`, and exactly these two operation entries. Each confirmed operation entry contains exactly:

```yaml
route_id: owner-declared-lower-kebab-id
model: provider-model-identifier
prompt_budget:
  limit: 16000
  unit: unicode-code-points
```

The operation mapping key is its operation identity. The closed operations are:

- `style-master-text-generation`: the text-only Style Master image request.
- `page-image-reference-generation`: the Page Image request containing Style Master and optional identity reference media.

`limit` is any positive safe integer; no value has special semantics. `unit` is exactly one of `unicode-code-points`, `utf16-code-units`, or `utf8-bytes`. `route_id` is operation-specific because one endpoint/credential profile may dispatch the two request shapes differently. `model` remains an explicit provider request field rather than being inferred from an alias constant.

The parser accepts only the exact pending template or a complete confirmed profile. Exact pending input is recognizable only so the owner can receive its bounded source-repair result; it produces no resolved binding or digest. Mixed null/non-null facts, an unknown operation, an extra key, YAML alias/tag/merge, a symlink/unconfined source, malformed UTF-8, unknown unit, non-positive limit, or unconfirmed configured facts fail closed. It resolves the version override first and treats an invalid present override as selected-and-invalid rather than silently falling back to backbone, following the established Page Design System confinement pattern.

The resolved canonical binding is a frozen path-free object containing the source schema facts plus `profile_sha256`, computed over canonical normalized JSON without a filesystem path or selection origin. Paths may appear only in bounded source diagnostics. The profile source is not State, a receipt, a grant, inspection authority, or a lifecycle record.

Alternatives rejected:

- `.env` as capability authority: it mixes secrets/runtime selection with reviewable deck configuration and prevents provider-free planning.
- Model or base URL as the key: either may route to multiple concrete capabilities and neither identifies operation-specific behavior.
- A Harness-owned table of 4K/16K routes: capability facts are external and owner-declared; hardcoded tables drift and reintroduce inference.
- A profile per adapter: Pure and Framed use the same Page Image operation while keeping different compilers; duplicating profiles would create avoidable authority conflicts.

### 2. One import-safe runtime identity joins source to credentials

**Owner:** `.env` owns credential/base-URL/runtime selection; the shared credential initializer owns non-secret runtime matching; the source resolver remains profile fact authority.

Add `IMAGE2_PROVIDER_PROFILE_ID` as the only required non-secret runtime capability identity. The environment owner declares that the resolved `IMAGE2_BASE_URL` and `IMAGE2_API_KEY` pair realizes that exact confirmed profile. The initializer validates a bounded lower-kebab value and requires exact equality with the plan-bound `profile_id`; it does not derive endpoint, token group, route, or capability from the secret or URL.

The raw-generation environment check verifies that `IMAGE2_PROVIDER_PROFILE_ID` is present and syntactically valid alongside the existing key and base URL checks. The installed exact-run doctor also resolves the selected Run Bundle profile and checks equality; direct pre-install env-check has no Run Bundle scope and therefore reports only syntax/presence without claiming source/profile equality. `--smoke` and `--probe-vendors` retain connectivity-only meaning and cannot confirm a route budget.

Implement the identifier grammar in a zero-dependency import-safe helper. The YAML source resolver may use the installed `yaml` package only in the normal runtime path. Direct `00-setup/env-check.mjs` therefore remains runnable before `npm install` and does not import the profile parser or a production adapter.

Alternatives rejected:

- Put route/model/budget JSON into environment variables: it creates a second profile authority and makes provider-free plan identity depend on dotenv.
- Compare only normalized base URL: one URL can host multiple groups/routes, and the URL does not prove credential routing.
- Validate source/profile equality in doctor: doctor has no exact Run Bundle or version authority and would become a competing run selector.

### 3. One evaluator measures the final exact prompt

**Owner:** shared Image2 JS owns the pure evaluator; Style Master and the selected Page Image adapter own when their final bytes enter it.

The evaluator accepts the final canonical prompt UTF-8 string/bytes and one validated operation budget. It first enforces the shared 32,768 UTF-8-byte Harness safety ceiling, then computes the selected remote budget using exactly:

- `utf8-bytes`: byte length of the final exact UTF-8 serialization.
- `utf16-code-units`: JavaScript string length after fatal UTF-8 decoding of those bytes.
- `unicode-code-points`: the number of values produced by ECMAScript string iteration (`Array.from(decoded).length`) after the same fatal decode; a valid surrogate pair counts once.

An input is admitted when `measured <= limit`. The evaluator measures the exact `prompt` string, not source text, design-system text, an intermediate object, the outer HTTP JSON body, or an estimate. It returns a path-free frozen projection containing operation, limit, unit, and measured value for local binding/inspection. It never truncates or rewrites bytes.

The former fixed Style Master 4,000-byte check is removed. Style Master keeps its authored-intent source limit and compact semantic compiler, but its final provider brief now uses the same 32,768-byte safety ceiling plus the selected `style-master-text-generation` budget. Page Image keeps the existing 32,768-byte safety ceiling plus `page-image-reference-generation` budget. This removes a provider-specific constant rather than layering another limit above it.

Tests use 4,000, 16,000, and a third arbitrary limit such as 12,347 as ordinary profile data. ASCII, CJK, BMP/non-BMP emoji, and exact boundary/one-over fixtures prove all three algorithms.

Alternatives rejected:

- A global `4000` or `16000`: neither is a proven universal Image2 contract.
- Token counting: no tokenizer or provider token contract is declared, and adding one would be inference.
- Counting design-system or identity fields separately: only the final serialized prompt is submitted and authorized.

### 4. Capability facts enter existing generation-profile closures

**Owner:** shared Style Master/Page Image generation-profile builders own normalized local projections; lifecycle owners continue to own durable digest bindings.

For each operation, derive one path-free operation capability projection containing:

- `profile_id` and full `profile_sha256`;
- `endpoint_profile`, operation-specific `route_id`, `operation`, and `model`;
- exact `prompt_budget { limit, unit }`.

Embed that projection in the existing Style Master or Page Image generation profile. Model comes from the selected operation entry. Canonical generation-profile digests therefore change when profile ID, endpoint profile, route, model, operation, limit, unit, or owner-confirmed profile content changes.

Reuse existing digest closure rather than copying the same fields into every record:

- Style Master's `candidate_generation_profile_sha256` binds the operation profile through plan, grant, provider request, attempt, generated provenance, selection, and stale-selection evaluation.
- Page Image's canonical target generation profile binds the operation profile; its existing `provider_profile_sha256`, item `generation_profile_sha256`, complete provider-input binding map, authorization-scope hash, provider request hash, and attempt lineage transitively bind the exact capability digest.
- Provider request inspection and per-page `image2-request` derived artifacts project the operation identity, budget, measured value, and relevant digests for audit, but remain non-authoritative.

Runtime validators accept structurally valid historical record digests for audit and direct-record reconciliation, while current admission passes the currently resolved expected generation profile explicitly. They no longer compare every historical Style Master record to one process-global fixed profile constant. This preserves immutable history without making an old profile current.

No capability field is added to State. No separate `capability_authorization` record is created. The existing exact plan/grant/attempt closure remains the sole lifecycle authority.

Alternatives rejected:

- Add profile fields to every grant and attempt: existing canonical parent/request digests already bind them; duplication increases drift and cutover surface.
- Bind only `model`: route and budget changes could reuse authorization incorrectly.
- Store selected profile in inspection only: inspection is derived and cannot authorize provider work.

### 5. Adapter compilers emit semantic-only exact prompts

**Owner:** Pure and Framed JS adapters independently own their prompt schemas; shared runtime and submitter remain opaque consumers.

Pure compiles exactly these top-level canonical JSON fields:

```text
schema
slide_id
instruction
design_system
provider_rendered_content
visual
page_presentation: { profile }
```

`page_presentation.profile` is the validated semantic typography/colour/layout projection only. `page_class`, `profile_id`, source provenance, `binding_sha256`, and other lineage stay in the raw contract/Core/generation facts.

Framed compiles exactly:

```text
schema
slide_id
instruction
design_system
provider_rendered_content
subject_restrictions
protected_composition
visual
```

Its `instruction` remains byte-for-byte `FRAMED_EXCLUSIVE_HEADER_RESERVATION_INSTRUCTION`. `protected_composition` remains the exact normalized `reserved_header`/`body_safe` semantic object without provenance, and the request retains parser-owned subject restrictions. Framed does not copy Pure's page-presentation shape.

Both `visual` mappings retain recipe, composition, motifs, nullable relationship, and the existing six-field semantic identity projection with exact `role_clause`. Both retain exact shared Page Design System and provider-rendered content. They do not summarize, trim, or truncate any owning source text.

Neither prompt contains `generation_profile`, raw contract, source origin/path, provenance, authorization/lifecycle facts, or structured fields named `sha256`, `digest`, or `binding_sha256`. Validators enforce exact allowed shapes and known nested semantic shapes rather than scanning opaque authored prose for forbidden words.

The resulting canonical UTF-8 serialization directly becomes `compiled_provider_input.utf8`; its SHA-256 remains the one compiled provider-input digest. The selected-adapter request wrapper may continue to hold raw contract and generation profile locally, but transport sets `body.prompt` to those exact compiled bytes, takes model from the bound generation profile, and performs no projection/recompilation. Reference images remain separate transport fields.

Alternatives rejected:

- Keep the old full compiled input for authorization and derive a compact submit prompt: two byte authorities can drift and would authorize bytes other than those sent.
- Make a shared Pure/Framed compiler: their presentation semantics and Framed reservation invariants are intentionally different.
- Remove Pure presentation semantics entirely: typography/colour/layout guidance is provider-useful even though its lineage metadata is not.

### 6. Reuse existing checkpoints and preserve attempt ordering

**Owner:** selected adapters and Style Master lifecycle own current-input revalidation; shared raw owner owns attempt CAS; credential/transport initialization owns remote setup.

Use one resolver/evaluator at each existing authority boundary:

1. **Plan publication:** resolve the confirmed source profile, construct the operation generation profile, compile final bytes, enforce both bounds, and only then publish an immutable plan or derived request tree.
2. **Authorization/grant:** rebuild current source/profile/compiler facts, load only the non-secret runtime profile ID, and exact-match the supplied plan and `profile_id` before creating or replaying its grant. A changed profile, newly over-budget prompt, or mismatched runtime selector cannot receive a grant. Authorization remains network-free and does not require an API key or base URL.
3. **Generate preflight:** before provider initialization or a new attempt write, repeat the source/profile/compiler/budget/runtime-ID check and exact-match plan, request, and profile digest; then resolve credential/base-URL readiness without contacting the provider.
4. **Provider initialization:** only after the pure preflight passes, expose the already resolved credential pair to transport using existing precedence. Page Image reuses its existing progressive `preflight` seam. Style Master adds the same pure profile/budget/runtime preflight before its existing `claimed` CAS; its credential initialization remains after `claimed`, preserving resumable pre-submit discipline while the runtime identity has already matched before the grant and claim.
5. **Submit:** revalidate the opaque request/request hash and send exact prompt/model/reference fields. It does not reread YAML, inspect derived files, or change prompt bytes.

Page Image authorization gains a pure non-secret runtime-selector preflight before grant publication, while its raw owner already calls the generate `preflight` before persisting a newly synthesized `claimed` attempt. The adapter-provided generate preflight performs profile/runtime identity and credential readiness before that write. Style Master authorization performs the same selector match before its grant; generation repeats it before claim. Credential initialization remains after the Style Master claim, so credential failure is still a resumable claimed attempt and no post-submit uncertainty rule changes.

Budget/profile failure is local deterministic admission failure, never a remote `known_failure`, and writes no grant/attempt/provider request. A failure after `submitted` retains the existing known-versus-uncertain provider outcome classification; capability checks do not reinterpret it.

### 7. Gate posture and recovery stay short

This design follows the three control policies referenced by the proposal:

| Condition | Outcome | Protected invariant | One nearest legal action |
| --- | --- | --- | --- |
| Pending/missing/malformed/unconfirmed source profile | `hard-stop` | Provider route capability and authorization attribution are knowable and owner-declared | Obtain the Deck Author's route facts, repair the canonical profile source, rerun the same provider-free plan |
| Missing/malformed/mismatched runtime profile ID | `hard-stop` | The actual credential/endpoint environment matches the plan-bound profile before authorization | Repair `IMAGE2_PROVIDER_PROFILE_ID` or the owning environment/profile selection, rerun the same authorize or generate checkpoint |
| Final exact prompt exceeds safety or selected operation budget | `hard-stop` | Authorized bytes are locally safe and declared compatible with the selected route | Repair the owning content/profile configuration, then rerun the same plan checkpoint; no automatic route/content change |
| Valid profile/compiler drift makes an old plan stale | `guide` | Current work uses one exact plan/profile/compiler identity | Preserve history and run the existing fresh-plan / Generated Image Rebuild path under the Task Mandate |
| Valid current facts | no new gate | Existing Task Mandate and lifecycle controls remain sufficient | Continue ordinary plan/authorize/generate/review work |

There is no `confirm` continuation for an identity/integrity failure and no force/waiver. The human is involved only to supply genuinely unknown route capability or choose a consequential content/route change; the Agent performs all parsing, measurement, stale classification, source-impact explanation, and normal rebuild mechanics.

The new layer is net simplifying: it removes full metadata from prompts, fixed model aliases in generation profiles, the fixed Style Master 4K branch, and any need for transport-time projection. It adds one source resolver and one evaluator reused by both operation families, with no state, retry, fallback, or controller branch.

### 8. Clean compiler/profile cutover preserves immutable evidence

**Owner:** adapter stored-plan preflight and existing Style Master/progressive lifecycle owners.

Do not patch or migrate a stored adapter plan, immutable plan, grant, attempt, selection, review, provider bytes, or `_generated/` artifact. After a valid profile source exists:

- Recompilation changes every Page Image compiled-input digest because compact canonical JSON removes local metadata; the normal exact expected-plan comparison marks old raw plans stale before a batch, grant, attempt, or submit.
- The stored adapter projection keeps treating its generation-profile value as locally bound canonical data while current admission compares its digest and complete expected plan against freshly resolved current facts. A former full generation profile therefore fails the ordinary expected-plan comparison; no former-profile schema, parser, normalizer, or compatibility branch is added.
- Existing progressive immutable plans need no new legacy prompt reader because they store exact digests rather than prompt prose. Current adapter recomputation supplies a different expected plan, so new batch/grant/attempt work is blocked. A genuinely unresolved already-submitted attempt retains only its exact existing reconciliation path; otherwise the normal successor head CAS preserves the predecessor hash.
- Style Master recomputation supplies the selected dynamic generation-profile digest. A former fixed-profile plan or selection becomes stale and follows the existing successor-plan/selection path; an unresolved submitted attempt retains the existing abandonment requirement.

The currently declared narrow historical bridge for an older progressive binding omission remains limited to its existing reconciliation/head-lineage purpose. This change does not add a profile/prompt parser to that bridge or make any former plan eligible for provider work. New compiler drift is handled through current expected-plan mismatch, avoiding another compatibility schema or legacy reader.

Missing profile is the earliest independent prerequisite for existing Bundles. The owner first returns profile repair; after repair, the same checkpoint reports stale compiler/profile work and the Agent fresh-plans. Each response has one root cause and one action, rather than a cascade.

Rollback is code-only before new current plans are published. Once new-profile plans exist, an old runtime is expected to reject them; recovery is roll-forward to the matching Harness and fresh-plan path, not record rewriting or source downgrade.

### 9. Schema declarations and guards describe, but do not own, runtime

Update Run-Bundle tree/whitelists/seeds, production serialization inventory, applicable layout/generation/request stage definitions, and architecture checks to declare:

- the profile source and local resolved binding;
- the two closed operations and budget units;
- generation-profile capability projection and digest closure;
- Pure and Framed compact request exact shapes;
- inspection's non-authoritative measured-budget projection;
- runtime-profile identity as environment configuration, not source or State;
- absence of a second prompt authority or transport compiler.

Static conformance uses synthetic data and validates that request declarations exclude local lineage while retaining workflow-specific semantics. A negative architecture control proves transport sends `compiled_provider_input.utf8` and does not derive prompt bytes. Data-driven tests with a third arbitrary limit are the guard against 4K/16K special branches. These checks remain provider-free and do not run during production startup.

The shared profile resolver and exact-unit evaluator are one registered public
shared Image2 seam because both Style Master and Page Image consume them. The
architecture guard admits their declared import direction and rejects a second
resolver, adapter-local budget implementation, transport-side compilation, or
pre-install `00-setup` dependency on YAML/profile parsing. This is a shared
deterministic capability, not a Controller, State, or second profile authority.

Direct CLI failures continue through the existing envelope and action
vocabulary, but their classification and emitted recovery remain a
`cli-surface` producer contract. The `cli-surface` delta therefore requires:

- invalid selected profile sources use `source_validation` / `edit_source` and
  project a source locator only when the resolver supplies one exact safe
  owner locator;
- an absent, malformed, or plan-mismatched runtime profile ID uses
  `environment` / `repair_environment`;
- final-prompt budget overflow uses bounded `source_validation` /
  `edit_source`, includes only safe profile/operation/measurement facts, and
  omits a speculative source locator; and
- valid compiler/profile staleness retains `artifact` plus the existing Style
  Master successor or Page Image fresh-plan/rebuild owner action, while an
  unresolved submitted attempt keeps its existing reconciliation or
  abandonment precedence.

These diagnostics do not print prompt text, source prose, credential/base URL,
provider body, or stack, and add no envelope field, action, retry, waiver, or
fallback. `node-specification` needs no delta because Controller consumption
remains the existing generic producer-action handoff and gains no branch or
schema.

Active Charter/setup/reference guidance names the profile as a non-secret
source/environment prerequisite: the Deck Author supplies its one confirmed
capability declaration; the Agent records it only in the selected profile
source and matching runtime selector; exact provider-free planning then
continues through the existing owners. The `create-deck` Controller places that
conversation within its existing visual-system source work and reuses the
producer-issued diagnostic handoff for repair. It adds no node, manifest entry,
Task Mandate, authorization, confirmation, or recovery table; smoke remains
connectivity-only.

### 10. Validation strategy

**Unit coverage is required** for the confined pending/confirmed YAML resolver, exact source shape, operation selection, canonical digests, runtime-ID grammar, all three count units, exact/one-over boundaries, arbitrary limits, dynamic Style Master/Page Image generation profiles, Pure/Framed compact shapes, forbidden lineage fields, exact Framed instruction, and local safety ceiling.

**Integration coverage is required** for provider-free plan publication, authorization, progressive preflight, Style Master preclaim preflight, stale profile/compiler recovery, invalid override behavior, environment profile mismatch, and historical/unresolved-attempt preservation. Tests assert no plan/grant/attempt/provider call at each precondition failure and exact replay after a same-owner repair.

**Mock E2E coverage is required** through the public CLI for at least one Pure and one Framed Page Image request plus Style Master generation. The mock server asserts the exact submitted prompt equals the authorized compact bytes, the selected operation model is used, reference media remains separate, and no prompt metadata leaks. No real provider is called.

The production-schema conformance sweep, focused tests, `npm test`, `npm run test:sweep`, and OpenSpec strict validation close repository verification. Provider-free measurement of a named production deck is a separate run-bundle operation and occurs only when the user explicitly authorizes that deck path; it is not a Harness test fixture or a prerequisite for writing implementation code.

## Risks / Trade-offs

- [An owner declares an inaccurate route budget] -> The Harness can prove only declared local attribution, not remote truth. The source is visibly owner-confirmed, smoke remains qualified, and Complete Page Review/provider outcomes do not silently rewrite it.
- [The same profile ID is paired with a different secret or base URL] -> Generate requires the environment's explicit ID but cannot inspect secret routing. The environment owner must correct the declaration; no alias/URL inference or fallback hides the mismatch.
- [A compact prompt still exceeds a 4K route] -> It fails before paid work with exact measured/limit/unit evidence. The change deliberately does not promise that a 4,215-character design system fits a 4K profile.
- [Pure's semantic presentation profile remains large] -> It is provider-useful and intentionally retained. A future reduction would require evidence and a separate contract decision, not transport trimming.
- [Dynamic profiles make formerly accepted Style Masters stale] -> This is the intended attribution cutover. Historical candidate bytes and decisions remain immutable; the current owner runs the normal successor review/selection path.
- [Existing Bundles initially cannot plan provider work] -> The pending/missing profile hard-stop is deliberate because guessing would authorize the wrong capability. The diagnostic names one source repair and does not mutate production data.
- [Counting semantics differ from a provider's undocumented implementation] -> The profile records the owner-confirmed unit. Tests lock local behavior; a corrected unit/limit changes the profile digest and forces fresh authorization rather than reinterpretation.
- [Static guard and runtime parser drift] -> Both consume the declared closed vocabulary, while negative synthetic conformance tests detect missing fields/operations and transport-side prompt derivation.

## Migration Plan

1. Implement the profile source/parser, neutral seed, exact-unit evaluator, and negative tests first. They are provider-free and create no lifecycle authority.
2. Make Style Master and Page Image generation-profile builders consume their operation entry; update schemas/validators so current admission receives an expected dynamic profile while historical records retain internal digest consistency.
3. Cut both adapters to compact canonical prompts and update their exact validators, derived inspection, schema declarations, and transport exact-byte tests in the same change.
4. Add authorization/generate revalidation and runtime profile-ID matching at the existing preflight seams; preserve current claim/submitted ordering and credential resolution.
5. Add stale compiler/profile and unresolved-attempt tests, static conformance guards, Controller/reference guidance, mock CLI E2E, full regression, sweep, and strict OpenSpec validation.
6. Sync accepted delta specs to main specs and archive only after implementation and repository verification complete. Do not archive merely because code compiles.
7. For later Run Bundle use, the Deck Author supplies one confirmed profile and matching `IMAGE2_PROVIDER_PROFILE_ID`; the Agent writes the owner source/environment through normal controls and reruns fresh planning. No implementation step edits an existing production Bundle.

If rollback is required before step 6 creates new current plans, revert the Harness change atomically. After new-format plans exist, restore/roll forward the matching Harness; do not downgrade, patch, delete, or translate immutable records to make an older compiler accept them.
