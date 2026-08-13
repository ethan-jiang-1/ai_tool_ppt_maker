## 1. Authority And Entry Guidance

- [x] 1.1 [harness-charter] Align top-level and Harness Agent entry guidance so `openspec/specs/` is the normative behavior contract, `CONTEXT.md` is the canonical terminology reference, and run-bundle production continues through BOOTSTRAP, the Agent Contract, and the applicable MD Controller.
- [x] 1.2 [harness-charter] Make `CONTEXT.md` definitional and cross-linked to its owning specification categories; distinguish the Page Image pipeline, version-level `production.workflow: framed|pure`, and method-module/MD Controller workflow guidance without changing protocol literals or controller ownership.
- [x] 1.3 [harness-directory-layout] Add `ppt_maker_harness/schema/` to active Harness source maps as the sole production-schema definition home, distinct from controller, run-bundle, and generated-output ownership.

## 2. Active Operational Guidance

- [x] 2.1 [commands-reference] Correct discovery and command guidance so `playbook/` is the home of MD Controllers and their manifest, while `intent-routes.json` is the closed Intent Route Catalog used only for first safe handoff.
- [x] 2.2 [bootstrap-env-guidance] Make `ppt_flow init` the sole supported public Run Bundle creation command and describe `bundle_layout.mjs --init` only as the layout owner's lower-level interface with the same contract.
- [x] 2.3 [image-production] Remove active HTML and visual-slot production-family guidance; describe Image Production only as the current whole-page Page Image Workflow, including Framed's local header overlay.
- [x] 2.4 [run-bundle-layout] Complete active Charter/reference run-bundle tree snapshots with the current Style Master iteration history, Style Master intent, Page Image visual-language, and `pure-deck-visual-system.yaml` sources, retaining `bundle_layout.mjs` as layout authority.

## 3. Stable Terminology And Projections

- [x] 3.1 [visual-config] Update active Framed guidance to distinguish the local Reserved Header Region from the provider-facing Provider Avoidance Constraint and its review boundary, preserving all serialized and implementation field names unchanged.
- [x] 3.2 [slide-identity-and-ordering] Update active identity guidance to distinguish stable `slide_id` from its position-prefixed `NN_slideID` filename projection without changing identity, selector, filename, or casing contracts.

## 4. Coherence Coverage And Verification

- [x] 4.1 [harness-charter, harness-directory-layout, commands-reference, bootstrap-env-guidance, visual-config, image-production, run-bundle-layout, slide-identity-and-ordering] Extend focused documentation-coherence coverage to assert each repaired active claim and retain a negative ambiguity case without scanning frozen history or machine literals as prose aliases.
- [x] 4.2 Run the focused documentation-coherence test, `npm test`, `openspec validate align-harness-terminology-and-authority --strict`, `openspec validate --all --strict`, and `git diff --check`; resolve any failures without changing production data or runtime contracts.
