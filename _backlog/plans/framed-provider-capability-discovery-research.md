# Research: Framed Provider Capability Discovery

> Status: preparation only | Date: 2026-08-10 | Updated: 2026-08-11 | Owner:
> change **C6** in
> [schema-first-page-image-recovery.md](schema-first-page-image-recovery.md)
>
> Naming note: `standard-v1` and `page-image-workflow-v1` below are quoted
> implementation identifiers, not new vocabulary. The current preset is the
> **Header Overlay Preset**; there is exactly one and it is hardcoded.
>
> This is the narrowest of the three active plans: it answers exactly one
> question — can the configured provider be asked to keep pixels out of a
> region, natively? Read
> [framed-provider-protected-composition.md](framed-provider-protected-composition.md)
> for what depends on the answer, and the route document for where C6 sits in
> the order. Nothing here may be run against a `deck_*` bundle; the fixture
> below exists precisely so that probing never touches production evidence.

## Decision

The current Framed request can express protected geometry **inside its compiled
prompt**, but it does not send a native protected-region, template, or mask
field to the configured image endpoint. This is deterministic implementation
evidence, not evidence that a provider can preserve the header area in pixels.

No paid probe has been run. Do not infer a provider capability from the model
name `gpt-image-2`, from a prompt-only sample, or from an undocumented endpoint.
The repository does not contain an accepted provider endpoint contract for a
native region/mask primitive, and this research did not obtain a primary
official endpoint contract. That fact remains unresolved.

## Current Transport Surface

The selected Framed adapter creates canonical UTF-8 provider input with this
prompt payload: `instruction`, `provider_rendered_content`,
`context_not_to_render`, `protected_geometry`, `visual`, and
`generation_profile`. The protection is therefore prompt content, not a
transport field. [Framed compiler](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/index.mjs:823)

The shared binding layer validates the compiled bytes and their SHA-256 against
the exact raw-plan item before submission; it intentionally treats the adapter
input as opaque. [Request binding](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_provider_request_binding.mjs:78)

The actual `POST .../images/generations` body has exactly these relevant keys:

| Body field | Current value/source | Region or mask semantics? |
| --- | --- | --- |
| `model` | bound generation profile | No |
| `prompt` | exact adapter-compiled UTF-8 JSON | Contains prompt-only `protected_geometry` |
| `n` | `1` | No |
| `size` | fixed `PAGE_IMAGE_REQUEST_SIZE` | Output dimensions only |
| `image` | Style Master data URL | Reference image only |
| `images` | Style Master plus optional identity reference data URLs | Reference images only |
| `image_urls` | same reference-image array | Reference images only |

There is no top-level `mask`, `region`, `layout`, `template`,
`protected_geometry`, or body-safe-region parameter in that body.
[Transport body](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/ppt_flow.mjs:2244)

The present `standard-v1` local geometry is deterministic CSS geometry:
canvas `1000 x 562.5`, protected rectangle `{ x: 40, y: 28, width: 920,
height: 238 }`, and fixed kicker/title/subtitle field boxes.
[Header profile](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/header_overlay.mjs:44)
The compositor puts the provider PNG full-canvas beneath a transparent local
header; it does not clip or erase provider pixels.
[Compositor](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/03-framed-image/internal/framed_render_contract.mjs:161)

## What Can Be Proven

| Evidence type | It can establish | It cannot establish |
| --- | --- | --- |
| Deterministic contract evidence | Current field set; exact prompt bytes; plan/batch/grant/attempt lineage; fixed header geometry; correct raw-plus-composite review binding | Whether rasterized provider text or a key visual subject stays out of the header region |
| Empirical provider-output evidence | Whether a bounded set of actual provider PNGs visibly respected the fixture's avoidance instruction | A general provider guarantee, a native API capability, or future output behavior |

This boundary is required by the route: prompt-only improvement is bounded best
effort, while a native primitive needs both endpoint-contract and bounded-output
evidence. [Framed work package](/Users/bowhead/ai_tool_ppt_maker/_backlog/plans/framed-provider-protected-composition.md)

## Proposed Synthetic Stress Fixture

Prepare one isolated, non-v3 Framed fixture named
`framed-protected-region-standard-v1-stress-01`. This is a fixture definition,
not a newly accepted source grammar or a claim that the following fields are
currently provider-native.

