import { createHash } from "node:crypto";

function assertJsonValue(value, path = "$") {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new TypeError(`${path} must be a finite JSON number`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertJsonValue(item, `${path}[${index}]`));
    return;
  }
  if (typeof value === "object") {
    for (const key of Object.keys(value)) {
      if (value[key] === undefined) throw new TypeError(`${path}.${key} must not be undefined`);
      assertJsonValue(value[key], `${path}.${key}`);
    }
    return;
  }
  throw new TypeError(`${path} is not a JSON value`);
}

export function canonicalJson(value) {
  assertJsonValue(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

export function canonicalJsonSha256(value) {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

