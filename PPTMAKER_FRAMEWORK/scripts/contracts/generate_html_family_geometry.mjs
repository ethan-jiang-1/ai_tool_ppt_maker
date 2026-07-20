import { buildHtmlFamilyGeometryRegistry } from "./html_family_geometry.mjs";

export function generateHtmlFamilyGeometryBytes() {
  return `${JSON.stringify(buildHtmlFamilyGeometryRegistry(), null, 2)}\n`;
}
