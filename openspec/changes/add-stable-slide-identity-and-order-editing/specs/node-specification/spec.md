## ADDED Requirements

### Requirement: MD Controller separates current position from stable slide identity

When discussing or selecting pages, the MD Controller SHALL present `position + formal slide_id + title` when available. It SHALL describe position as the current version's mutable order and formal ID as the stable cross-version identity. Natural-language page numbers SHALL be converted to explicit position selectors for the current snapshot; voice or typed mnemonic variants SHALL be passed to the shared resolver. The controller SHALL NOT rewrite a formal ID merely because the page moved or its title changed.

For newly authored or inserted pages, the Agent SHALL propose a 5-letter-preferred, 6-letter-when-clearer `SUBJECT + MOVE` BlockCase mnemonic based on durable narrative role. It SHALL avoid a one-word page category, position suffix, random token, or unreadable compression, and SHALL present the proposed ID with title and insertion location in the structural preview. Deterministic JS validation remains authoritative for shape and reservation; the Controller SHALL NOT claim that JS made the semantic choice.

#### Scenario: User refers to a current page number

- **WHEN** the user says "把第 7 页放到第 3 页后面"
- **THEN** MD converts both page references to current position selectors and requests one preview transaction
- **AND** displays the resolved formal IDs before mutation

#### Scenario: User speaks a mnemonic

- **WHEN** the user says "把 ID fix 放到 AI cost 后面"
- **THEN** MD passes voice-friendly mnemonic selectors to deterministic resolution
- **AND** does not require the user to pronounce `@`, preserve case, or spell a random code

#### Scenario: Agent names an inserted page

- **WHEN** the user requests a new page whose durable role is an AI cost argument
- **THEN** the Agent may propose `AICost` with the page title and location
- **AND** does not compress it to `AICst` merely to force five letters

### Requirement: MD Controller consumes structural previews and receipts

For add, delete, move, normalization, or multi-operation structure intent, MD SHALL invoke the `ppt_flow slides` preview path before structural mutation. It SHALL present the resolved before/after order, formal-ID operations, target version or in-place normalization boundary, render/refresh impact, and review warnings in concise human terms. Mutation SHALL proceed only from the same base-hash-bound transaction after explicit user authorization; MD SHALL NOT recreate the edit manually in Markdown or reinterpret position selectors after preview.

After apply, MD SHALL consume the edit receipt, report the created version and actual operations, and continue only with the receipt's affected refresh scope. A stale-base failure SHALL trigger a fresh read and preview, not an automatic rebase. Natural-language page-reference warnings SHALL be treated as Agent-owned semantic review; MD SHALL inspect and repair source meaning before claiming the structure edit complete.

#### Scenario: Preview awaits confirmation

- **WHEN** a structural preview succeeds and changes slide order or membership
- **THEN** MD shows the before/after facts and waits for explicit authorization before `--apply`
- **AND** does not treat preview success itself as permission to mutate

#### Scenario: Apply receipt drives follow-up work

- **WHEN** structural apply creates a new version and reports one inserted ID plus verified retained artifacts
- **THEN** MD continues production in the reported target version
- **AND** requests expensive rendering only for the missing/stale IDs identified by deterministic impact

#### Scenario: Source changed between preview and apply

- **WHEN** apply reports a base source hash mismatch
- **THEN** MD rereads current source and obtains a new preview
- **AND** does not edit the transaction hash or silently rebase operations

### Requirement: MD Controller fails closed on selector and reference ambiguity

MD SHALL use semantic context to translate natural language into candidate selectors, but deterministic resolver output SHALL establish the targeted formal IDs. If selector resolution is ambiguous, a mnemonic is near-confusable, a new ID conflicts with deck history, or the structural preview/diagnostic declares `requires_human:true`, MD SHALL present bounded `position + slide_id + title` choices and stop for a genuine user decision. It SHALL NOT infer a target from current proximity or apply approximate correction.

Producer preview, receipt, and failure schemas SHALL remain owned by `slide-identity-and-ordering` and `cli-surface`. `node-specification` SHALL define consumption and state behavior by reference and SHALL NOT copy a competing wire schema into MD guidance.

#### Scenario: Two titles match spoken intent

- **WHEN** the user's phrase could identify two current pages and the resolver returns ambiguity
- **THEN** MD presents both current positions, formal IDs, and titles
- **AND** waits for the user to select one

#### Scenario: Deterministic warning requires semantic repair

- **WHEN** an edit receipt identifies prose that still says "page 7" after reordering
- **THEN** MD treats the locator as evidence to inspect, not permission for blind replacement
- **AND** does not mark verification complete until the reference is semantically resolved

#### Scenario: Consumer does not redefine producer fields

- **WHEN** maintainers update a structural preview or diagnostic producer schema
- **THEN** MD guidance points to the owning capability and supported version
- **AND** does not preserve a divergent copied field list
