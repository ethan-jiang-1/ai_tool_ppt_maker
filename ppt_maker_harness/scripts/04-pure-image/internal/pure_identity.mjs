import {
  resolvePageImagePresentation,
  createPageImageSourceResolver,
  loadPageImagePresentationPackage,
  loadPageImageVisualLanguage,
} from "../../02-visual-system/index.mjs";
import { parsePageImageSource } from "../../01-content/index.mjs";
import {
  bindStyleMasterScopeCandidate,
  resolveStyleMasterScopeContext,
} from "../../shared/image2/style_master_scope.mjs";
import {
  resolveTargetSourceContext,
  resolveTargetCandidateSourceContext,
} from "../../shared/image2/page_image_target_runtime.mjs";
import { PureImageWorkflowError } from "../index.mjs";

function parsePureTargetReceipt({ runDir, deckDir, sourcePath, sourceText }) {
  const visualLanguage = loadPageImageVisualLanguage(deckDir);
  const presentationPackage = loadPageImagePresentationPackage(runDir);
  const visualResolver = createPageImageSourceResolver({ deckDir, visualLanguage });
  return parsePageImageSource(sourceText, {
    source: sourcePath,
    registry: {
      resolveSelection(context) {
        return Object.freeze({
          ...visualResolver.resolveSelection(context),
          presentation: resolvePageImagePresentation({
            package: presentationPackage,
            workflow: context.workflow,
            pageClass: context.page_class,
            headerPolicy: context.header_policy,
          }),
        });
      },
    },
  });
}

export { parsePureTargetReceipt };

/** Resolve and bind the selected Pure source without compiling raw work. */
export function resolvePureTargetSource(runDir, { allowSourceRebuild = false } = {}) {
  return resolveTargetSourceContext(runDir, {
    workflow: "pure",
    parseReceipt: parsePureTargetReceipt,
    allowSourceRebuild,
  });
}

/** Resolve the selected Pure source without state or artifact materialization. */
export function resolvePureTargetCandidateSource(runDir) {
  return resolveTargetCandidateSourceContext(runDir, {
    workflow: "pure",
    parseReceipt: parsePureTargetReceipt,
  });
}

/** Resolve Pure's exact Style Master scope without materializing page lineage. */
export function resolvePureStyleMasterScope(runDir) {
  // Parse the selected Pure source first so its deck-owned visual-system
  // prerequisite fails before any Style Master scope/readiness path.
  const sourceCandidate = resolvePureTargetCandidateSource(runDir);
  const scope = resolveStyleMasterScopeContext(runDir, { sourceCandidate });
  if (scope.workflow !== "pure") {
    throw new PureImageWorkflowError("wrong_workflow_owner", "Pure Style Master scope requires the selected pure workflow");
  }
  return bindStyleMasterScopeCandidate(scope, sourceCandidate);
}