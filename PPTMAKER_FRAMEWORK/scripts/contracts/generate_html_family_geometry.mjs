#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHtmlFamilyGeometryRegistry } from "../02-visual-system/internal/html_family_geometry.mjs";

const directory = dirname(fileURLToPath(import.meta.url));
const target = join(directory, "html-family-geometry-v1.json");
writeFileSync(target, JSON.stringify(buildHtmlFamilyGeometryRegistry(), null, 2) + "\n", "utf8");
console.log(target);

