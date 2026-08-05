# Define Agent, Harness, And Run Bundle Boundaries

Status: Accepted

A human owns Deck content and consequential approvals; an external Agent owns process orchestration; and the PPT Maker Harness supplies reusable methods, controls, and tools without containing an Agent instance. The Harness Maintenance Domain evolves that source, its normative specifications, and tests, while Deck production data remains outside it.

A Deck has one Run Bundle: an external workspace bound to the exact local Harness Root that created it, not to a release, Git revision, or content hash. Another Harness does not take it over implicitly; a Bundle may live anywhere outside the Harness Root, and its local non-secret lessons do not become Harness-wide memory without an explicit maintenance change.
