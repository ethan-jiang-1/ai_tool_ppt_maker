## 1. Prompt Assembly

- [ ] 1.1 In `targetPageAuthoritySubmitFactory` (ppt_flow.mjs), branch on `raw_contract.workflow`: for `pure`, build a structured prompt with a top-level `text` section (kicker/title/subtitle/callout/body from display + body), a `visual` section (provider_clauses + visual_scene), and a bounded instruction to render all slide text as readable typography; keep the framed path as `JSON.stringify(request)`.

## 2. Tests

- [ ] 2.1 Update `tests/shared/image2/test_style_master_raw_binding.mjs` (pure submit test): assert the serialized prompt contains the explicit text section with the exact title/body strings.
- [ ] 2.2 Update `tests/04-pure-image/test_pure_workflow.mjs` (inspection/prompt assertions): pure prompt includes the renderable text contract.
- [ ] 2.3 Add/extend `tests/03-framed-image/test_framed_workflow.mjs`: framed prompt does not present renderable slide text and still equals the framed request serialization.

## 3. Validation

- [ ] 3.1 Run the focused test files (`test_style_master_raw_binding.mjs`, `test_pure_workflow.mjs`, `test_framed_workflow.mjs`) and fix regressions.
- [ ] 3.2 Run the regression suite and `openspec validate render-pure-slide-text-in-provider-prompt --strict`; confirm no `deck_*` artifact used as fixture or edited.
