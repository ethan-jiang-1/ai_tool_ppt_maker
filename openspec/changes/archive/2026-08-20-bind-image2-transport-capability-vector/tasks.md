## 1. Profile vector

- [x] 1.1 [run-bundle-management] Parse optional `transport` on confirmed `page-image-reference-generation` only. Default omitted transport to generations/json/2000x1125/multiple 1/async-poll. Include the resolved vector in `profile_sha256`. Done when existing fixtures still resolve and an explicit default-equivalent declaration is digest-stable after normalize.
- [x] 1.2 [run-bundle-management] Reject edits+json, generations+multipart, style-master transport, unknown keys, non-divisible size, vendor-named fields, before any binding. Done when resolve throws `image2_provider_profile_shape_invalid` with zero network.

## 2. Generation profile and submit

- [x] 2.1 [image-generation] `selectImage2ProviderOperation` and Page Image generation profile copy the resolved transport. Drift of transport changes the digest.
- [x] 2.2 [image-generation] Page Image submit POSTs `${base}/images/${http_operation}` with bound encoding and size. Multipart uses the existing Style Master PNG as `image`. `sync` does not poll.
- [x] 2.3 [cli-surface] Keep one credential/base-URL pair. Style Master submit stays generations JSON 2000x1125.

## 3. Architecture and tests

- [x] 3.1 Update `validOperationProfile` / production-schema fixtures so page-image operations include transport; style-master does not.
- [x] 3.2 Tests: default generations path unchanged; edits+multipart mock fetch asserts URL/encoding/size and a PNG return; illegal combo never calls fetch. No Packy name assertions. No scratch-to-PPTX path.
- [x] 3.3 `openspec validate --strict --change bind-image2-transport-capability-vector` and touched suites.
