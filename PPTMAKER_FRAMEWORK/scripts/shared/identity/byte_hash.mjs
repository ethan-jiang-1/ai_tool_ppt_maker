import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

export function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function sha256File(path, readFile = readFileSync) {
  return sha256Bytes(readFile(path));
}
