import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalJsonSha256 } from "../../contracts/canonical_json.mjs";

export const HTML_FAMILY_GEOMETRY_SCHEMA = "pptmaker-html-family-geometry-v1";
export const HTML_FAMILY_GEOMETRY_ID = "html-family-geometry-v1";
export const HTML_LOGICAL_CANVAS = Object.freeze({ width: 1000, height: 562.5 });

const MODULE_DIR = dirname(fileURLToPath(import.meta.url));
export const HTML_FAMILY_GEOMETRY_PATH = resolve(
  MODULE_DIR,
  "..",
  "..",
  "contracts",
  "html-family-geometry-v1.json"
);

const HEADER = Object.freeze({
  kicker: [48, 24, 904, 20],
  title: [48, 48, 904, 70],
  subtitle: [48, 122, 904, 22],
});
const LEFT_NO_CALLOUT = [48, 158, 430, 330];
const RIGHT_NO_CALLOUT = [522, 158, 430, 330];
const LEFT_CALLOUT = [48, 150, 430, 280];
const RIGHT_CALLOUT = [522, 150, 430, 280];
const CALLOUT = [48, 454, 904, 62];

function contentBox(callout) {
  return callout ? [48, 150, 904, 280] : [48, 150, 904, 338];
}

function sideBoxes(callout) {
  return callout
    ? { left: [...LEFT_CALLOUT], right: [...RIGHT_CALLOUT] }
    : { left: [...LEFT_NO_CALLOUT], right: [...RIGHT_NO_CALLOUT] };
}

function columns(box, count, gap = 20) {
  const [x, y, width, height] = box;
  const cellWidth = (width - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => [
    x + index * (cellWidth + gap),
    y,
    cellWidth,
    height,
  ]);
}

function rows(box, count, gap = 16) {
  const [x, y, width, height] = box;
  const cellHeight = (height - gap * (count - 1)) / count;
  return Array.from({ length: count }, (_, index) => [
    x,
    y + index * (cellHeight + gap),
    width,
    cellHeight,
  ]);
}

function record(boxes, overlays = []) {
  return { boxes: { ...HEADER, ...boxes }, overlays };
}

function addCallout(boxes, callout) {
  return callout ? { ...boxes, callout: [...CALLOUT] } : boxes;
}

function fullBleedOverlays(fronts) {
  return fronts.map((front) => ({ back: "primary_visual", front }));
}

