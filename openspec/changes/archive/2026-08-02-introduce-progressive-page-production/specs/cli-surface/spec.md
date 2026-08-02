## ADDED Requirements

### Requirement: Page Authority image2 exposes exact progressive production operations

The registered image2 family SHALL retain provider-free full-plan planning and
replace one-shot raw production with these fixed current-v2 forms:

    ppt_flow image2 plan <run-dir>
    ppt_flow image2 pilot <run-dir> --plan-hash <sha256> --slide-id <formal-id> [--slide-id <formal-id>...]
    ppt_flow image2 expansion <run-dir> --plan-hash <sha256>
    ppt_flow image2 authorize <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 generate <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 pilot-review <run-dir> --plan-hash <sha256> --batch-hash <sha256>
    ppt_flow image2 pilot-accept <run-dir> --plan-hash <sha256> --batch-hash <sha256> --decision proceed|repair|redirect
    ppt_flow image2 review <run-dir> --plan-hash <sha256>
    ppt_flow image2 accept <run-dir> --plan-hash <sha256> --decision proceed|repair|redirect
    ppt_flow image2 reconcile <run-dir> --plan-hash <sha256> --attempt-sha256 <sha256>

Pilot SHALL be provider-free and accept only repeated exact current formal
slide IDs; it SHALL return the owner-derived ordered Pilot projection and its
batch hash. That projection SHALL disclose the ordered selected formal IDs,
their source-derived `position + title` display fields, review-sample and paid
submission membership, and maximum submissions; display fields are not accepted
as selectors or batch identity. A repeat of the same current planning action
SHALL return the exact existing batch rather than minting another live scope or
grant. Expansion SHALL be provider-free and derive only the current remaining
paid scope after an exact partial Pilot proceed. Authorize and generate SHALL
require both current hashes. Generate SHALL submit at most one owner-eligible
item per invocation, then return derived progress and the one next legal
action. Pilot-review and pilot-accept apply only to a partial Pilot; review and
accept apply only to complete full-plan raw evidence.

The former authorize/generate forms without a batch hash, all use of --slides,
friendly or inferred scope selectors, arbitrary prompt/provider/profile/path
overrides, force, retry, and direct provider-operation flags SHALL be rejected
before provider initialization or artifact mutation. Reconcile may use only the
exact persisted attempt's supported reconciliation identity; it SHALL not
resubmit or let a caller assert an outcome. When a submitted attempt blocks a
stale current plan, reconcile SHALL still accept that exact plan/attempt pair
solely to record a terminal historical outcome; it SHALL not advance a head,
mint a batch or grant, or present its result as current raw evidence.

#### Scenario: Pilot CLI binds formal IDs in plan order

- **WHEN** a current full plan receives a pilot command with three exact current formal IDs in an arbitrary input order
- **THEN** the CLI returns one provider-free Pilot batch hash ordered by the full plan
- **AND** it does not accept a position, title fragment, --slides value, or unselected ID as equivalent scope

#### Scenario: Pilot CLI gives bounded human cost disclosure

- **WHEN** a valid partial Pilot projection is created
- **THEN** its success report includes ordered formal IDs, display-only position/title, review and paid membership, and maximum submissions
- **AND** a caller cannot submit those display fields, a batch generation, or a predecessor as an alternate scope assertion

#### Scenario: Generate advances one committed item

- **WHEN** an authorized current Pilot batch has two unsubmitted items
- **THEN** one generate invocation claims, submits, and commits at most the next legal item before returning progress
- **AND** the returned next action does not imply that the second item was submitted

#### Scenario: Partial Pilot proceed cannot authorize Expansion

- **WHEN** pilot-accept records proceed for a current partial Pilot batch
- **THEN** the CLI returns only the current Expansion planning action
- **AND** it does not mint an Expansion grant, submit remaining items, or publish accepted raw evidence

#### Scenario: Complete branches reject synthetic Pilot commands

- **WHEN** current paid debt is zero or a one-through-five-item Pilot scope exhausts all paid debt
- **THEN** pilot-review and pilot-accept are inapplicable and review is the owner-issued next quality operation
- **AND** the CLI does not create synthetic Pilot evidence, a partial decision, or an Expansion grant

#### Scenario: Unresolved submitted attempt has one reconciliation route

- **WHEN** generate observes a current `submitted` item attempt without a provable terminal outcome
- **THEN** the CLI emits the producer-owned recoverability hard-stop and the exact reconcile invocation
- **AND** it does not expose retry, force, status editing, or a successor grant as the same action

#### Scenario: Terminal unknown cannot reopen a grant

- **WHEN** reconcile terminalizes an attempt as `unknown`
- **THEN** later paid work starts only from the owner-derived successor planning action and a new explicit cost authorization
- **AND** the CLI does not reopen the old grant, resubmit from reconcile, or present historical bytes as current evidence

#### Scenario: Stale plan still permits only exact historical reconciliation

- **WHEN** a submitted attempt's source/profile tuple becomes stale before its outcome is terminal
- **THEN** only `reconcile` with that persisted plan and attempt identity is accepted for the old lifecycle
- **AND** the CLI does not create a successor plan, batch, grant, or current evidence from that invocation

### Requirement: Progressive production diagnostics remain direct and bounded

Every progressive image2 hard failure SHALL use the registered producer-owned
diagnostic envelope. The producer SHALL first validate exact run/workflow
identity, full-plan identity, batch identity, grant/attempt binding, and
current item provenance before any derived projection, browser work, or
provider call. It SHALL report the smallest independent root cause and one
nearest legal owner action; the Controller SHALL consume that action without
parsing prose or creating another recovery route.

#### Scenario: Stale batch stops before submission

- **WHEN** authorize or generate receives a batch hash whose plan, raw contract, profile, source, execution, or selected IDs drifted
- **THEN** the CLI returns the raw-owner rebuild/replan diagnostic before provider initialization
- **AND** it does not reinterpret the grant, choose a replacement batch, or consume another item
