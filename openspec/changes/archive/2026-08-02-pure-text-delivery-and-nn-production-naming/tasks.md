## 1. Lock The New Contract With Focused Tests

- [x] 1.1 Add source-parser tests proving `BODY` parses as an optional inline
  field, defaults to `null` when absent, and stays forbidden for Framed.
- [x] 1.2 Extend the Pure integration test proving `pureRawContract` carries
  `body` (and `null` when absent) alongside `display`.
- [x] 1.3 Extend the artifact-contract test proving final manifest items use
  `NN_slideID.png` paths and the validator accepts them.
- [x] 1.4 Update the Framed workflow final-path assertions to `NN_slideID`.

## 2. Implement The Delivery Fix

- [x] 2.1 Add `body` parsing to the slide receipt in
  `page_authority_source.mjs` (optional inline value, null when absent).
- [x] 2.2 Add `body` to `pureRawContract` in `04-pure-image/index.mjs`.
- [x] 2.3 Update `createFinalSlideManifest` and `validateFinalSlideManifest` in
  `page_authority_artifacts.mjs` to use `NN_slideID.png`.
- [x] 2.4 Do not change the provider submit factory, request envelope, state
  schema, style master, or any production `deck_*` bundle.

## 3. Verify Without Widening The Control Surface

- [x] 3.1 Run the focused `01-content`, `04-pure-image`, `03-framed-image`, and
  `shared/image2` suites; verify BODY delivery, NN_ paths, and unchanged raw/evidence
  contracts remain provider-free.
- [x] 3.2 Run `npm test` as the core tier. Do not run mock or real E2E; real-provider
  work remains unauthorized.
- [x] 3.3 Run `openspec validate pure-text-delivery-and-nn-production-naming --strict`,
  `openspec validate --all --strict`, and `git diff --check`. Confirm all delta
  requirements have an observable test result and durable authority files are unchanged.
