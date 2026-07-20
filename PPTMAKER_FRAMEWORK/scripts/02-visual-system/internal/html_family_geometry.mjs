import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  HTML_FAMILY_GEOMETRY_ID,
  HTML_FAMILY_GEOMETRY_SCHEMA,
  HTML_LOGICAL_CANVAS,
  buildHtmlFamilyGeometryRegistry,
  htmlFamilyGeometrySemanticSha256,
  validateHtmlFamilyGeometryRegistry,
} from "../../contracts/html_family_geometry.mjs";

export {
  HTML_FAMILY_GEOMETRY_ID,
  HTML_FAMILY_GEOMETRY_SCHEMA,
  HTML_LOGICAL_CANVAS,
  buildHtmlFamilyGeometryRegistry,
  htmlFamilyGeometrySemanticSha256,
  validateHtmlFamilyGeometryRegistry,
};

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const HTML_FAMILY_GEOMETRY_PATH = resolve(MODULE_DIR, "..", "..", "contracts", "html-family-geometry-v1.json");

export function loadHtmlFamilyGeometryRegistry(path = HTML_FAMILY_GEOMETRY_PATH) {
  return validateHtmlFamilyGeometryRegistry(JSON.parse(readFileSync(path, "utf8")));
}