export function buildHtmlFamilyGeometryRegistry() {
  const variants = {};
  const put = (key, value) => { variants[key] = value; };

  for (const statement of [0, 1]) for (const support of [0, 1]) {
    for (const visual of [0, 1]) for (const callout of [0, 1]) {
      const names = [];
      if (statement) names.push("hero_statement");
      if (support) names.push("supporting_line");
      const bodyRows = rows(contentBox(callout), Math.max(1, names.length));
      const body = Object.fromEntries(names.map((name, index) => [name, bodyRows[index]]));
      const boxes = addCallout({
        ...body,
        ...(visual ? { primary_visual: [0, 0, 1000, 562.5] } : {}),
      }, callout);
      const fronts = ["kicker", "title", "subtitle", ...names, ...(callout ? ["callout"] : [])];
      put(
        `hero--statement${statement}--support${support}--visual${visual}--callout${callout}`,
        record(boxes, visual ? fullBleedOverlays(fronts) : [])
      );
    }
  }

  for (const callout of [0, 1]) {
    const sides = sideBoxes(callout);
    put(`split--text-text--callout${callout}`, record(addCallout(sides, callout)));
    for (const placement of ["left", "right"]) {
      const textSide = placement === "left" ? "right" : "left";
      put(
        `split--text-visual-${placement}--callout${callout}`,
        record(addCallout({ text: sides[textSide], primary_visual: sides[placement] }, callout))
      );
    }
  }

  for (const family of ["cards", "kpi", "flow", "timeline"]) {
    const singular = { cards: "card", kpi: "metric", flow: "step", timeline: "step" }[family];
    const counts = family === "kpi" ? [1, 2, 3] : family === "cards" ? [2, 3, 4] : [3, 4, 5];
    for (const count of counts) for (const callout of [0, 1]) {
      const itemBoxes = columns(contentBox(callout), count, 20);
      const boxes = Object.fromEntries(itemBoxes.map((box, index) => [`${singular}_${index + 1}`, box]));
      put(`${family}--n${count}--callout${callout}`, record(addCallout(boxes, callout)));
    }
  }

  for (const callout of [0, 1]) {
    put(`comparison--callout${callout}`, record(addCallout(sideBoxes(callout), callout)));
  }

  for (const insight of [0, 1]) for (const callout of [0, 1]) {
    const c = contentBox(callout);
    const boxes = insight
      ? { chart: [48, c[1], 616, c[3]], insight: [688, c[1], 264, c[3]] }
      : { chart: c };
    put(`data--insight${insight}--callout${callout}`, record(addCallout(boxes, callout)));
  }

  for (const supporting of [0, 1]) for (const visual of ["none", "left", "right"]) {
    for (const callout of [0, 1]) {
      const c = contentBox(callout);
      const sides = sideBoxes(callout);
      const quoteBox = visual === "none" ? c : sides[visual === "left" ? "right" : "left"];
      const boxes = {};
      if (visual !== "none") boxes.primary_visual = sides[visual];
      if (supporting) {
        boxes.quote = [quoteBox[0], quoteBox[1], quoteBox[2], quoteBox[3] - 86];
        boxes.supporting = [quoteBox[0], quoteBox[1] + quoteBox[3] - 70, quoteBox[2], 70];
      } else {
        boxes.quote = quoteBox;
      }
      put(
        `quote--support${supporting}--visual-${visual}--callout${callout}`,
        record(addCallout(boxes, callout))
      );
    }
  }

  for (const caption of [0, 1]) for (const callout of [0, 1]) {
    const c = contentBox(callout);
    const boxes = caption
      ? {
          primary_visual: [c[0], c[1], c[2], c[3] - 92],
          caption: [c[0], c[1] + c[3] - 76, c[2], 76],
        }
      : { primary_visual: c };
    put(`visual-focus--caption${caption}--callout${callout}`, record(addCallout(boxes, callout)));
  }

  return {
    schema: HTML_FAMILY_GEOMETRY_SCHEMA,
    canvas: { ...HTML_LOGICAL_CANVAS },
    variants: Object.fromEntries(Object.entries(variants).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)),
  };
}

function assertBox(box, context) {
  if (!Array.isArray(box) || box.length !== 4 || box.some((value) => !Number.isFinite(value))) {
    throw new Error(`${context} must be [x,y,width,height] finite numbers`);
  }
  const [x, y, width, height] = box;
  if (width <= 0 || height <= 0 || x < 0 || y < 0 || x + width > 1000 || y + height > 562.5) {
    throw new Error(`${context} is outside the logical canvas`);
  }
}

export function validateHtmlFamilyGeometryRegistry(registry) {
  if (!registry || registry.schema !== HTML_FAMILY_GEOMETRY_SCHEMA) throw new Error("invalid geometry schema");
  if (JSON.stringify(registry.canvas) !== JSON.stringify(HTML_LOGICAL_CANVAS)) throw new Error("invalid geometry canvas");
  const expected = buildHtmlFamilyGeometryRegistry();
  const keys = Object.keys(registry.variants || {});
  if (keys.length !== 68) throw new Error(`geometry registry must contain 68 variants; got ${keys.length}`);
  for (const [key, expectedRecord] of Object.entries(expected.variants)) {
    const actual = registry.variants[key];
    if (!actual) throw new Error(`missing geometry variant ${key}`);
    if (JSON.stringify(actual) !== JSON.stringify(expectedRecord)) throw new Error(`geometry variant ${key} differs from formula`);
    for (const [name, box] of Object.entries(actual.boxes || {})) assertBox(box, `${key}.boxes.${name}`);
  }
  if (keys.some((key) => !Object.hasOwn(expected.variants, key))) throw new Error("geometry registry has an unknown variant");
  return registry;
}

export function loadHtmlFamilyGeometryRegistry(path = HTML_FAMILY_GEOMETRY_PATH) {
  return validateHtmlFamilyGeometryRegistry(JSON.parse(readFileSync(path, "utf8")));
}

export function htmlFamilyGeometrySemanticSha256(registry) {
  return canonicalJsonSha256(validateHtmlFamilyGeometryRegistry(registry));
}
