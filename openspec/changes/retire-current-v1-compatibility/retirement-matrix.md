# CURRENT v1 Retirement Matrix

This is change-local evidence, not an active framework registry. Discovery was
run only against `PPTMAKER_FRAMEWORK/`, `tests/`, `tests_e2e/`, and
`openspec/specs/`; production bundles and OpenSpec archives are excluded.

## Discovery Contract

Every literal v1/adoption occurrence is classified by its owning row below.
The verification command is deliberately path-based so a new call site fails
the retirement audit instead of silently joining a grouped row. Generic JSON
compatibility, project version history, visual-language compatibility, and the
`cli_error` bootstrap shim are independently owned and excluded.

| Discovered reference | Behavior | Classification | Absorbing owner / deletion target | Retained proof | Verification |
| --- | --- | --- | --- | --- | --- |
| `scripts/compatibility/current-v1-page-authority/index.mjs` | v1 top-level dispatch | delete | delete tree | v2 CLI journey | active-root audit |
| `scripts/compatibility/current-v1-page-authority/page-authority/{operations,raw_compilation,raw_manifest,raw_profiles,raw_review,final_manifest,finalizer,structural_raw,index}.mjs` | v1 source/raw/final/structural execution | v2 owner | `03-framed-image`, `04-pure-image`, shared raw, `05-delivery`, target structural owner | target raw/final/structural suites | architecture + target suites |
| `scripts/shared/run-bundle/production_marker.mjs` | accepts v1 marker/default grammar | v2 owner | retain v2-only parser | source parsing suite | marker negative audit |
| `scripts/shared/run-bundle/production_mode.mjs` | accepts v1 state mode and policy | v2 owner | retain exact v2 mode record | target state suite | state/inspection negative audit |
| `scripts/shared/state/legacy_protocol_adoption.mjs` | historical decoder and classifier | delete | delete module | unsupported-pair inspection suite | active-root audit |
| `scripts/shared/state/production_mode_transition.mjs` | adoption prepare/preview/confirm/apply/recovery | delete | delete module | target structural suite | active-root audit |
| `scripts/shared/state/state.mjs` legacy adoption helpers and v1 state records | receipt/state/adoption mutations | v2 owner | retain target state and structural publication only | target state suite | state export/import audit |
| `scripts/shared/workflow/inspect_workflow.mjs` legacy result branch | recognizes v1 and offers adoption | shared invariant | one read-only unsupported-protocol/export hard-stop | inspection process suite | no-write fixture |
| `scripts/ppt_flow.mjs` legacy resolver, command branches, flags, v1 adapter imports | public selection and execution | v2 owner | selected target operation adapters only | CLI surface + target journey | CLI help/import audit |
| `scripts/01-content/internal/{page_authority_source,target_structural_version}.mjs` | accepts v1 marker and materializes v1 structural source | v2 owner | v2 source receipt and target structural plan | parser/structural suites | marker/plan negative audit |
| `scripts/00-setup/internal/env_check.mjs` | checks v1 adapter tree/mode | v2 owner | v2 raw readiness check | doctor process suite | doctor inventory audit |
| `scripts/contracts/{framework_architecture,framework_coherence,framework_static_coherence,retirement_ledger_audit,cli_return_audit}.mjs` | registers or exempts v1 ownership | shared invariant | fail-closed v2-only ownership/main-spec audit | contract suites | architecture/coherence audit |
| `workflow/compatibility/current-v1-page-authority/**` | v1 method documentation/classifier | delete | delete tree | active docs audit | active-root audit |
| `workflow/{README.md,00-setup/00-run-bundle-concept.md,00-setup/04-conventions.md,01-content/README.md}` | describes v1 as current compatibility input | delete | rewrite to v2/current hard-stop | docs consistency suite | active-root audit |
| `playbook/{classify-change,create-deck,edit-notes,edit-text,edit-visual,iterate-style,probe-image-channels,production-mode-transition,quick-preview,restructure-slides}.md` | exposes v1 nodes/modes/routes | v2 owner | selected v2 controller routes | controller reader suite | manifest/playbook audit |
| `playbook/controller-manifest-v3.json` | registers compatibility nodes | delete | v2-only manifest | controller reader suite | manifest audit |
| `AGENTS.md`, `BOOTSTRAP.md`, `COMMANDS.md`, `README.md`, `scripts/README.md` | current human/Agent compatibility guidance | delete | v2/current guidance | docs consistency suite | active-root audit |
| `charter/{AGENT_CONTRACT,NODE-SPEC,WORKFLOW}.md`, `reference/glossary.md` | current v1/adoption terminology | delete | protocol-neutral current language | docs consistency suite | active-root audit |
| `tests/compatibility/current-v1-page-authority/**` | direct v1 proof | delete | delete tree | retained target raw suite | test-root audit |
| `tests/shared/state/test_process_legacy_protocol_adoption.mjs`, `tests_e2e/shared/state/test_mock_legacy_adoption_journey.mjs` | adoption behavior | delete | delete files | unsupported-pair process/E2E suite | test-root audit |
| `tests/{00-setup,01-content,02-visual-system,shared/state,shared/workflow,contracts}/**` v1 fixtures/assertions | v1 parser/state/controller/architecture proof | v2 owner | rewrite to v2 and unsupported-pair proof | focused suite | source-to-test audit |
| `tests_e2e/shared/workflow/**`, `tests_e2e/shared/state/README.md` | legacy routes in selected journeys/docs | v2 owner | v2 journey and unsupported-pair fixture | mock E2E suite | test-root audit |
| `tests/contracts/{framework-governance-ledger-v1,image-production-ownership-baseline-v2,source-test-ownership-v1}.json` | active v1 ownership/inventory | shared invariant | v2-only inventories | contract suites | ownership audit |
| `openspec/specs/{commands-reference,content-parsing,framework-charter,framework-directory-layout,framework-script-layout,image-generation,image-production,node-specification,pipeline-orchestration,playbook-execution,run-bundle-management,slide-identity-and-ordering,workflow-inspection}/spec.md` | v1 current requirements | v2 owner / delete | synchronize accepted deltas | `openspec validate` | main-spec audit |
| `openspec/specs/{header-lock,html-slide-contract,visual-slot-refinement}/spec.md` | empty retired capability | delete | remove capability after sync | spec registry audit | main-spec audit |

## Evidence Status

The rows are classified before deletion. Task 5.1 records the exact commands
and results after the retained v2/shared proof and absence audits pass.
