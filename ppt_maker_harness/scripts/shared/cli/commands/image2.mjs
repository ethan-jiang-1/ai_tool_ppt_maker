import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError } from "../cli_error.mjs";
import { commandResult } from "../command_result.mjs";
import { advanceProgressiveControllerCheckpoint, refreshProgressiveControllerTaskProjection, targetImage2Operations } from "../cli_artifact_view.mjs";
import { emitUsage, progressiveUnsupportedOption, requiredPageImageHash, requiredPilotSlideIds, requiredProgressiveDecision, targetPageImageFailure } from "../cli_diagnostics.mjs";
import { targetPageImageGenerateCredentials, targetPageImageSubmitFactory } from "../cli_image2_response.mjs";
import { PAGE_IMAGE_OPERATIONS, resolveRunAdapter } from "../command_support.mjs";

/** Execute the fixed progressive raw lifecycle through the marker-selected owner. */
async function commandTargetPageImageImage2(operation, route, opts = {}) {
  if (operation === "artifact-view") {
    return emitUsage("ppt_flow.image2.artifact-view", "artifact-view moved to the artifacts command", "Use artifacts <run-dir> to rebuild the Human Navigation Path.");
  }
  if (!PAGE_IMAGE_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.image2.target.operation", `Target Page Image image2 operation ${JSON.stringify(operation)} is not supported`, "Use plan, pilot, expansion, authorize, generate, pilot-review, pilot-accept, review, accept, or reconcile.");
  }
  const override = progressiveUnsupportedOption(operation);
  if (override) {
    return emitUsage("ppt_flow.image2.target", `${override} is not accepted for progressive Page Image`, "Use only the registered progressive form and exact raw-owner hashes or formal IDs.");
  }
  if (operation === "authorize" || operation === "generate") {
    const { applyImage2StartupEnv } = await import("../../../shared/image2/startup_env.mjs");
    applyImage2StartupEnv({ runDir: route.run_dir });
  }
  try {
    const operations = await targetImage2Operations(route.workflow);
    let output;
    if (operation === "plan") {
      const plan = await operations.buildPlan(route.run_dir, { allowSourceRebuild: true });
      output = operations.projectPlan(plan);
    } else if (operation === "pilot") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const slideIds = requiredPilotSlideIds(opts);
      if (!planHash || !slideIds) return 1;
      output = await operations.pilot(route.run_dir, { planHash, slideIds });
    } else if (operation === "expansion") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      if (!planHash) return 1;
      output = await operations.expansion(route.run_dir, { planHash });
    } else if (operation === "authorize") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      output = await operations.authorize(route.run_dir, { planHash, batchHash });
    } else if (operation === "generate") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      const plan = await operations.readStoredPlan(route.run_dir);
      let credentials = null;
      output = await operations.generate(route.run_dir, {
        planHash,
        batchHash,
        preflight: async ({ request }) => {
          credentials = await targetPageImageGenerateCredentials(route.run_dir, {
            expectedProfileId: request?.generation_profile?.provider?.profile_id,
          });
        },
        submit: targetPageImageSubmitFactory(plan, {
          credentialResolver: () => {
            if (!credentials) throw new Error("Target Page Image provider credentials were not preflighted");
            return credentials;
          },
        }),
      });
    } else if (operation === "pilot-review") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      if (!planHash || !batchHash) return 1;
      output = await operations.pilotReview(route.run_dir, { planHash, batchHash });
    } else if (operation === "pilot-accept") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      const decision = requiredProgressiveDecision(operation, opts.decision);
      if (!planHash || !batchHash || !decision) return 1;
      output = await operations.pilotAccept(route.run_dir, { planHash, batchHash, decision });
    } else if (operation === "review") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      if (!planHash) return 1;
      output = await operations.review(route.run_dir, { planHash });
    } else if (operation === "accept") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const decision = requiredProgressiveDecision(operation, opts.decision, ["proceed", "repair"]);
      if (!planHash || !decision) return 1;
      output = await operations.accept(route.run_dir, { planHash, decision });
    } else {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const attemptSha256 = requiredPageImageHash(operation, "--attempt-sha256", opts.attemptSha256, "submitted attempt");
      if (!planHash || !attemptSha256) return 1;
      output = await operations.reconcile(route.run_dir, { planHash, attemptSha256 });
    }
    // Bind the successful owner transition to the durable Controller cursor,
    // then rebuild the collaboration card from the same inspection. Authorize
    // first advances the cursor to the authorize node so the existing authorize
    // CLI handoff can complete it with its grant evidence.
    const { inspectWorkflow } = await import("../../../shared/workflow/inspect_workflow.mjs");
    const inspection = inspectWorkflow({ runDir: route.run_dir });
    let checkpointHandoff;
    try {
      checkpointHandoff = await advanceProgressiveControllerCheckpoint(route, { workflowInspection: inspection });
    } catch (projectionError) {
      const result = commandResult({
        operation: `image2.${operation}`,
        state: "partial-effect",
        effect: output,
        partial: { cursor_projection: { status: "failed", code: projectionError?.code || null } },
        facts: { output },
      });
      console.log(JSON.stringify(result, null, 2));
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "Image2 owner records persisted but the Controller cursor projection failed.",
        hint: "Resume from workflow_inspection.primary_action; do not hand-edit _state. The owner write was not rolled back.",
        where: `ppt_flow.image2.target.${operation}.cursor`,
        diagnostic: {
          schema: CLI_DIAGNOSTIC_SCHEMA,
          category: "artifact",
          operation: `image2.${operation}`,
          reason: { kind: "progressive_checkpoint_projection_failed" },
          source: { path: route.run_dir },
          next: createCliNext("repair_prerequisite", {
            default: "Resume from the owner-issued inspection action; the image2 mutation already persisted.",
          }),
        },
      });
      return 1;
    }
    if (operation === "authorize") {
      const planHash = requiredPageImageHash(operation, "--plan-hash", opts.planHash, "full plan");
      const batchHash = requiredPageImageHash(operation, "--batch-hash", opts.batchHash, "batch");
      const { recordTargetProgressiveAuthorizeCliHandoff } = await import("../../../shared/state/state.mjs");
      const controllerHandoff = recordTargetProgressiveAuthorizeCliHandoff(route.deck_dir, {
        runDir: route.run_dir,
        planHash,
        batchHash,
        grantHash: output.grant_hash,
      });
      output = Object.freeze({ ...output, controller_handoff: controllerHandoff });
    }
    await refreshProgressiveControllerTaskProjection(route.run_dir, { workflowInspection: inspection });
    console.log(JSON.stringify({ ...output, controller_checkpoint: checkpointHandoff }, null, 2));
    return 0;
  } catch (error) {
    const failure = targetPageImageFailure(operation, route, error);
    emitCliError({
      code: failure.code,
      message: failure.message,
      hint: failure.hint,
      where: `ppt_flow.image2.target.${operation}`,
      diagnostic: failure.diagnostic,
    });
    return 1;
  }
}

export async function commandImage2(operation, runDir, opts = {}) {
  const route = await resolveRunAdapter(runDir, `ppt_flow.image2.${operation}.identity`);
  if (!route) return 1;
  return commandTargetPageImageImage2(operation, route, opts);
}
