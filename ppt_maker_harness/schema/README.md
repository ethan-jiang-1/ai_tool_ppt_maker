# Page Image Production Schema Definitions

This directory is the authoritative, non-executable vocabulary for Page Image
production. Its YAML files describe meaningful source, derived, and record
artifacts from a deck argument through delivery. They are readable by humans
and Agents now; C2 will make code constants a tested mirror of this vocabulary.

These files do not introduce a runtime validator, a lifecycle controller, a
gate outcome, or a record migration. They never authorize provider work. Run
Bundles remain the owner of deck source, derived data, state, and records; do
not copy this directory into a `deck_*` bundle or edit a bundle from it.

## Contents

- `META.yaml`: the required shape and writing rules for one stage definition.
- `flow.yaml`: logical transformations, owners, producer status, and
  invalidation causes.
- `recovery-route.yaml`: the authoritative C1-C7 recovery-route labels used
  by planned producers.
- `stages/`: exactly nineteen conceptual definitions, one per filename.
- `frozen-identifiers.yaml`: historical record identifiers and live identity
  literals that later code must preserve rather than rename.

The stage names are conceptual and unversioned. A current implementation may
serialize multiple internal records for one stage. A planned C3-C5 stage names
its planned owning change or capability and uses `producer_status: planned`; it
does not claim an implementation module that does not exist. Every planned
stage and flow producer also carries a `route_ref` that resolves in
`recovery-route.yaml`.

## Recovery Route Labels

`C1` through `C7` are labels for the current Page Image recovery route. They
are not lifecycle phases, workflow modules, CLI commands, schema names, or
authorization states. [`recovery-route.yaml`](recovery-route.yaml) is the
single authority for each label's work, execution kind, responsibility,
boundary, and exit evidence.

`planned` in `flow.yaml` means the matching route entry has not materialized
that producer yet. It never means that an Agent may implement, submit, or
authorize the later route entry merely because its schema is already named.

## Repair Guidance

A field is constrained only when it declares `rule`. Every such field carries
`on_violation.means`, `on_violation.ask`, and `on_violation.never`. Those three
strings are written for a Deck Author: they explain the content decision at
hand without naming a source field or schema file. They are collaboration
context, not an authorization, diagnostic, state mutation, record, or gate.

An omitted value that intentionally normalizes declares `default` in the stage
definition. C1 only documents that behavior; C2 owns applying those defaults
and projecting Repair Guidance through an existing runtime handoff.

## Static Integrity Check

Run this from the repository root after editing a stage definition, the flow,
or the recovery route. It rejects missing or extra stage files, checks every
declared `rule` for a non-empty Repair Guidance block, verifies the complete
C1-C7 route, verifies every planned producer's `route_ref`, and reports
declared defaults for manual review against `META.yaml`.

```sh
node --input-type=module <<'EOF'
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

const root = "ppt_maker_harness/schema";
const expected = new Set([
  "story-outline", "visual-language", "design-constraints", "layout-config",
  "page-source", "page-source-receipt", "page-layout", "page-render-model",
  "page-generation-spec", "image2-request", "framed-header-html",
  "page-artifact-index", "image-generation-plan", "image-generation-record",
  "page-review-decision", "final-page-list", "delivery-package",
  "visual-style-candidates", "production-progress-state",
]);
const expectedRouteIds = new Set(["C1", "C2", "C3", "C4", "C5", "C6", "C7"]);
const actual = readdirSync(join(root, "stages"), { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".yaml"))
  .map((entry) => entry.name.slice(0, -".yaml".length))
  .sort();
const failures = [];
const defaults = [];
const plannedReferences = [];
const routePath = join(root, "recovery-route.yaml");
const route = parse(readFileSync(routePath, "utf8"));
const routeEntries = Array.isArray(route?.labels) ? route.labels : [];
const routesById = new Map(routeEntries
  .filter((entry) => entry && typeof entry.id === "string")
  .map((entry) => [entry.id, entry]));

verifyRoute();

for (const name of actual) {
  const file = join(root, "stages", `${name}.yaml`);
  const definition = parse(readFileSync(file, "utf8"));
  if (definition?.schema !== name) failures.push(`${file} does not declare schema: ${name}`);
  inspect(definition, file, []);
}
inspect(parse(readFileSync(join(root, "flow.yaml"), "utf8")), join(root, "flow.yaml"), []);

for (const name of expected) {
  if (!actual.includes(name)) failures.push(`missing stage definition: ${name}`);
}
for (const name of actual) {
  if (!expected.has(name)) failures.push(`unexpected stage definition: ${name}`);
}
if (failures.length > 0) throw new Error(failures.join("\n"));
console.log(`Repair Guidance verified for ${actual.length} stage definitions.`);
console.log(`Recovery route verified for ${routeEntries.length} labels and ${plannedReferences.length} planned producer references.`);
console.log(`Declared defaults for manual review: ${defaults.join(", ") || "(none)"}`);

function verifyRoute() {
  if (!Array.isArray(route?.labels)) {
    failures.push(`${routePath} must contain a labels array`);
    return;
  }
  for (const id of expectedRouteIds) {
    if (!routesById.has(id)) failures.push(`${routePath} is missing route label: ${id}`);
  }
  for (const id of routesById.keys()) {
    if (!expectedRouteIds.has(id)) failures.push(`${routePath} has unexpected route label: ${id}`);
  }
  for (const entry of routeEntries) {
    for (const key of ["id", "work", "execution_kind", "responsibility", "boundary", "exit_evidence"]) {
      if (typeof entry?.[key] !== "string" || !entry[key].trim()) {
        failures.push(`${routePath} route label is missing non-empty ${key}`);
      }
    }
  }
}

function inspect(value, file, path) {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => inspect(entry, file, [...path, index]));
    return;
  }
  if (!value || typeof value !== "object") return;
  if (value.producer_status === "planned") {
    if (typeof value.route_ref !== "string" || !routesById.has(value.route_ref)) {
      failures.push(`${file}:${path.join(".") || "<root>"} has planned producer without a resolvable route_ref`);
    } else {
      plannedReferences.push(`${file}:${path.join(".")}`);
    }
  }
  if (Object.hasOwn(value, "rule")) {
    for (const key of ["means", "ask", "never"]) {
      if (typeof value.on_violation?.[key] !== "string" || !value.on_violation[key].trim()) {
        failures.push(`${file}:${path.join(".") || "<root>"} has rule without on_violation.${key}`);
      }
    }
  }
  if (Object.hasOwn(value, "default")) defaults.push(`${file}:${path.join(".")}`);
  for (const [key, child] of Object.entries(value)) inspect(child, file, [...path, key]);
}
EOF
```

The command is C1 evidence only. It does not grant a source mutation, a
provider submission, or a delivery action.
