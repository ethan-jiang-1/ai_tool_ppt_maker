import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import { extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { decode as decodePng } from "fast-png";
import jpeg from "jpeg-js";
import { SaxesParser } from "saxes";
import { isAlias, isMap, isScalar, parseAllDocuments } from "yaml";

export const HTML_ASSET_MANIFEST_VERSION = 2;
export const HTML_ASSET_ID_RE = /^[a-z][a-z0-9_]*(?:-[a-z0-9_]+)*$/;
const SHA_RE = /^[0-9a-f]{64}$/;
const MAX_RASTER_BYTES = 20 * 1024 * 1024;
const MAX_SVG_BYTES = 2 * 1024 * 1024;
const MAX_CATALOG_BYTES = 512 * 1024 * 1024;
const SVG_NS = "http://www.w3.org/2000/svg";
const XML_NUMBER = "[-+]?(?:[0-9]+(?:\\.[0-9]*)?|\\.[0-9]+)(?:[eE][-+]?[0-9]+)?";
const XML_NUMBER_RE = new RegExp(`^${XML_NUMBER}$`);
const VIEWBOX_RE = new RegExp(`^(${XML_NUMBER})[ ,\\t\\r\\n]+(${XML_NUMBER})[ ,\\t\\r\\n]+(${XML_NUMBER})[ ,\\t\\r\\n]+(${XML_NUMBER})$`);
const ID_RE = /^[A-Za-z_][A-Za-z0-9_.:-]*$/;
const LOCAL_FRAGMENT_RE = /^#[A-Za-z_][A-Za-z0-9_.:-]*$/;
const URL_FRAGMENT_RE = /^url\(#[A-Za-z_][A-Za-z0-9_.:-]*\)$/;
const ACTIVE_ELEMENTS = new Set(["script", "foreignObject", "style", "animate", "animateMotion", "animateTransform", "set", "discard"]);
const CANONICAL_ASSET_SUBDIRS = new Set(["svg", "reference", "icons"]);

export class HtmlAssetCatalogError extends Error {
  constructor(message, issues = []) {
    super(message);
    this.name = "HtmlAssetCatalogError";
    this.issues = issues;
  }
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function fail(kind, message, details = {}) {
  throw new HtmlAssetCatalogError(message, [{ kind, message, ...details }]);
}

function graphemes(value) {
  return [...new Intl.Segmenter("und", { granularity: "grapheme" }).segment(String(value))].length;
}

function validateString(value, field, max, { singleLine = false } = {}) {
  if (typeof value !== "string" || value !== value.trim() || !value) fail("invalid_manifest_field", `${field} must be a trimmed non-empty string`, { field });
  if ((singleLine && /\r|\n/.test(value)) || graphemes(value) > max) fail("invalid_manifest_field", `${field} exceeds its capacity`, { field });
}

function yamlNodeForbidden(node) {
  if (!node) return false;
  if (isAlias(node) || node.anchor || node.tag) return true;
  if (isMap(node)) return node.items.some((pair) => yamlNodeForbidden(pair.key) || yamlNodeForbidden(pair.value));
  if (Array.isArray(node.items)) return node.items.some(yamlNodeForbidden);
  return false;
}

function parseManifest(path) {
  const rawBytes = readFileSync(path);
  let raw;
  try { raw = new TextDecoder("utf-8", { fatal: true }).decode(rawBytes); }
  catch { fail("invalid_manifest_utf8", `manifest must be valid UTF-8: ${path}`, { path }); }
  if (raw.includes("\0")) fail("invalid_manifest_yaml", `manifest must not contain NUL: ${path}`, { path });
  if (/^(?:%|---(?:[ \t]|$)|\.\.\.(?:[ \t]|$))/m.test(raw)) fail("invalid_manifest_yaml", `manifest directives/document markers are forbidden: ${path}`, { path });
  const documents = parseAllDocuments(raw, { version: "1.2", schema: "core", uniqueKeys: true, merge: false, keepSourceTokens: true });
  if (documents.length !== 1) fail("invalid_manifest_yaml", `manifest must contain exactly one document: ${path}`, { path });
  const document = documents[0];
  const problems = [...document.errors, ...document.warnings];
  if (problems.length) fail("invalid_manifest_yaml", `${path}: ${problems[0].message.split("\n")[0]}`, { path });
  if (!isMap(document.contents) || yamlNodeForbidden(document.contents)) fail("invalid_manifest_yaml", `manifest must be a direct JSON-like mapping without aliases/tags: ${path}`, { path });
  const value = document.toJS({ mapAsMap: false });
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("invalid_manifest_root", `manifest root must be a mapping: ${path}`, { path });
  const rootKeys = Object.keys(value);
  if (rootKeys.length !== 2 || !rootKeys.includes("version") || !rootKeys.includes("assets")) fail("invalid_manifest_root", `manifest root keys must be version and assets: ${path}`, { path });
  if (value.version !== 2) fail("unsupported_manifest_version", `HTML-first manifest version must equal 2: ${path}`, { path, actual: value.version, expected: 2 });
  if (!value.assets || typeof value.assets !== "object" || Array.isArray(value.assets)) fail("invalid_manifest_assets", `manifest assets must be a mapping: ${path}`, { path });
  return { raw, value };
}

function confinedAssetPath(assetsDir, relpath, assetId) {
  validateString(relpath, `${assetId}.path`, 240, { singleLine: true });
  if (Buffer.byteLength(relpath, "utf8") > 240 || relpath.includes("\0") || relpath.includes("\\") || isAbsolute(relpath) || /^[A-Za-z]:/.test(relpath) || /^\/\//.test(relpath) || /^[a-z][a-z0-9+.-]*:/i.test(relpath)) {
    fail("asset_path_invalid", `asset ${assetId} path is not a confined POSIX-relative path`, { asset_id: assetId });
  }
  const parts = relpath.split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) fail("asset_path_invalid", `asset ${assetId} path contains an invalid segment`, { asset_id: assetId });
  if (parts.length < 2 || !CANONICAL_ASSET_SUBDIRS.has(parts[0])) fail("asset_path_invalid", `asset ${assetId} path must live under svg/, reference/, or icons/`, { asset_id: assetId });
  const root = resolve(assetsDir);
  const lexical = resolve(root, ...parts);
  const lexicalRel = relative(root, lexical);
  if (!lexicalRel || lexicalRel.startsWith(`..${sep}`) || lexicalRel === ".." || isAbsolute(lexicalRel)) fail("asset_path_escape", `asset ${assetId} escapes its assets directory`, { asset_id: assetId });
  if (!existsSync(lexical)) fail("asset_missing", `asset ${assetId} file is missing`, { asset_id: assetId });
  const real = realpathSync(lexical);
  const realRel = relative(realpathSync(root), real);
  if (!realRel || realRel.startsWith(`..${sep}`) || realRel === ".." || isAbsolute(realRel)) fail("asset_path_escape", `asset ${assetId} real path escapes its assets directory`, { asset_id: assetId });
  if (!statSync(real).isFile()) fail("asset_not_regular_file", `asset ${assetId} is not a regular file`, { asset_id: assetId });
  return { absolute: real, relative: relpath };
}

function pngEvidence(bytes, assetId) {
  if (bytes.length > MAX_RASTER_BYTES) fail("raster_too_large", `asset ${assetId} exceeds 20 MiB`, { asset_id: assetId });
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(signature)) fail("invalid_png", `asset ${assetId} has an invalid PNG signature`, { asset_id: assetId });
  if (bytes.readUInt32BE(8) !== 13 || bytes.subarray(12, 16).toString("ascii") !== "IHDR") fail("invalid_png", `asset ${assetId} must begin with IHDR`, { asset_id: assetId });
  const width = bytes.readUInt32BE(16); const height = bytes.readUInt32BE(20);
  if (width < 1 || height < 1 || width > 8192 || height > 8192) fail("invalid_dimensions", `asset ${assetId} dimensions are outside 1..8192`, { asset_id: assetId });
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.subarray(offset + 4, offset + 8).toString("ascii");
    if (["acTL", "fcTL", "fdAT"].includes(type)) fail("animated_raster_forbidden", `asset ${assetId} contains APNG animation`, { asset_id: assetId });
    offset += 12 + length;
    if (type === "IEND") break;
  }
  let decoded;
  try { decoded = decodePng(bytes, { checkCrc: true }); } catch (error) { fail("invalid_png", `asset ${assetId} PNG decode failed: ${error.message}`, { asset_id: assetId }); }
  if (decoded.width !== width || decoded.height !== height) fail("invalid_dimensions", `asset ${assetId} decoded dimensions differ from IHDR`, { asset_id: assetId });
  return { kind: "raster", bytes: bytes.length, width, height };
}