| Fixture fact | Proposed value |
| --- | --- |
| Workflow / profile | `framed` / current `standard-v1` only |
| Fixed protected geometry | Current CSS rectangle `{x:40,y:28,width:920,height:238}`; derived normalized observation rectangle `{x:0.04,y:0.049778,width:0.92,height:0.423111}` |
| Header literals | Kicker `FIXTURE / CITRINE ANCHOR`; title `RESERVED HEADER STRESS`; subtitle `Provider body begins below this band.` |
| Provider body pressure | Four distinct content items: one 2-digit metric, a labeled comparison, a two-line supporting claim, and one callout; all request readable integrated typography |
| Key visual pressure | One clearly bounded non-human industrial object placed with the body, plus an avoidance instruction for the header area |
| Style reference | A fixed, already accepted Style Master selected by the normal workflow; record only its selection digest |
| Forbidden-subject observation | `generic robotic arm` may be recorded visually, but is not a current transport compliance assertion because Framed does not yet carry `subject_restrictions` into its raw contract |

The fixture deliberately combines readable provider body content and a key
subject with a full-width header reservation. It exercises the observed failure
mode without using the broken v3 output as an experiment.

## Rubric And Result Template

Run a bounded set of three one-item submissions only after the selected
hardening contract exists. For each attempt, record the following result
template; `pass` is a visual result, not a transport assertion.

```text
fixture_id:
submission_number:                 # 1..3
run_version / workflow:
task_mandate_sha256:
plan_hash / batch_hash / grant_hash / attempt_sha256:
compiled_provider_input_sha256:
style_master_selection_sha256:
transport_field_set:               # observed field names only; no credentials
native_region_or_mask_contract:    # verified | absent-in-current-transport | unresolved
provider_page_reference:
complete_page_reference:

protected-region result:
  provider_header_literal_present: pass | fail | indeterminate
  readable_provider_body_in_region: pass | fail | indeterminate
  key_subject_in_region: pass | fail | indeterminate
  local_header_legible_in_composite: pass | fail | indeterminate
  forbidden-subject-observation: pass | fail | not-measured
  body-safe-region: not-measured   # no canonical body-safe region exists yet

reviewer: agent visual analysis + human Complete Page Review decision
limitations:                       # e.g. OCR advisory/false-positive note
selected_next_path: prompt-only-best-effort | native-primitive-candidate | repair
```

The empirical pass criterion is: no copied header literal, readable provider
body text, or key subject in the mapped protected rectangle; the local header
remains legible. A `body-safe-region` pass cannot be claimed until the proposed
Framed contract defines one. C6 requires this same distinction and keeps OCR
advisory rather than an automatic acceptance gate.
[C6 work package](framed-provider-protected-composition.md)

## Safe Evidence Path

1. Create a dedicated synthetic run through the normal initializer; never use
   `deck_dark_factory_current/3_versions/v3`, and never hand-edit
   `_generated/`.
2. Run `image2 plan` to compile the exact request and publish the existing
   provider-input inspection. That inspection is the controlled engineering
   copy of the prompt; do not copy prompt text into the Human Navigation Path.
   [Existing inspection path](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/run-bundle/page_image_paths.mjs:37)
3. Let the raw owner create the exact Pilot batch, mandate-bound grant, one
   attempt per `generate`, and immutable provenance. The owner submits at most
   one eligible item per invocation. [Raw owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/image2/page_image_progressive_raw_owner.mjs:1363)
4. Use the owner-published Complete Page Review artifacts for the provider PNG
   and Framed composite. Keep result records to digests, references, and visual
   findings; never put credentials, full provider bodies, or copied raster
   files in `_backlog/`.
5. A result can select only an honest next path: prompt-only bounded
   best-effort, a separately specified native-primitive transport change, or a
   new deterministic body-layout design. It cannot mark v3 accepted.

## Paid-Probe Status

**Prepared, not authorized or appropriate to run now.** The Task Mandate
alignment has landed, so the runtime *can* establish a non-secret Task Mandate
once provider-free planning runs for a specific current version/workflow. The
mandate binds only that version, workflow, and active execution; observation
cannot manufacture it. [State owner](/Users/bowhead/ai_tool_ppt_maker/ppt_maker_harness/scripts/shared/state/state.mjs:1180)

Under the accepted policy, one clear Work Request covers ordinary in-scope
provider cost and does not require per-batch reconfirmation.
[Human-centered control policy](/Users/bowhead/ai_tool_ppt_maker/openspec/policies/human-centered-gates.md:7)
However, this research request authorized investigation and preparation, not a
new synthetic production run or paid provider experiment. No synthetic run has
an active exact plan, Task Mandate, batch grant, or result record. In addition,
the schema definitions (C1/C2), the layout config (C4), and the selected Framed
protected-composition contract (C6) are still pending; the route places
empirical conformance after those land.
[Route document](schema-first-page-image-recovery.md)

The next legal action is therefore to retain this prepared fixture and use it
after the owner creates a dedicated current synthetic run and its active Task
Mandate under an explicit work request for the bounded probe. It must then
retain exact plan/batch/grant/attempt/provenance facts; the Task Mandate removes
repeated routine prompts, not those technical controls.
