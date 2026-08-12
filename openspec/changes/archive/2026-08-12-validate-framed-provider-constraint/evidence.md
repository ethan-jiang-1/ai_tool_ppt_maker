# Implementation Evidence

## Work Request

- Probe-run locator: `deck_framed_provider_constraint_probe_current/3_versions/v1`
- Provider submission limit: `2` distinct one-item raw-page samples.
- Scope statement: newly initialized disposable Framed probe only. C7 and every
  existing production target were excluded.
- Separate Style Master scope: one generated candidate, `candidate-001`, for
  this probe only. Its review and `proceed` promotion were independent of the
  raw-page Work Request.

## Current Binding

- Source receipt locator: `3_versions/v1/_generated/page_image_workflow/receipts/source-receipt.json`
  (`ebfebc65b7adce9c39869ab7dba6e541ccdd1b357a9087aa6a51836e5231d232`).
- Current Style Master selection: `candidate-001`, selection
  `a43d3cc7fe26777d24bc9efb881f8d0c2b46cb946d181bbe3b537eefa84789ab`.
  Its candidate plan, grant, attempt, provenance, and review records are all
  rooted below `1_upstream_raw_material/page-image-style-master-iterations/`.
- Raw plan locator: `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/work-plan.json`
  (`71a5d5778f69bd6a59e237e404bef85a92d7e80060301cd09a03551a06e9006f`).
- Exact batch/grant locators:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/batches/507524f4/batch.json`
  and `.../grant.json`; batch/grant digest
  `507524f4ab11bce6f92f2dd543099930c608b1b6f30e014e7878da7d2d785381` /
  `56ac429ebeacaf297736542ec43ced4afb70fdd07828147ac88778f099242f64`.
- Selected IDs and capacity: `BodyMap`, `BodyRun`; `maximum_submissions: 2`;
  submitted count: `2`; no remaining capacity.
- Observed transport field names for these current requests: `model`, `prompt`,
  `n`, `size`, `image`, `images`, and `image_urls`. No native `region`, `mask`,
  `crop`, or reserved-area field was observed in the current transport.
- Shared protected-composition digest:
  `765b1924ab9d7fc619b710907b89b3ae341c65965d594ae79334581d1550de15`.

## Samples

### `BodyMap`

- Attempt locator:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/attempts/087d868b.json`
  (`087d868baeb3a8eed0edc25cab85b4924911bf12f47ae5cdffca42fdc1089f7a`).
  The preceding submitted attempt was reconciled against the same immutable
  request; no page was resubmitted.
- Provenance locator:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/materializations/b7b7c909/provenance.json`
  (`b7b7c9091c4dfaccb2746ee83fce822d5db055c1a4298ba90ce6cef7c99776ee`).
- Provider-page locator:
  `3_versions/v1/_generated/page_image_workflow/review/complete-page/71a5d577/provider-page/01_BodyMap.png`.
- Production-equivalent composite locator:
  `3_versions/v1/_generated/page_image_workflow/review/complete-page/71a5d577/complete-page/01_BodyMap.png`.
- Page-specific request / protected-composition digests:
  `22b2027fc19a8dba6709f21a00571a2cb577434a2991760b71608b32c25c0f08` /
  `765b1924ab9d7fc619b710907b89b3ae341c65965d594ae79334581d1550de15`.
- Provider body in reserved header: `observed`.
- Key subject in reserved header: `observed`.
- Provider body in body-safe region: `observed`.
- Local header legible in composite: `observed`.

### `BodyRun`

- Attempt locator:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/attempts/c04013e1.json`
  (`c04013e1757e724587c15b93e50ba98889f8f1c5a4c5c5c695d6d7d5af694886`).
- Provenance locator:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/materializations/4114cdeb/provenance.json`
  (`4114cdeb843275056c1a563b270baae888acb05332ee8a78322acc6e86295058`).
- Provider-page locator:
  `3_versions/v1/_generated/page_image_workflow/review/complete-page/71a5d577/provider-page/02_BodyRun.png`.
- Production-equivalent composite locator:
  `3_versions/v1/_generated/page_image_workflow/review/complete-page/71a5d577/complete-page/02_BodyRun.png`.
- Page-specific request / protected-composition digests:
  `26074ef5b52d0bba5462556976aeea164bb17eb17113389906a23aa33a75b19f` /
  `765b1924ab9d7fc619b710907b89b3ae341c65965d594ae79334581d1550de15`.
- Provider body in reserved header: `observed`.
- Key subject in reserved header: `observed`.
- Provider body in body-safe region: `observed`.
- Local header legible in composite: `observed`.

## Review And Scope Isolation

- Complete Page Review locator:
  `1_upstream_raw_material/page-image-workflow-iterations/plans/71a5d577/complete-reviews/8d6b9187.json`
  (`8d6b9187b8b44f5260c183de91ec4867c7933ffb6394b1893b54839f6b50bd8b`).
  Its existing human-owned decision is `repair`; this evidence neither changes
  that decision nor derives a separate acceptance result.
- Every lifecycle locator above is below the authorized disposable probe root.
  C7 and other production runs were neither read nor used as fixtures.
- The repository change inventory was used only to check that this change did
  not modify another target; no other target is named by this evidence.
- The required bundle layout check was run. It reported only missing legacy
  `content_gate` and `visual_gate` fields in the probe's `project-metadata.yaml`.
  No field was hand-written to make the check pass: the present Complete Page
  Review is `repair`, so an approved visual gate would be misleading.

## Bounded Conclusion

For these two current Framed requests, the provider rendered readable body
content and key subjects into the reserved header despite the bound
protected-composition guidance. Both complete composites retained readable local
headers, but their existing Complete Page Review decision is `repair` because
the provider output conflicts with the reserved-header intent.

This is bounded empirical evidence for the two submitted requests and their
current transport only. It does not accept either page, establish a general
provider guarantee, identify a native primitive, or authorize a transport
extension. Official OpenAI documentation endpoints were unavailable to this
environment during the verification attempt (HTTP `403`), so no provider-native
constraint contract was verified. The current bounded-best-effort contract
therefore remains unchanged; any native transport extension requires a separate
follow-up OpenSpec change.
