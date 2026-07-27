import { createHash } from "node:crypto";
import { decode as decodePng } from "fast-png";
import { discoverRuntimePackages, inspectHtmlRuntime } from "../../../00-setup/index.mjs";
import { captureHtmlPng } from "./framed_capture_runtime.mjs";

export const PAGE_AUTHORITY_FRAMED_RUNTIME_PROFILE = "page-authority-framed-runtime-v1";

function sha256(bytes) { return createHash("sha256").update(bytes).digest("hex"); }
function escapeHtml(value) { return String(value).replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function assertRaw(raw) {
  if (!raw || typeof raw !== "object" || !Buffer.isBuffer(raw.bytes) || raw.bytes.length === 0 || typeof raw.sha256 !== "string" || sha256(raw.bytes) !== raw.sha256) throw new Error("verified Framed raw PNG bytes are required");
  const png = decodePng(raw.bytes, { checkCrc: true });
  if (png.width !== 2000 || png.height !== 1125) throw new Error("Framed raw PNG must be exactly 2000x1125");
}

function framedHtml(receipt, raw) {
  const fields = receipt?.text_frame;
  if (!fields || fields.preset !== "standard-v1" || typeof fields.title !== "string" || !fields.title) throw new Error("a preflight-fit standard-v1 Framed Text Frame receipt is required");
  const image = raw.bytes.toString("base64");
  const optional = (name, value) => value ? `<div class="${name}" data-pm-leaf="${name}">${escapeHtml(value)}</div>` : "";
  return `<!doctype html><html><head><style>html,body{margin:0;width:1000px;height:562.5px;overflow:hidden}body{font-family:Arial,sans-serif}.slide{position:relative;width:1000px;height:562.5px;background:#111;color:#fff}.underlay{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.panel{position:absolute;left:0;width:100%;box-sizing:border-box;background:rgba(10,16,24,.88);padding:24px 40px}.header{top:0;min-height:143px}.kicker{font-size:14px;font-weight:700;color:#ffb000;margin-bottom:8px}.title{font-size:34px;font-weight:700;line-height:1.12}.subtitle{font-size:17px;line-height:1.25;margin-top:8px;color:#d9e4ee}.callout{bottom:0;min-height:48px;font-size:15px;line-height:20px}</style></head><body><main class="slide" data-pptmaker-slide><img class="underlay" alt="" src="data:image/png;base64,${image}"><section class="panel header">${optional("kicker", fields.kicker)}<div class="title" data-pm-leaf="title">${escapeHtml(fields.title)}</div>${optional("subtitle", fields.subtitle)}</section>${fields.callout ? `<section class="panel callout">${optional("callout", fields.callout)}</section>` : ""}</main></body></html>`;
}

/** Private protocol runtime: callers supply evidence only, never markup/CSS/options. */
export async function composePageAuthorityFramedPage({ receipt, verifiedRaw, preflight } = {}) {
  if (!preflight?.ok || preflight.authorization_allowed !== true) throw new Error("Framed preflight-fit evidence is required");
  assertRaw(verifiedRaw);
  const packages = await discoverRuntimePackages();
  if (!packages.playwright?.root || !packages.playwright?.version) throw new Error("paired Playwright runtime is unavailable");
  const runtimeEvidence = await inspectHtmlRuntime({ playwrightRoot: packages.playwright.root, playwrightVersion: packages.playwright.version });
  if (!runtimeEvidence.ok) throw new Error(`framed runtime is not ready: ${runtimeEvidence.error || "unknown"}`);
  const html = framedHtml(receipt, verifiedRaw);
  const leafs = ["kicker", "title", "subtitle", "callout"].filter((key) => receipt.text_frame?.[key]);
  const capture = await captureHtmlPng({ runtimeEvidence, html, expectedLeafMarkers: leafs, probeForbiddenRoutes: true });
  if (!capture.ok) throw new Error(`Framed composition failed during ${capture.phase}: ${capture.error}`);
  return Object.freeze({ bytes: Buffer.from(capture.bytes), sha256: capture.png.sha256, width: capture.png.width, height: capture.png.height, media_profile: `${PAGE_AUTHORITY_FRAMED_RUNTIME_PROFILE}/${capture.profile}`, runtime_profile: capture.runtimeProfile, font_evidence: capture.fonts, network: capture.network });
}
