/**
 * cli_artifact_view.mjs — human-facing artifact reference composition for the
 * direct CLI (artifacts/status projections). Mechanical move from
 * command_support.mjs; no behavior changes.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";
import { pageImageWorkflowPaths } from "../run-bundle/bundle_layout.mjs";
import { pageImageOrdinalImageFilename } from "../image2/page_image_artifacts.mjs";
import { writeHumanArtifactNavigation } from "../image2/page_image_human_artifact_reference.mjs";
import { resolveContentAddressName } from "../image2/content_address_store.mjs";
import { inspectCurrentFinalSlideManifestFromRun } from "../image2/page_image_final_manifest.mjs";
import {
  deliveryReceiptSha256,
  inspectCurrentTargetPageImageDelivery,
} from "../../05-delivery/index.mjs";
import { PAGE_IMAGE_HASH_RE } from "./command_support.mjs";

export async function targetImage2Operations(workflow) {
  if (workflow === "framed") {
    const owner = await import("../../03-framed-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolveFramedTargetSource,
      resolveCandidateSource: owner.resolveFramedTargetCandidateSource,
      resolveStyleMasterScope: owner.resolveFramedStyleMasterScope,
      buildPlan: owner.buildFramedProgressiveTargetRawPlan,
      readStoredPlan: owner.readFramedProgressiveTargetStoredPlanContext,
      projectPlan: owner.framedProgressiveRawPlanProjection,
      pilot: owner.planFramedTargetPilot,
      expansion: owner.planFramedTargetExpansion,
      authorize: owner.authorizeFramedProgressiveRawBatch,
      generate: owner.generateFramedProgressiveRawItem,
      pilotReview: owner.prepareFramedProgressivePilotReview,
      pilotAccept: owner.acceptFramedProgressivePilot,
      review: owner.prepareFramedProgressiveRawReview,
      accept: owner.acceptFramedProgressiveRawReview,
      reconcile: owner.reconcileFramedProgressiveRawAttempt,
      inspectPilotReview: owner.inspectFramedProgressivePilotPageReview,
      inspectCurrentReview: owner.inspectFramedProgressiveCurrentCompletePageReview,
      inspectAcceptedReview: owner.inspectFramedProgressiveCompletePageReview,
      buildDelivery: owner.buildFramedProgressiveTargetDelivery,
      refreshFramedText: owner.refreshFramedTargetText,
      refreshNotes: owner.refreshFramedTargetNotes,
    });
  }
  if (workflow === "pure") {
    const owner = await import("../../04-pure-image/index.mjs");
    return Object.freeze({
      resolveSource: owner.resolvePureTargetSource,
      resolveCandidateSource: owner.resolvePureTargetCandidateSource,
      resolveStyleMasterScope: owner.resolvePureStyleMasterScope,
      buildPlan: owner.buildPureProgressiveTargetRawPlan,
      readStoredPlan: owner.readPureProgressiveTargetStoredPlanContext,
      projectPlan: owner.pureProgressiveRawPlanProjection,
      pilot: owner.planPureTargetPilot,
      expansion: owner.planPureTargetExpansion,
      authorize: owner.authorizePureProgressiveRawBatch,
      generate: owner.generatePureProgressiveRawItem,
      pilotReview: owner.preparePureProgressivePilotReview,
      pilotAccept: owner.acceptPureProgressivePilot,
      review: owner.preparePureProgressiveRawReview,
      accept: owner.acceptPureProgressiveRawReview,
      reconcile: owner.reconcilePureProgressiveRawAttempt,
      inspectPilotReview: owner.inspectPureProgressivePilotPageReview,
      inspectCurrentReview: owner.inspectPureProgressiveCurrentCompletePageReview,
      inspectAcceptedReview: owner.inspectPureProgressiveCompletePageReview,
      buildDelivery: owner.buildPureProgressiveTargetDelivery,
      refreshNotes: owner.refreshPureTargetNotes,
    });
  }
  const error = new Error("Target Page Image workflow is unavailable");
  error.code = "TARGET_WORKFLOW_REQUIRED";
  throw error;
}
export async function refreshProgressiveControllerTaskProjection(runDir, { workflowInspection = null, state = null } = {}) {
  const inspection = workflowInspection || (await import("../../shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir });
  const { progressiveControllerTaskProjectionEligibility } = await import("../../shared/workflow/progressive_controller_task_projection_eligibility.mjs");
  const eligibility = progressiveControllerTaskProjectionEligibility({ runDir, inspection, state });
  if (!eligibility.eligible) return Object.freeze({ status: "not-applicable" });
  const { refreshPageProductionTaskProjection } = await import("../../shared/workflow/page_production_task_projection.mjs");
  return refreshPageProductionTaskProjection({ runDir, inspection, state: eligibility.state });
}
export async function advanceProgressiveControllerCheckpoint(route, { workflowInspection = null } = {}) {
  const inspection = workflowInspection || (await import("../../shared/workflow/inspect_workflow.mjs"))
    .inspectWorkflow({ runDir: route.run_dir });
  const { progressiveControllerCheckpoint } = await import("../../shared/workflow/progressive_controller_task_projection_eligibility.mjs");
  let checkpoint = null;
  try {
    checkpoint = progressiveControllerCheckpoint(inspection);
  } catch {
    return Object.freeze({ status: "skipped", reason: "checkpoint-unavailable" });
  }
  if (!checkpoint?.controller_node) {
    return Object.freeze({ status: "skipped", reason: "no-controller-node" });
  }
  const action = inspection?.primary_action || {};
  const planHash = typeof action.plan_hash === "string" && PAGE_IMAGE_HASH_RE.test(action.plan_hash) ? action.plan_hash : null;
  const batchHash = typeof action.batch_hash === "string" && PAGE_IMAGE_HASH_RE.test(action.batch_hash) ? action.batch_hash : null;
  const planShort = planHash ? planHash.slice(0, 8) : null;
  const batchShort = batchHash ? batchHash.slice(0, 8) : null;
  const { recordTargetProgressiveCheckpointCliHandoff } = await import("../../shared/state/state.mjs");
  const handoff = recordTargetProgressiveCheckpointCliHandoff(route.deck_dir, {
    runDir: route.run_dir,
    checkpoint_node: checkpoint.controller_node,
    action_id: checkpoint.action_id,
    plan_hash: planHash,
    batch_hash: batchHash,
    requires_human: checkpoint.requires_human,
    waiting_for: checkpoint.requires_human
      ? `Human decision on ${checkpoint.action_id}${planShort ? ` for plan ${planShort}` : ""}${batchShort ? ` batch ${batchShort}` : ""}`
      : null,
  });
  return Object.freeze({ status: handoff.status, handoff, checkpoint });
}
export function artifactReferenceEntry({ label, artifactType, purpose, locator, kind, sha256 }) {
  return Object.freeze({
    label,
    artifact_type: artifactType,
    purpose,
    locator,
    reference: Object.freeze({ kind, sha256 }),
  });
}
export function artifactUnavailable(category, reason) {
  return Object.freeze({ category, reason });
}
export function pageArtifactGroup(position, slideId, artifacts) {
  return Object.freeze({ position, slide_id: slideId, artifacts: Object.freeze(artifacts) });
}
export async function rebuildTargetPageImageArtifactView(route) {
  const operations = await targetImage2Operations(route.workflow);
  const styleMasterOwner = await import("../../shared/image2/style_master_plan.mjs");
  const styleScope = operations.resolveStyleMasterScope(route.run_dir);
  const pendingSuccessor = await styleMasterOwner.inspectPendingStyleMasterSuccessorCandidateArtifacts({
    scope: styleScope,
  });
  const paths = pageImageWorkflowPaths(route.run_dir);

  if (pendingSuccessor) {
    const styleMaster = [];
    const unavailable = [];
    for (const candidate of pendingSuccessor.candidates) {
      if (candidate.availability === "available") {
        styleMaster.push(artifactReferenceEntry({
          label: candidate.candidate_id,
          artifactType: candidate.candidate_media_type,
          purpose: "Inspect this pending Style Master candidate; it is not accepted for raw work.",
          locator: candidate.locator,
          kind: "style",
          sha256: candidate.candidate_sha256,
        }));
        continue;
      }
      unavailable.push(artifactUnavailable(
        `Style Master candidate ${candidate.candidate_id}`,
        `generated candidate lifecycle is ${candidate.lifecycle_state}; verified media is unavailable`,
      ));
    }
    unavailable.push(
      artifactUnavailable("Provider input", "a pending Style Master successor has no current raw plan"),
      artifactUnavailable("Raw and Complete Page Review", "a pending Style Master successor has no current raw plan"),
      artifactUnavailable("Final media", "a pending Style Master successor is not accepted for raw work"),
      artifactUnavailable("Delivery", "a pending Style Master successor is not accepted for delivery"),
    );
    const output = writeHumanArtifactNavigation({
      run_dir: route.run_dir,
      workflow: route.workflow,
      style_master: styleMaster,
      page_artifacts: [],
      deck_artifacts: [],
      unavailable,
    });
    return Object.freeze({
      ...output,
      pending_successor: Object.freeze({ next_action: pendingSuccessor.next_action }),
    });
  }

  const rawOwner = await import("../../shared/image2/page_image_progressive_raw_owner.mjs");
  const candidate = operations.resolveCandidateSource(route.run_dir);
  const styleInspection = await styleMasterOwner.inspectStyleMasterCandidates({ scope: styleScope });
  const styleMaster = [];
  const deckArtifacts = [];
  const pageById = new Map();
  const unavailable = [];

  if (styleInspection.selection) {
    const selected = styleMasterOwner.resolveAcceptedStyleMasterReference({
      runDir: route.run_dir,
      receipt: candidate.receipt,
    });
    styleMaster.push(artifactReferenceEntry({
      label: selected.candidate_id,
      artifactType: selected.candidate_media_type,
      purpose: "Inspect the current accepted Style Master candidate.",
      locator: selected.candidate_path,
      kind: "style",
      sha256: selected.candidate_sha256,
    }));
  } else {
    unavailable.push(artifactUnavailable("Style Master", "no current accepted Style Master candidate is available"));
  }

  const rawInspection = rawOwner.inspectProgressiveRawLifecycle({
    runDir: route.run_dir,
    workflow: route.workflow,
  });
  if (!rawInspection.ok) {
    const error = new Error("current progressive raw lifecycle is invalid");
    error.code = rawInspection.code;
    throw error;
  }
  if (!rawInspection.plan) {
    unavailable.push(
      artifactUnavailable("Provider input", "no current raw plan has been published"),
      artifactUnavailable("Raw and Complete Page Review", "no current raw plan has been published"),
      artifactUnavailable("Final media", "no accepted raw evidence is available"),
      artifactUnavailable("Delivery", "no delivery receipt is available"),
    );
    return writeHumanArtifactNavigation({
      run_dir: route.run_dir,
      workflow: route.workflow,
      style_master: styleMaster,
      page_artifacts: [],
      deck_artifacts: deckArtifacts,
      unavailable,
    });
  }

  // This public selected-workflow reader revalidates the current source/plan binding.
  const stored = operations.readStoredPlan(route.run_dir);
  const currentRaw = rawOwner.inspectProgressiveRawLifecycle({
    runDir: route.run_dir,
    workflow: route.workflow,
    expected_plan: stored.progressive_raw_work_plan,
  });
  if (!currentRaw.ok || !currentRaw.plan) {
    const error = new Error("current progressive raw plan is unavailable");
    error.code = currentRaw.code || "progressive_raw_owner_invalid";
    throw error;
  }
  deckArtifacts.push(artifactReferenceEntry({
    label: "current raw work plan",
    artifactType: "Page Image raw work plan",
    purpose: "Inspect the current provider-free raw lifecycle scope.",
    locator: paths.target_raw_plan,
    kind: "plan",
    sha256: currentRaw.plan.plan_hash,
  }));
  if (existsSync(paths.target_provider_request_inspection)) {
    unavailable.push(artifactUnavailable("Provider input", "detailed provider input remains outside Human Navigation"));
  } else {
    unavailable.push(artifactUnavailable("Provider input", "the current raw plan has no provider-input inspection projection"));
  }

  const pilotReview = operations.inspectPilotReview(route.run_dir);
  if (pilotReview.available) {
    const reviewRoot = join(paths.review_root, "pilot", resolveContentAddressName(join(paths.review_root, "pilot"), pilotReview.batch.sha256));
    for (const slideId of pilotReview.batch.review_sample_slide_ids) {
      const position = stored.progressive_raw_work_plan.ordered_slide_ids.indexOf(slideId) + 1;
      const filename = pageImageOrdinalImageFilename(position, slideId);
      const existing = pageById.get(slideId);
      const pageArtifacts = [
        ...(existing?.artifacts || []),
        artifactReferenceEntry({
          label: "Pilot provider page",
          artifactType: "Pilot Page Review provider PNG",
          purpose: "Inspect the current Pilot provider-rendered page.",
          locator: join(reviewRoot, "provider-page", filename),
          kind: "review",
          sha256: pilotReview.pilot_evidence_sha256,
        }),
      ];
      if (pilotReview.presentation.presentation.has_complete_page_artifact) {
        pageArtifacts.push(artifactReferenceEntry({
          label: "Framed Pilot page",
          artifactType: "production-equivalent Pilot PNG",
          purpose: "Inspect the Framed Pilot page with its validated header overlay.",
          locator: join(reviewRoot, "complete-page", filename),
          kind: "review",
          sha256: pilotReview.pilot_evidence_sha256,
        }));
      }
      pageById.set(slideId, pageArtifactGroup(position, slideId, pageArtifacts));
    }
    deckArtifacts.push(artifactReferenceEntry({
      label: "Pilot Page Review contact sheet",
      artifactType: "Pilot Page Review contact-sheet PNG",
      purpose: "Inspect the current Pilot review across its selected sample.",
      locator: join(reviewRoot, "pilot-page-review.png"),
      kind: "review",
      sha256: pilotReview.presentation.projection_sha256,
    }));
  } else {
    unavailable.push(artifactUnavailable("Pilot Page Review", "a current partial Pilot review is not available"));
  }

  const currentReview = operations.inspectCurrentReview(route.run_dir);
  let acceptedReview = null;
  const completeReview = currentReview.available
    ? currentReview
    : currentRaw.evidence?.accepted_raw_evidence_sha256
      ? operations.inspectAcceptedReview(route.run_dir)
      : null;
  if (completeReview) {
    const review = completeReview.presentation;
    const reviewRoot = join(paths.review_root, "complete-page", resolveContentAddressName(join(paths.review_root, "complete-page"), completeReview.raw.plan.sha256));
    const isCurrentReview = currentReview.available;
    for (const [index, slideId] of completeReview.raw.plan.ordered_slide_ids.entries()) {
      const filename = pageImageOrdinalImageFilename(index + 1, slideId);
      const existing = pageById.get(slideId);
      const pageArtifacts = [
        ...(existing?.artifacts || []),
        artifactReferenceEntry({
          label: isCurrentReview ? "current provider page" : "provider page",
          artifactType: "Complete Page Review provider PNG",
          purpose: isCurrentReview
            ? "Inspect the current provider-rendered page before the Complete Page Review decision."
            : "Inspect the accepted provider-rendered page in the complete-page review.",
          locator: join(reviewRoot, "provider-page", filename),
          kind: "review",
          sha256: completeReview.raw.complete_raw_review_sha256,
        }),
      ];
      if (review.has_complete_page_artifact) {
        pageArtifacts.push(artifactReferenceEntry({
          label: isCurrentReview ? "current Framed complete page" : "Framed complete page",
          artifactType: "production-equivalent complete-page PNG",
          purpose: isCurrentReview
            ? "Inspect the current Framed provider page with its validated header overlay before the Complete Page Review decision."
            : "Inspect the Framed provider page with its validated header overlay.",
          locator: join(reviewRoot, "complete-page", filename),
          kind: "review",
          sha256: completeReview.raw.complete_raw_review_sha256,
        }));
      }
      pageById.set(slideId, pageArtifactGroup(existing?.position || index + 1, slideId, pageArtifacts));
    }
    deckArtifacts.push(artifactReferenceEntry({
      label: "Complete Page Review contact sheet",
      artifactType: "Complete Page Review contact-sheet PNG",
      purpose: isCurrentReview
        ? "Inspect the current complete-page review across the full plan before its decision."
        : "Inspect the accepted complete-page review across the full plan.",
      locator: join(reviewRoot, "complete-page-review.png"),
      kind: "review",
      sha256: review.projection_sha256,
    }));
    if (!isCurrentReview) acceptedReview = completeReview;
  } else {
    unavailable.push(artifactUnavailable("Complete Page Review", "no current undecided or accepted complete-page review evidence is available"));
  }

  let finalInspection = null;
  if (acceptedReview) {
    finalInspection = inspectCurrentFinalSlideManifestFromRun({
      runDir: route.run_dir,
      rawWorkPlan: acceptedReview.raw.plan,
      acceptedRawEvidence: acceptedReview.raw.accepted_raw_evidence,
    });
    if (finalInspection.available) {
      for (const item of finalInspection.manifest.items) {
        const group = pageById.get(item.slide_id);
        if (!group) continue;
        pageById.set(item.slide_id, pageArtifactGroup(group.position, group.slide_id, [
          ...group.artifacts,
          artifactReferenceEntry({
            label: "final slide",
            artifactType: "final PNG",
            purpose: "Inspect the exact final page media used for delivery.",
            locator: join(paths.final_root, item.path),
            kind: "manifest",
            sha256: finalInspection.manifest_sha256,
          }),
        ]));
      }
    } else {
      unavailable.push(artifactUnavailable("Final media", "a current final manifest has not been published"));
    }
  } else {
    unavailable.push(artifactUnavailable("Final media", "accepted complete-page review evidence is not available"));
  }

  const delivery = await inspectCurrentTargetPageImageDelivery({ runDir: route.run_dir });
  if (delivery.available) {
    const deliverySha256 = deliveryReceiptSha256(delivery.receipt);
    for (const entry of delivery.delivery_media.manifest.entries) {
      const group = pageById.get(entry.slide_id);
      if (!group) continue;
      pageById.set(entry.slide_id, pageArtifactGroup(group.position, group.slide_id, [
        ...group.artifacts,
        artifactReferenceEntry({
          label: "delivery slide",
          artifactType: "delivery JPEG",
          purpose: "Inspect the JPEG image embedded in the delivered PPTX.",
          locator: delivery.delivery_media.media_by_slide[entry.slide_id].path,
          kind: "delivery",
          sha256: deliverySha256,
        }),
      ]));
    }
    deckArtifacts.push(
      artifactReferenceEntry({
        label: "delivered PPTX",
        artifactType: "PPTX",
        purpose: "Inspect the current assembled presentation.",
        locator: delivery.pptxPath,
        kind: "pptx",
        sha256: delivery.receipt.pptx_sha256,
      }),
      artifactReferenceEntry({
        label: "notes receipt",
        artifactType: "notes receipt JSON",
        purpose: "Inspect the current speaker-notes injection receipt.",
        locator: join(paths.final_root, "notes-receipt.json"),
        kind: "notes",
        sha256: delivery.receipt.notes_receipt_sha256,
      }),
      artifactReferenceEntry({
        label: "delivery receipt",
        artifactType: "delivery receipt JSON",
        purpose: "Inspect the current delivery lineage binding.",
        locator: delivery.receiptPath,
        kind: "delivery",
        sha256: deliverySha256,
      }),
    );
  } else {
    unavailable.push(artifactUnavailable("Delivery", "a current delivery receipt has not been published"));
  }

  return writeHumanArtifactNavigation({
    run_dir: route.run_dir,
    workflow: route.workflow,
    style_master: styleMaster,
    page_artifacts: [...pageById.values()].sort((left, right) => left.position - right.position || left.slide_id.localeCompare(right.slide_id)),
    deck_artifacts: deckArtifacts,
    unavailable,
  });
}