function jpegHeader(bytes, assetId) {
  if (bytes.length > MAX_RASTER_BYTES) fail("raster_too_large", `asset ${assetId} exceeds 20 MiB`, { asset_id: assetId });
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) fail("invalid_jpeg", `asset ${assetId} has an invalid JPEG SOI`, { asset_id: assetId });
  const sof = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let offset = 2;
  let dimensions = null;
  while (offset + 4 <= bytes.length) {
    while (offset < bytes.length && bytes[offset] !== 0xff) offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) break;
    const marker = bytes[offset++];
    if (marker === 0xd9 || marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) fail("invalid_jpeg", `asset ${assetId} has a truncated JPEG segment`, { asset_id: assetId });
    const payloadStart = offset + 2;
    if (marker === 0xe1 && bytes.subarray(payloadStart, payloadStart + 6).toString("binary") === "Exif\0\0") fail("jpeg_exif_forbidden", `asset ${assetId} contains EXIF orientation metadata`, { asset_id: assetId });
    if (sof.has(marker)) {
      if (length < 7) fail("invalid_jpeg", `asset ${assetId} has an invalid SOF`, { asset_id: assetId });
      dimensions = { height: bytes.readUInt16BE(payloadStart + 1), width: bytes.readUInt16BE(payloadStart + 3) };
      break;
    }
    offset += length;
  }
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > 8192 || dimensions.height > 8192) fail("invalid_dimensions", `asset ${assetId} JPEG dimensions are missing or outside 1..8192`, { asset_id: assetId });
  return dimensions;
}

