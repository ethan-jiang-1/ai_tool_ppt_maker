// Tests: openspec/specs/visual-config/spec.md
// Tests: openspec/specs/visual-asset-management/spec.md
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  PAGE_IMAGE_REFERENCE_ROOT,
  PageImageReferenceMaterialError,
  resolvePageImageIdentityReference,
} from "../../ppt_maker_harness/scripts/02-visual-system/index.mjs";

const PROFILE = "test-agent";
const ROLE = "guide";
const SUBJECT_CLASS = "amber-light-form";
const ROLE_CLAUSE = "one test light-form guides calmly";
const REFERENCE_BYTES = Buffer.from("synthetic identity reference bytes", "utf8");

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fixture() {
  const root = mkdtempSync(join(tmpdir(), "page-image-reference-material-"));
  const deck = join(root, "deck_reference_material");
  const profileDirectory = join(deck, ...PAGE_IMAGE_REFERENCE_ROOT.split("/"), PROFILE);
  const referencePath = join(profileDirectory, "guide.png");
  const registryPath = join(profileDirectory, "image2-reference-material.yaml");
  mkdirSync(profileDirectory, { recursive: true });
  writeFileSync(referencePath, REFERENCE_BYTES);
  writeFileSync(registryPath, `schema: pptmaker-image2-reference-registry
profiles:
  ${PROFILE}:
    subject_class: ${SUBJECT_CLASS}
    maximum_identity_subjects: 1
    compatible_restrictions:
      - none
      - no-generic-metal-robot
    incompatible_restrictions:
      - no-identity-subject
    roles:
      ${ROLE}:
        reference_path: guide.png
        reference_sha256: ${sha256(REFERENCE_BYTES)}
        role_clause: ${ROLE_CLAUSE}
`, "utf8");
  return { root, deck, profileDirectory, referencePath, registryPath };
}

function resolve(deck, overrides = {}) {
  return resolvePageImageIdentityReference({
    deckDir: deck,
    identity: { profile: PROFILE, role: ROLE },
    identity_subject_count: "one",
    subject_restrictions: "none",
    ...overrides,
  });
}

function issueCodes(action) {
  try {
    action();
  } catch (error) {
    expect(error).toBeInstanceOf(PageImageReferenceMaterialError);
    return error.issues.map((issue) => issue.code);
  }
  throw new Error("expected Page Image reference resolution to fail");
}

describe("Page Image identity reference material", () => {
  it("resolves one deterministic paired projection and provider reference", () => {
    const value = fixture();
    try {
      const first = resolve(value.deck);
      const second = resolve(value.deck);
      const referenceSha = sha256(readFileSync(value.referencePath));

      expect(first.projection).toEqual({
        profile: PROFILE,
        role: ROLE,
        reference_sha256: referenceSha,
        role_clause_sha256: sha256(ROLE_CLAUSE),
        subject_class: SUBJECT_CLASS,
        identity_subject_count: "one",
        subject_restrictions: "none",
      });
      expect(first.provider_reference).toEqual({
        path: value.referencePath,
        sha256: referenceSha,
        role_clause: ROLE_CLAUSE,
      });
      expect(first).toEqual(second);
      expect(Object.isFrozen(first)).toBe(true);
      expect(Object.isFrozen(first.projection)).toBe(true);
      expect(Object.isFrozen(first.provider_reference)).toBe(true);
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });

  it("fails closed for unregistered, unavailable, altered, and incompatible identity facts", () => {
    const value = fixture();
    try {
      expect(issueCodes(() => resolve(value.deck, {
        identity: { profile: "absent-agent", role: ROLE },
      }))).toContain("reference_registry_unavailable");
      expect(issueCodes(() => resolve(value.deck, {
        identity: { profile: PROFILE, role: "absent-role" },
      }))).toContain("unregistered_identity_role");

      const originalRegistry = readFileSync(value.registryPath, "utf8");
      writeFileSync(value.registryPath, originalRegistry.replace("reference_path: guide.png", "reference_path: ../outside.png"));
      expect(issueCodes(() => resolve(value.deck))).toContain("invalid_reference_path");

      writeFileSync(value.registryPath, originalRegistry);
      rmSync(value.referencePath);
      expect(issueCodes(() => resolve(value.deck))).toContain("reference_path_escape");

      writeFileSync(value.referencePath, Buffer.from("changed fixture bytes", "utf8"));
      expect(issueCodes(() => resolve(value.deck))).toContain("reference_sha_mismatch");

      writeFileSync(value.referencePath, REFERENCE_BYTES);
      writeFileSync(value.registryPath, originalRegistry.replace(ROLE_CLAUSE, "readable label"));
      expect(issueCodes(() => resolve(value.deck))).toContain("content_overriding_visual_clause");

      writeFileSync(value.registryPath, originalRegistry);
      expect(issueCodes(() => resolve(value.deck, { identity_subject_count: "none" })))
        .toContain("identity_subject_count_incompatible");
      expect(issueCodes(() => resolve(value.deck, { subject_restrictions: "no-identity-subject" })))
        .toContain("identity_restriction_incompatible");
    } finally {
      rmSync(value.root, { recursive: true, force: true });
    }
  });
});
