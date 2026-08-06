# Intent Discovery Uses A Separate Route Catalog

Status: Accepted

The PPT Maker Harness contains a versioned Intent Route Catalog beside, but independent from, the Controller manifest. The Agent interprets a user's natural-language goal; the catalog validates the selected route's first safe discovery step. Lifecycle nodes, owner CLIs, exact hashes, authorizations, and state remain owned by their current sources. This makes novice-oriented discovery explicit and auditable without creating a second controller or a third production CLI.

## Considered Options

- Put discovery routes in `controller-manifest-v3.json`: rejected because lifecycle ownership and user-intent discovery change at different rates.
- Add a `ppt work` command or a `PptControl` dispatcher: deferred because it would create a new public contract while the existing owner command families remain sufficient.
- Keep routing only as prose in `COMMANDS.md`: rejected because it cannot enforce closed coverage, safe first steps, or compatibility boundaries.

## Consequences

The catalog is audit-first in its first version and does not parse language, dispatch commands, persist a selected route, or authorize work. The authority order is owner CLI/current OpenSpec contract, then playbook lifecycle, then route catalog, then `COMMANDS.md` presentation. New public capabilities must add a catalog route rather than bypassing discovery with ad hoc prose.
