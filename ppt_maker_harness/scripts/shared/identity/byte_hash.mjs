/**
 * byte_hash — Exact byte hashing (SHA-256) for lineage and identity facts.
 * Authority: openspec/specs/production-schema-conformance/spec.md
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256File(path, readFile = readFileSync) {
  return sha256Bytes(readFile(path));
}
