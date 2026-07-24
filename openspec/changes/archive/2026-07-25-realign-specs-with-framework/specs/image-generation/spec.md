## ADDED Requirements

### Requirement: Whole-page generation identifies the current lineage
Whole-page Image2 generation receipts and produced artifact records SHALL identify `whole-page-image2-v1` and current whole-page producers. They SHALL not emit or accept a retired lineage value or require a compatibility reader.

#### Scenario: Whole-page artifacts are published
- **WHEN** authorized whole-page generation publishes an artifact record
- **THEN** its pipeline lineage is `whole-page-image2-v1`
- **AND** later consumers can validate it without a legacy reader

## MODIFIED Requirements

### Requirement: Stage 2 is implemented inside the framework
Image2 generation SHALL remain an in-framework Node ESM capability under
PPTMAKER_FRAMEWORK/scripts/04-image-production/whole-page, with resolveVendors,
stage2_generate_images.mjs, image_api_client.mjs, and the established submit/poll/download/error
contract. It is the Stage-2 implementation only for a current whole-page-image2-v1 source paired with
image2-only. Unified/public orchestration SHALL verify that source/state pair before stage dispatch,
option validation, credential/style-reference resolution, or writes: image2-only delegates to the
whole-page generator, while either HTML mode delegates HTML Stage 2 and SHALL not import or initialize
the whole-page adapter. A missing, retired, malformed, or state-inconsistent protocol has no Stage-2
fallback and returns the one owner-issued typed next action.

Direct whole-page invocation and public image2-only routes retain IMAGE2_API_KEY, IMAGE2_BASE_URL, and
supported base-url semantics. HTML renderer routes reject provider/base-url/model/style-reference options
before readiness or writes. Missing credentials and provider failures retain secret-safe Image2
diagnostics only when a chargeable current whole-page action is selected. Current content/visual/header
approval, generation-manifest provenance, reviewed-byte preservation, and explicit provider
authorization boundaries remain intact.

#### Scenario: Image2-primary Stage 2 uses whole-page generation
- **WHEN** unified pipeline selects Stage 2 for a consistent image2-only run
- **THEN** it delegates to the public current whole-page generator with existing Image2 resolution and provenance

#### Scenario: HTML Stage 2 uses local renderer
- **WHEN** unified pipeline selects Stage 2 for either HTML mode
- **THEN** it delegates to the HTML renderer
- **AND** does not resolve credentials, style master, provider URL, or whole-page modules

#### Scenario: HTML receives whole-page base-url override
- **WHEN** an HTML public build or preview receives a base-url option
- **THEN** it returns USAGE before renderer/provider readiness or writes

#### Scenario: Unsupported whole-page source has no generator continuation
- **WHEN** a markerless, retired, or state-inconsistent record selects whole-page Stage 2
- **THEN** it stops before credential lookup or generated-path writes
- **AND** it does not reuse a historical provider reader

### Requirement: Modern visual-slot transport is isolated from whole-page generation
Modern Image2 submission SHALL live only behind the visual-slot transport adapter and consume persisted
authorized attempt IDs. It SHALL emit secret-safe typed receipts suitable for reconciliation and SHALL
not change or import the current whole-page generator. Ordinary HTML build/local refresh SHALL initialize
neither modern transport nor a whole-page credential loader. Whole-page Image2 generation remains in its
separate public adapter and is selected only by the explicit current mode/pipeline pair.

#### Scenario: HTML build runs normally
- **WHEN** ordinary HTML build or local refresh runs
- **THEN** no modern transport or provider credential loader is initialized

#### Scenario: Current whole-page generation is isolated
- **WHEN** a consistent image2-only run invokes Stage 2
- **THEN** it uses the whole-page adapter without importing visual-slot request material or attempt state

### Requirement: Contact sheet is in-framework
Contact-sheet production SHALL remain in-framework using make_contact_sheet.mjs and @napi-rs/canvas,
never an external skill. For HTML final-slide delivery/review, orchestration SHALL pass plan-ordered
common verified final-slide entries to the provider-neutral builder that does not understand a private
renderer manifest. For image2-only with whole-page-image2-v1, the current whole-page raw-image
contact-sheet interface and timing remain under _generated/preview and may satisfy only current
whole-page review/completion owners. It is not provider-neutral HTML final-slide evidence.

For canonical html-first-v1, production/review contact-sheet objects and current manifest remain under
_generated/html_production/preview. HTML production SHALL not write the whole-page preview path as
authority. Each HTML sheet entry/receipt retains publication scope, current reset ID, ordered IDs,
final-slide fingerprints/SHAs, composition variants, dimensions/profile, and delivery/review digest.
Only canonical current-reset effective variants may enter authoritative HTML delivery; forced-fallback
variants remain review-only. No migration-preview sheet, projected scratch context, or historical
whole-page contact sheet may satisfy a current target's review or delivery evidence.

#### Scenario: Current whole-page Stage 2 completes
- **WHEN** a current whole-page image-generation batch completes successfully
- **THEN** its ordered raw-image contact sheet remains under _generated/preview
- **AND** it is consumed only by current whole-page owners

#### Scenario: HTML final slides complete
- **WHEN** current effective HTML final slides exist for the ordered plan
- **THEN** the provider-neutral builder publishes the delivery contact sheet under _generated/html_production/preview
- **AND** no whole-page Stage-2 directory or provider interface is required

#### Scenario: Forced-fallback review sheet is requested
- **WHEN** selected pages require fallback review
- **THEN** their forced-fallback objects may appear only in a review-labeled contact sheet and evidence digest
- **AND** that sheet cannot satisfy delivery readiness

#### Scenario: Delivery and visual-review sheets coexist
- **WHEN** both remain fresh after delivery-sheet publication
- **THEN** preview manifest retains separate current references for review and delivery
- **AND** each consumer resolves only its owning slot

#### Scenario: Retired scratch evidence cannot become current
- **WHEN** a caller offers a migration or projected-scratch contact sheet as target evidence
- **THEN** current contact-sheet validation rejects it before review/delivery publication

### Requirement: Raw image artifacts are addressed by stable slide ID
New Stage 2 writes SHALL use <slide_id>.png for raw image output and associate manifest entries with the
formal stable slide ID. The generation fingerprint SHALL cover every semantic generation input but
exclude current position, heading number, slide order, and position-bearing human-view filenames. The
logical Image2 artifact key is (slide_id, image2, raw-render, generation_fingerprint). Current reads
accept only an ID-addressed output whose manifest proves current engine, kind, fingerprint/profile, and
image-byte SHA. Filename guessing or an unrecognized historical manifest does not establish reuse,
currentness, or materialization authority.

#### Scenario: Reorder keeps cache current
- **WHEN** a slide moves position while its prompt, style reference, assets, model, resolution, and generator options remain unchanged
- **THEN** its generation fingerprint is unchanged
- **AND** Stage 2 reuses the manifest-proven ID-addressed raw image without remote rendering

#### Scenario: Position-prefixed file without current proof is stale
- **WHEN** a matching-looking position-prefixed PNG exists but no current manifest entry proves fingerprint and bytes
- **THEN** Stage 2 classifies it as missing or stale rather than current cache
- **AND** normal reuse treats the requested raw render as requiring current evidence or a later authorized rebuild

## RENAMED Requirements

- FROM: `### Requirement: Modern visual-slot transport is isolated from legacy generation`
- TO: `### Requirement: Modern visual-slot transport is isolated from whole-page generation`
