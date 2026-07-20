import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, extname, relative, resolve, sep } from "node:path";

const root = resolve(process.cwd());
const moved = new Map(Object.entries({
  "PPTMAKER_FRAMEWORK/scripts/lib/cli_bootstrap.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_bootstrap.mjs",
  "PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/cli/cli_error.mjs",
  "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/bundle_layout.mjs",
  "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/lessons.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/production_marker.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/run-bundle/production_marker.mjs",
  "PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/state/state.mjs",
  "PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/state/md_controller_reader.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_review_evidence.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/state/html_review_evidence.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/canonical_json.mjs": "PPTMAKER_FRAMEWORK/scripts/contracts/canonical_json.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/notes_receipt.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/identity/notes_receipt.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/render_artifacts.mjs": "PPTMAKER_FRAMEWORK/scripts/shared/identity/render_artifacts.mjs",
  "PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs": "PPTMAKER_FRAMEWORK/scripts/00-setup/env-check.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_runtime.mjs": "PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_runtime_profile.mjs": "PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_runtime_profile.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_fonts.mjs": "PPTMAKER_FRAMEWORK/scripts/00-setup/internal/html_fonts.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/slide_document.mjs": "PPTMAKER_FRAMEWORK/scripts/01-content/internal/slide_document.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/slide_ids.mjs": "PPTMAKER_FRAMEWORK/scripts/01-content/internal/slide_ids.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/render_policy.mjs": "PPTMAKER_FRAMEWORK/scripts/01-content/internal/render_policy.mjs",
  "PPTMAKER_FRAMEWORK/scripts/asset_manifest.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/asset_manifest.mjs",
  "PPTMAKER_FRAMEWORK/scripts/visual_config.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/visual_config.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/deck_system.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/deck_system.mjs",
  "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_asset_catalog.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_asset_catalog.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_chart_svg.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_chart_svg.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_component_registry.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_component_registry.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_family_geometry.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_family_geometry.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_visual_tokens.mjs": "PPTMAKER_FRAMEWORK/scripts/02-visual-system/internal/html_visual_tokens.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage1_build_inputs.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage1_build_inputs.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage2_render_html.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage3_compose_slides.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage3_compose_slides.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage4_build_pptx.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage4_build_pptx.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage5_inject_notes.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/stage5_inject_notes.mjs",
  "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/unified_pipeline.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_object_store.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_object_store.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_preview.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_preview.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_render_runtime.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_render_runtime.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_slide_contract.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_contract.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_slide_renderer.mjs": "PPTMAKER_FRAMEWORK/scripts/03-html-production/internal/html_slide_renderer.mjs",
  "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/generate_style_master.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/generate_style_master.mjs",
  "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/make_contact_sheet.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/make_contact_sheet.mjs",
  "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/stage2_generate_images.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/stage2_generate_images.mjs",
  "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/stage3_lock_headers.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/stage3_lock_headers.mjs",
  "PPTMAKER_FRAMEWORK/scripts/image_api_client.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/internal/image_api_client.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/image_provenance.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/internal/image_provenance.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/header_review.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/legacy-image2/internal/header_review.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/structural_reuse.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/structural/structural_reuse.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/html_migration.mjs": "PPTMAKER_FRAMEWORK/scripts/05-iteration/migration/html_migration.mjs",
  "PPTMAKER_FRAMEWORK/scripts/lib/framework_coherence.mjs": "PPTMAKER_FRAMEWORK/scripts/contracts/framework_coherence.mjs"
}));
const inverse = new Map([...moved].map(([oldPath, newPath]) => [newPath, oldPath]));

function posix(path) { return path.split(sep).join("/"); }
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = resolve(dir, name);
    if (statSync(path).isDirectory()) walk(path, out); else out.push(path);
  }
  return out;
}
function localSpecifier(from, to) {
  let value = posix(relative(dirname(resolve(root, from)), resolve(root, to)));
  if (!value.startsWith(".")) value = `./${value}`;
  return value;
}

for (const base of ["PPTMAKER_FRAMEWORK/scripts", "tests", "tests_e2e"]) {
  for (const absolute of walk(resolve(root, base))) {
    if (extname(absolute) !== ".mjs") continue;
    const current = posix(relative(root, absolute));
    const original = inverse.get(current) || current;
    const source = readFileSync(absolute, "utf8");
    const rewritten = source.replace(/(["'])(\.{1,2}\/[^"']+)(\1)/g, (whole, quote, raw) => {
      const [specifier, query = ""] = raw.split(/(?=[?#])/);
      const oldTarget = posix(relative(root, resolve(root, dirname(original), specifier)));
      const newTarget = moved.get(oldTarget);
      if (!newTarget) return whole;
      return `${quote}${localSpecifier(current, newTarget)}${query}${quote}`;
    });
    if (rewritten !== source) writeFileSync(absolute, rewritten);
  }
}
