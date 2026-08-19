## Context

See proposal.md. Current submit in `command_support.mjs` hard-codes
`${base}/images/generations`, JSON, and `PAGE_IMAGE_REQUEST_SIZE` (`2000x1125`).
`validateOperation` requires exact keys `route_id`, `model`, `prompt_budget`.
`selectImage2ProviderOperation` copies those into the generation profile.
Architecture `validOperationProfile` mirrors the four keys.

Existing poll: if the JSON response has a task id and no inline image, the same
deadline polls. That is today's default completion.

Legal combos are closed so transport cannot become an open vendor SDK.

## Goals / Non-Goals

**Goals:**

- A profile can declare edits+multipart+native size; mock transport proves the
  POST path, encoding, and size match and a PNG can enter the existing receipt
  owner.
- Generations+JSON+2000x1125 remains the omitted-transport default and an
  explicit legal combo.
- Undeclared combos fail at profile resolve with zero fetch.

**Non-Goals:**

- Scratch-to-PPTX, Packy identifiers, Style Master transport, prompt-budget
  unit changes, Framed header overlay size change.

## Decisions

1. **Transport lives only on `page-image-reference-generation`.** Style Master
   stays generations JSON 2000x1125. Alternative: both operations — rejected;
   BUG-090 is page raw routing.

2. **Omitted transport equals the current default vector.** Explicitly declaring
   that same vector is allowed and digest-identical after normalize.
   Alternative: require every confirmed profile to write transport — rejected;
   that would break existing confirmed sources.

3. **Closed combos: generations+json XOR edits+multipart.** Width/height positive
   integers divisible by `dimension_multiple` ∈ {1,16}. `completion` is `sync`
   (no poll; task-id response is existing known-failure) or `async-poll`
   (today's poll). Default completion is `async-poll`.

4. **Multipart body reuses the already-bound Style Master PNG as `image`.**
   Edits without a selected Style Master still hard-stops through the existing
   immutable Style Master reference check. No blank-canvas invention.

5. **Submit reads the bound generation-profile transport, never rereads YAML.**
   Matches the current "submit uses already bound model" rule.

## Risks / Trade-offs

| Risk | Mitigation |
|---|---|
| Framed overlay assumes 2000x1125 request | Do not change Framed final PNG contract; Pure keeps native bytes |
| Multipart boundary leaks | Let fetch set Content-Type; do not log body |
| Architecture snapshots omit transport | Default-fill in resolved operation so one snapshot shape |

## Migration Plan

Existing confirmed profiles without `transport` keep working. Declaring a new
vector changes `profile_sha256` and forces the existing rebuild path.

## Open Questions

None. Combo set and default vector are locked by the four-change plan.
