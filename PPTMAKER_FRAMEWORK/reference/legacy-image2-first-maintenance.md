# Legacy Image2-First Maintenance

This reference applies only when the canonical slide source has no `production.pipeline: html-first-v1` marker. It preserves the existing style-master, whole-page Image2 prompt, pilot/header review, Stage 2 generation, Stage 3 header lock, PPTX, notes, and refresh semantics for historical decks.

Classify the marker before readiness or provider setup. Legacy preview requires a current style master; legacy production additionally requires its existing content/visual gates and current header-review evidence. Provider calls remain explicit long jobs and require configured credentials. Whole-page prompt authoring may use the historical model/profile/style anchoring rules, but those rules never enter a new HTML-first deck.

Use the existing legacy commands documented by `ppt_flow --help`: `style-master`, `pilot`, `approve ... header`, `build`, and legacy refresh paths. Keep generated files under the legacy version-owned `_generated/` directories and never treat `_generated/html_production/` as legacy authority.

Migration to HTML is opt-in through `migrate-html prepare --preset <name>`, Agent-authored structured candidate fields, complete `migrate-html preview`, Controller-owned `state --confirm-migration-apply`, then exact `migrate-html apply`. Preparation and guides are zero-provider and preserve the legacy version; they never infer structured bodies from prompts or require manual edits to `_generated/`, state, journals, or locks.
