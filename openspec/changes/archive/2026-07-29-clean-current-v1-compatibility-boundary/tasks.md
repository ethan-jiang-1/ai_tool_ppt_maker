## 1. Establish the read-only observation regression boundary

- [x] 1.1 [workflow-inspection] Extend shared workflow fixtures to create exact CURRENT v1 and selected v2 Framed/Pure source-state pairs with independently controlled v1 and v2 receipts; capture complete temporary run-bundle trees before observation without using deck_* production data.
- [x] 1.2 [workflow-inspection] Add focused inspection coverage proving an absent or stale CURRENT v1 source receipt returns its existing owner action and remains absent, while hybrid marker/state input still short-circuits to its existing hard-stop.
- [x] 1.3 [workflow-inspection] Add public-process regression coverage for ppt_flow status and ordinary ppt_flow state: workflow-selection-pending, selected Framed, and selected Pure observations preserve every state/metadata/history/generated file, preserve v2 receipt bytes, create no v1 receipt, and make no provider call.
- [x] 1.4 [workflow-inspection] Refactor ppt_flow controller-context construction, status enrichment, and ordinary state projection to obtain one marker-first read-only workflow checkpoint before building the resume card; derive slide-source readiness from that checkpoint or its existing direct reader and remove every observation-path receipt-writer call.
- [x] 1.5 [workflow-inspection] Verify controller/status output keeps the established guide, confirm, and hard-stop posture plus one owner-issued nearest action; ensure missing direct facts fail closed without a cache, heal, source/state initialization, or new diagnostic protocol.

## 2. Relocate the exact CURRENT v1 compatibility surface

- [x] 2.1 [image-production] Inventory every caller of the CURRENT v1 adapter, then relocate scripts/04-image-production/ into PPTMAKER_FRAMEWORK/scripts/compatibility/current-v1-page-authority/ and update exact-v1 process imports atomically; retain only the sanctioned v1 mutation interface and no re-export at the old path.
- [x] 2.2 [framework-directory-layout] Consolidate workflow/04-image-production/ and workflow/05-iteration/ into PPTMAKER_FRAMEWORK/workflow/compatibility/current-v1-page-authority/; mark every retained guide existing-run-only, move the v1 change classifier there, and update all intra-framework links to the target 06-iteration classifier or the compatibility classifier as appropriate.
- [x] 2.3 [framework-script-layout] Delete the proven-unreferenced scripts/05-iteration/index.mjs and internal/application.mjs pass-through after its callers and classifier have moved; verify no active production caller or inventory entry resolves either path.
- [x] 2.4 [framework-directory-layout] Move the focused v1 raw/final/structural proof from tests/04-image-production/ to tests/compatibility/current-v1-page-authority/, remove the README-only tests/05-iteration/, tests_e2e/04-image-production/, and tests_e2e/05-iteration/ owners, and retain workflow/05-delivery/ plus tests/05-delivery/ unchanged as shared delivery ownership.
- [x] 2.5 [image-production] Preserve exact CURRENT v1 explicit validate, raw, finalization, structural, and delivery behavior after relocation; prove that only those sanctioned v1 mutation routes can persist a v1 receipt and that target observation never imports the writer.

## 3. Encode the cleaned ownership graph in contracts and guidance

- [x] 3.1 [framework-script-layout] Update framework_architecture, executable inventory, root/interface manifests, and source-to-test ownership to model compatibility/current-v1-page-authority as one compatibility interface rather than an active numbered Phase; remove scripts/04-image-production and scripts/05-iteration ownership records.
- [x] 3.2 [framework-script-layout] Extend architecture negative tests so target adapters, shared workflow observation, and controller-observation code fail validation if they import the CURRENT v1 compatibility mutation interface; retain the narrow top-level exact-route dispatcher exception and existing sibling-import protections.
- [x] 3.3 [framework-directory-layout] Update the checked-in directory/ownership baseline and relevant retirement/governance ledger entries to declare the compatibility home, deleted paths, and the preserved 03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration target graph.
- [x] 3.4 [commands-reference] Update COMMANDS.md and documentation/link audits to distinguish read-only status/state observation from the mutation owner route, link exact v1 guidance only to the compatibility classifier, link target classification to 06-iteration, and reject the deleted scripts/05-iteration classifier path.
- [x] 3.5 [framework-directory-layout] Add focused directory, link, and ownership audit assertions that fail closed on an old numbered v1 owner, an empty placeholder test owner, an unowned relocated test, or a second delivery owner; confirm 05-delivery accepts both bounded v1 and v2 final-manifest provenance through its existing common interface.

## 4. Prove retained behavior and isolation end to end

- [x] 4.1 [image-production] Update relocated v1 unit/integration imports and fixtures, then run the focused compatibility suite to prove receipt/raw/final/structural/delivery lineage remains exact without reading or rewriting user production data.
- [x] 4.2 [workflow-inspection] Extend selected workflow E2E journeys so selected Framed and Pure status/state observation has zero writes even when source-receipt-v2.json exists and source-receipt.json does not; retain the workflow-selection-pending zero-write journey.
- [x] 4.3 [workflow-inspection] Retain or add an exact CURRENT v1 resume/validate/refresh/delivery journey and a v1/v2 hybrid negative journey, proving bounded compatibility remains readable, target routing does not coerce it, and protected identity/evidence invariants remain hard-stops.
- [x] 4.4 [framework-script-layout] Run focused architecture, source-to-test, command-link, and retirement/governance audits against the relocated tree and verify their negative fixtures reject old paths and target-to-v1 writer edges.

## 5. Validate and hand off the completed cleanup

- [x] 5.1 Run the focused v1 compatibility, shared workflow inspection, controller/status process, delivery, architecture, ownership, documentation, and retirement suites; record the exact commands and results in the change evidence.
- [x] 5.2 Run selected mocked E2E for workflow-selection-pending, selected Framed/Pure observation, exact CURRENT v1 compatibility, and target workflow journeys; confirm no provider authorization or artifact mutation occurs during observation.
- [x] 5.3 Run npm test, git diff --check, and openspec validate clean-current-v1-compatibility-boundary --strict; resolve every failure without hand-editing generated artifacts or changing public CLI grammar.
- [x] 5.4 After implementation evidence is complete, update HC.2 through HC.8 and HC.CP in the progressive plan only where direct evidence exists; leave H.10 untouched unless the user explicitly authorizes the project-version decision.
- [x] 5.5 When the user separately authorizes closeout, sync the accepted delta specs, reconcile the commands-reference Purpose and renamed requirement with the active classifier paths, then archive and commit; do not make a project-version decision without separate H.10 authorization.