function jpegEvidence(bytes, assetId) {
  const dimensions = jpegHeader(bytes, assetId);
  let decoded;
  try { decoded = jpeg.decode(bytes, { useTArray: true, tolerantDecoding: false, maxMemoryUsageInMB: 512 }); } catch (error) { fail("invalid_jpeg", `asset ${assetId} JPEG decode failed: ${error.message}`, { asset_id: assetId }); }
  if (decoded.width !== dimensions.width || decoded.height !== dimensions.height) fail("invalid_dimensions", `asset ${assetId} decoded dimensions differ from SOF`, { asset_id: assetId });
  return { kind: "raster", bytes: bytes.length, width: dimensions.width, height: dimensions.height };
}

function parseSvgSize(value, assetId, field) {
  if (value == null) return null;
  const match = new RegExp(`^(${XML_NUMBER})(px)?$`).exec(value);
  if (!match) fail("invalid_svg_dimensions", `asset ${assetId} ${field} is invalid`, { asset_id: assetId });
  const number = Number(match[1]);
  if (!Number.isFinite(number) || number <= 0 || number > 8192) fail("invalid_svg_dimensions", `asset ${assetId} ${field} is outside 0..8192`, { asset_id: assetId });
  return number;
}

function svgEvidence(bytes, assetId, { iconContext = false } = {}) {
  if (bytes.length > MAX_SVG_BYTES) fail("svg_too_large", `asset ${assetId} exceeds 2 MiB`, { asset_id: assetId });
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const ids = new Set(); const references = [];
  let root = null; let depth = 0; let elements = 0; let xmlDeclarationSeen = false;
  const parser = new SaxesParser({ xmlns: true, fragment: false });
  parser.on("doctype", () => fail("svg_doctype_forbidden", `asset ${assetId} contains a DOCTYPE`, { asset_id: assetId }));
  parser.on("processinginstruction", ({ target }) => {
    if (String(target).toLowerCase() !== "xml" || root || xmlDeclarationSeen) fail("svg_pi_forbidden", `asset ${assetId} contains a processing instruction`, { asset_id: assetId });
    xmlDeclarationSeen = true;
  });
  parser.on("opentag", (tag) => {
    depth += 1; elements += 1;
    if (depth > 128 || elements > 50000) fail("svg_complexity", `asset ${assetId} exceeds SVG complexity limits`, { asset_id: assetId });
    if (!root) root = tag;
    if (tag.uri !== SVG_NS) fail("svg_foreign_namespace", `asset ${assetId} contains foreign namespace element <${tag.local}>`, { asset_id: assetId });
    if (ACTIVE_ELEMENTS.has(tag.local)) fail("svg_active_content", `asset ${assetId} contains forbidden <${tag.local}>`, { asset_id: assetId });
    if (iconContext && tag.local === "text") fail("svg_text_forbidden", `asset ${assetId} icon contains <text>`, { asset_id: assetId });
    const attributes = Object.values(tag.attributes || {});
    if (attributes.length > 64) fail("svg_complexity", `asset ${assetId} element exceeds 64 attributes`, { asset_id: assetId });
    for (const attribute of attributes) {
      const local = attribute.local || attribute.name;
      const value = String(attribute.value);
      if (local === "style" || (attribute.uri === "http://www.w3.org/XML/1998/namespace" && local === "base") || /^on/i.test(local)) fail("svg_active_attribute", `asset ${assetId} contains forbidden attribute ${attribute.name}`, { asset_id: assetId });
      if (local === "id") {
        if (!ID_RE.test(value) || ids.has(value)) fail("svg_invalid_id", `asset ${assetId} has an invalid or duplicate id`, { asset_id: assetId });
        ids.add(value);
      }
      if (local === "href") {
        if (!LOCAL_FRAGMENT_RE.test(value)) fail("svg_external_reference", `asset ${assetId} href must be a local fragment`, { asset_id: assetId });
        references.push(value.slice(1));
      }
      if (local !== "style" && /url\(/i.test(value)) {
        const trimmed = value.trim();
        if (!URL_FRAGMENT_RE.test(trimmed)) fail("svg_external_reference", `asset ${assetId} url() must be one local fragment`, { asset_id: assetId });
        references.push(trimmed.slice(5, -1));
      }
    }
  });
  parser.on("closetag", () => { depth -= 1; });
  parser.on("error", (error) => { throw error; });
  try { parser.write(text).close(); } catch (error) {
    if (error instanceof HtmlAssetCatalogError) throw error;
    fail("invalid_svg", `asset ${assetId} SVG parse failed: ${error.message}`, { asset_id: assetId });
  }
  if (!root || root.local !== "svg" || root.uri !== SVG_NS) fail("invalid_svg_root", `asset ${assetId} root must be SVG namespace <svg>`, { asset_id: assetId });
  for (const reference of references) if (!ids.has(reference)) fail("svg_broken_fragment", `asset ${assetId} references missing #${reference}`, { asset_id: assetId });
  const rootAttrs = Object.values(root.attributes || {});
  const attr = (name) => rootAttrs.find((entry) => (entry.local || entry.name) === name)?.value ?? null;
  const width = parseSvgSize(attr("width"), assetId, "width");
  const height = parseSvgSize(attr("height"), assetId, "height");
  if ((width == null) !== (height == null)) fail("invalid_svg_dimensions", `asset ${assetId} must provide both width and height`, { asset_id: assetId });
  let viewBox = null;
  if (attr("viewBox") != null) {
    const match = VIEWBOX_RE.exec(attr("viewBox"));
    if (!match) fail("invalid_svg_dimensions", `asset ${assetId} viewBox is invalid`, { asset_id: assetId });
    viewBox = match.slice(1).map(Number);
    if (viewBox.some((number) => !Number.isFinite(number)) || viewBox[2] <= 0 || viewBox[3] <= 0 || viewBox[2] > 8192 || viewBox[3] > 8192) fail("invalid_svg_dimensions", `asset ${assetId} viewBox dimensions are invalid`, { asset_id: assetId });
  }
  if (!viewBox && width == null) fail("invalid_svg_dimensions", `asset ${assetId} needs viewBox or width/height`, { asset_id: assetId });
  return { kind: "svg", bytes: bytes.length, width: width ?? viewBox[2], height: height ?? viewBox[3], view_box: viewBox };
}

export function validateHtmlAssetBytes(bytes, { assetId, type, iconContext = false }) {
  if (type === "png") return pngEvidence(bytes, assetId);
  if (type === "jpg") return jpegEvidence(bytes, assetId);
  if (type === "svg") return svgEvidence(bytes, assetId, { iconContext });
  fail("unsupported_asset_type", `asset ${assetId} type is unsupported`, { asset_id: assetId });
}

function validateManifestEntries(manifest, { assetsDir, manifestPath, origin, runRoot }) {
  const entries = {};
  const ids = Object.keys(manifest.value.assets);
  if (ids.length > 512) fail("catalog_too_large", `${manifestPath} contains more than 512 entries`, { path: manifestPath });
  for (const assetId of ids) {
    if (!HTML_ASSET_ID_RE.test(assetId) || assetId.length > 64) fail("invalid_asset_id", `invalid asset ID ${assetId}`, { asset_id: assetId });
    const entry = manifest.value.assets[assetId];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) fail("invalid_asset_entry", `asset ${assetId} entry must be a mapping`, { asset_id: assetId });
    const expected = ["path", "type", "label", "description", "usage_guidance", "sha256"];
    const keys = Object.keys(entry);
    if (keys.length !== expected.length || keys.some((key) => !expected.includes(key))) fail("invalid_asset_entry", `asset ${assetId} fields must be ${expected.join(",")}`, { asset_id: assetId });
    validateString(entry.label, `${assetId}.label`, 80);
    validateString(entry.description, `${assetId}.description`, 400);
    validateString(entry.usage_guidance, `${assetId}.usage_guidance`, 600);
    if (!["svg", "png", "jpg"].includes(entry.type)) fail("unsupported_asset_type", `asset ${assetId} type is unsupported`, { asset_id: assetId });
    if (!SHA_RE.test(entry.sha256 || "")) fail("invalid_asset_sha", `asset ${assetId} sha256 must be lowercase hex`, { asset_id: assetId });
    if (extname(entry.path) !== `.${entry.type}`) fail("asset_extension_mismatch", `asset ${assetId} extension must match type`, { asset_id: assetId });
    const path = confinedAssetPath(assetsDir, entry.path, assetId);
    const bytes = readFileSync(path.absolute);
    const measured = sha256(bytes);
    if (measured !== entry.sha256) fail("asset_sha_mismatch", `asset ${assetId} SHA-256 mismatch`, { asset_id: assetId, actual: measured, expected: entry.sha256 });
    const media = validateHtmlAssetBytes(bytes, { assetId, type: entry.type });
    entries[assetId] = {
      origin,
      manifest_path: relative(runRoot, manifestPath).split(sep).join("/"),
      path: entry.path,
      type: entry.type,
      label: entry.label,
      description: entry.description,
      usage_guidance: entry.usage_guidance,
      media,
      declared_sha256: entry.sha256,
      measured_sha256: measured,
      absolute_path: path.absolute,
      manifest_absolute_path: manifestPath,
    };
  }
  return entries;
}

