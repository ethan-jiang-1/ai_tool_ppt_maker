import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import {
  PAGE_IMAGE_REFERENCE_ROOT,
  PAGE_IMAGE_VISUAL_LANGUAGE_RELATIVE_PATH,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";

export const TEST_IDENTITY_REFERENCE = Object.freeze({
  profile: "test-agent",
  role: "guide",
  subject_class: "amber-light-form",
  role_clause: "one test light-form guides calmly",
});

const REFERENCE_BYTES = Buffer.from("synthetic page image identity reference", "utf8");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

/** Create one registered, non-production identity profile for a temporary deck. */
export function writeTestIdentityReference(deck, {
  roleClause = TEST_IDENTITY_REFERENCE.role_clause,
} = {}) {
  const directory = join(deck, ...PAGE_IMAGE_REFERENCE_ROOT.split("/"), TEST_IDENTITY_REFERENCE.profile);
  const referencePath = join(directory, "guide.png");
  const registryPath = join(directory, "image2-reference-material.yaml");
  const referenceSha256 = sha256(REFERENCE_BYTES);
  mkdirSync(directory, { recursive: true });
  writeFileSync(referencePath, REFERENCE_BYTES);
  writeFileSync(registryPath, `schema: pptmaker-image2-reference-registry
profiles:
  ${TEST_IDENTITY_REFERENCE.profile}:
    subject_class: ${TEST_IDENTITY_REFERENCE.subject_class}
    maximum_identity_subjects: 1
    compatible_restrictions:
      - none
      - no-generic-metal-robot
    incompatible_restrictions:
      - no-identity-subject
    roles:
      ${TEST_IDENTITY_REFERENCE.role}:
        reference_path: guide.png
        reference_sha256: ${referenceSha256}
        role_clause: ${roleClause}
`, "utf8");
  return Object.freeze({
    directory,
    reference_path: referencePath,
    registry_path: registryPath,
    reference_sha256: referenceSha256,
    role_clause_sha256: sha256(roleClause),
    role_clause: roleClause,
  });
}

/** Allow the test-only identity subject class in a temporary visual-language source. */
export function allowTestIdentitySubjectClass(deck) {
  const path = join(deck, ...PAGE_IMAGE_VISUAL_LANGUAGE_RELATIVE_PATH.split("/"));
  const source = readFileSync(path, "utf8");
  const next = source.replace(
    "identity_subject_classes: [none]",
    "identity_subject_classes: [none, amber-light-form]",
  );
  if (next === source) throw new Error("temporary visual-language fixture has no identity subject-class slot");
  writeFileSync(path, next, "utf8");
}
