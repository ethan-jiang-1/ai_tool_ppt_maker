import { CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError, registerCliJsonReport } from "../cli_error.mjs";
import { commandReport } from "../command_result.mjs";
import {
  PAGE_IMAGE_OPERATIONS,
  emitUsage,
  progressiveUnsupportedOption,
  rebuildTargetPageImageArtifactView,
  refreshProgressiveControllerTaskProjection,
  requiredPageImageHash,
  requiredPilotSlideIds,
  requiredProgressiveDecision,
  resolveRunAdapter,
  targetImage2Operations,
  targetPageImageFailure,
  targetPageImageGenerateCredentials,
  targetPageImageSubmitFactory,
} from "../command_support.mjs";

/** Execute the fixed progressive raw lifecycle through the marker-selected owner. */
async function commandTargetPageImageImage2(operation, route, opts = {}) {
  if (!PAGE_IMAGE_OPERATIONS.has(operation)) {
    return emitUsage("ppt_flow.image2.target.operation", `Target Page Image image2 operation ${JSON.stringify(operation)} is not supported`, "Use plan, artifact-view, pilot, expansion, authorize, generate, pilot-review, pilot-accept, review, accept, or reconcile.");
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
    if (operation === "artifact-view") {
      const output = await rebuildTargetPageImageArtifactView(route);
      const result = commandReport({
        operation: "image2",
        effect: { artifact_view: output.path },
        fields: {
          run_dir: output.run_dir,
          workflow: output.workflow,
          artifact_view: output.path,
          human_navigation_root: output.root,
          ...(output.pending_successor ? { next_action: output.pending_successor.next_action } : {}),
        },
      });
      console.log(JSON.stringify(result, null, 2));
      return 0;
    }
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
      const { recordTargetProgressiveAuthorizeCliHandoff } = await import("../../../shared/state/state.mjs");
      const controllerHandoff = recordTargetProgressiveAuthorizeCliHandoff(route.deck_dir, {
        runDir: route.run_dir,
        planHash,
        batchHash,
        grantHash: output.grant_hash,
      });
      output = Object.freeze({ ...output, controller_handoff: controllerHandoff });
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
    await refreshProgressiveControllerTaskProjection(route.run_dir);
    console.log(JSON.stringify(output, null, 2));
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