export function loadHtmlAssetCatalog(runDir) {
  const run = resolve(runDir);
  const runRoot = resolve(run, "..", "..");
  const layers = [
    { origin: "backbone", assetsDir: join(runRoot, "2_backbone", "visual-style", "assets") },
    { origin: "version", assetsDir: join(run, "overrides", "visual-style", "assets") },
  ];
  const catalog = {};
  const manifests = [];
  for (const layer of layers) {
    const manifestPath = join(layer.assetsDir, "asset-manifest.yaml");
    if (!existsSync(manifestPath)) continue;
    const manifest = parseManifest(manifestPath);
    manifests.push({ origin: layer.origin, path: manifestPath, raw: manifest.raw });
    Object.assign(catalog, validateManifestEntries(manifest, { ...layer, manifestPath, runRoot }));
  }
  const sorted = Object.fromEntries(Object.entries(catalog).sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0));
  if (Object.keys(sorted).length > 512) fail("catalog_too_large", "effective catalog contains more than 512 entries");
  const totalBytes = Object.values(sorted).reduce((sum, entry) => sum + entry.media.bytes, 0);
  if (totalBytes > MAX_CATALOG_BYTES) fail("catalog_bytes_exceeded", "effective catalog exceeds 512 MiB", { actual: totalBytes, expected: MAX_CATALOG_BYTES });
  return { catalog: sorted, manifests, total_bytes: totalBytes, run_root: runRoot };
}

export function assetEvidence(entry, assetId) {
  if (!entry) return null;
  return {
    asset_id: assetId,
    origin: entry.origin,
    manifest_path: entry.manifest_path,
    path: entry.path,
    type: entry.type,
    media: entry.media,
    declared_sha256: entry.declared_sha256,
    measured_sha256: entry.measured_sha256,
  };
}
