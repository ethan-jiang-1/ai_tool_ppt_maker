import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  CLI_DIAGNOSTIC_SCHEMA,
  CLI_ERROR_CODES,
  createCliNext,
  emitCliError,
} from "../cli_error.mjs";
import { resolveRunAdapter } from "../command_support.mjs";
import { executePageImageProviderCall, inspectPageImageExecutorPng } from "../../image2/provider_executor.mjs";
import { resolveImage2Credentials } from "../../image2/credentials.mjs";
import {
  resolveImage2ProviderProfile,
  selectImage2ProviderOperation,
} from "../../image2/provider_profile.mjs";
import { requireMatchingImage2RuntimeProfileId } from "../../image2/runtime_profile_id.mjs";
import { applyImage2StartupEnv } from "../../image2/startup_env.mjs";
import { resolveEffectiveStyleMasterSelection } from "../../state/state.mjs";
import { styleMasterStorePaths } from "../../image2/style_master_store.mjs";

const CONNECTIVITY_PROMPT = "connectivity probe: solid mid-gray field, no text";
const LAB_NEXT_DEFAULT =
  "Use Image2 Lab (`node ppt_maker_harness/scripts/shared/image2/lab_cli.mjs plan --run-dir <run-dir>` and playbook/image2-lab.md) to discover an unconfirmed Call Shape. Do not treat probe as discovery.";

function stop(where, message, { reason, action = "repair_prerequisite", category = "gate", source } = {}) {
  emitCliError({
    code: CLI_ERROR_CODES.FAILED,
    message,
    hint: LAB_NEXT_DEFAULT,
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category,
      operation: "probe",
      ...(source ? { source: { path: source } } : {}),
      reason: { kind: reason },
      next: createCliNext(action, {
        requiresHuman: true,
        default: LAB_NEXT_DEFAULT,
        invocation: {
          program: "node",
          args: ["ppt_maker_harness/scripts/shared/image2/lab_cli.mjs", "plan", "--run-dir", "<run-dir>"],
        },
      }),
    },
  });
  return null;
}

function selectedStyleMaster(route, callShape) {
  if (callShape.transport.http_operation !== "edits") return null;
  const effective = resolveEffectiveStyleMasterSelection(route.deck_dir, { runDir: route.run_dir });
  if (!effective.ok) {
    const error = new Error("edits probe requires the current exact version's selected immutable Style Master");
    error.code = "style_master_selection_missing";
    throw error;
  }
  const paths = styleMasterStorePaths(route.run_dir, {
    plan_sha256: effective.record.plan_sha256,
    candidate_id: effective.record.candidate_id,
    candidate_media_type: effective.record.candidate_media_type,
  });
  const bytes = readFileSync(paths.candidate_image);
  return { bytes, candidate_media_type: effective.record.candidate_media_type || "image/png" };
}

/**
 * probe — one live confirmed-Call-Shape connectivity submit bound to the exact
 * run. Success is connectivity only. Does not read `_lab/`.
  * Authority: openspec/specs/image-generation/spec.md
 * Authority: openspec/specs/environment-check/spec.md
 */
export async function commandProbe(runDir) {
  const route = await resolveRunAdapter(runDir, "ppt_flow.probe.identity");
  if (!route) return 1;

  let operation;
  try {
    const profile = resolveImage2ProviderProfile(route.run_dir);
    applyImage2StartupEnv({ runDir: route.run_dir });
    requireMatchingImage2RuntimeProfileId({ expectedProfileId: profile.profile_id });
    operation = selectImage2ProviderOperation(profile, "page-image-reference-generation");
  } catch (error) {
    if (error?.code === "image2_provider_profile_id_mismatch") {
      emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "IMAGE2_PROVIDER_PROFILE_ID does not match the selected Image2 provider profile.",
        hint: "Repair IMAGE2_PROVIDER_PROFILE_ID for this environment, then rerun probe.",
        where: "ppt_flow.probe.profile",
        diagnostic: {
          schema: CLI_DIAGNOSTIC_SCHEMA,
          category: "environment",
          operation: "probe",
          reason: { kind: "image2_provider_profile_id_mismatch" },
          next: createCliNext("repair_environment", {
            default: "Repair IMAGE2_PROVIDER_PROFILE_ID for the selected provider profile, then rerun probe.",
          }),
        },
      });
      return null;
    }
    return stop("ppt_flow.probe.profile", "Probe cannot resolve a confirmed page-image Call Shape.", {
      reason: error?.code || "image2_call_shape_unconfirmed",
      source: error?.source ? `${route.deck_dir}/${error.source}` : undefined,
    });
  }

  let styleMaster = null;
  try {
    styleMaster = selectedStyleMaster(route, operation);
  } catch {
    return stop("ppt_flow.probe.style-master", "Edits probe requires the current exact version's selected immutable Style Master.", {
      reason: "style_master_selection_missing",
    });
  }

  let credentials;
  try {
    credentials = resolveImage2Credentials();
  } catch {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Image2 credentials are unavailable.",
      hint: "Repair IMAGE2_API_KEY and IMAGE2_BASE_URL, then rerun probe.",
      where: "ppt_flow.probe.environment",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "environment",
        operation: "probe",
        reason: { kind: "credentials_unavailable" },
        next: createCliNext("repair_environment", {
          default: "Repair IMAGE2_API_KEY and IMAGE2_BASE_URL, then rerun probe.",
        }),
      },
    });
    return null;
  }

  try {
    const pngBytes = await executePageImageProviderCall({
      credentials,
      provider: operation,
      prompt: CONNECTIVITY_PROMPT,
      styleMaster,
      extraImages: [],
      idempotencyKey: `image2-probe-${randomUUID()}`,
    });
    const inspected = inspectPageImageExecutorPng(pngBytes);
    if (!inspected.ok) {
      return stop("ppt_flow.probe.retrieve", "Probe did not retrieve an inspector-valid PNG.", {
        reason: inspected.classification || "probe_png_invalid",
        category: "provider",
        action: "repair_environment",
      });
    }
  } catch (error) {
    emitCliError({
      code: CLI_ERROR_CODES.FAILED,
      message: "Confirmed Call Shape connectivity probe failed.",
      hint: "Repair provider availability or the confirmed Call Shape, then rerun probe. Discovery belongs to Image2 Lab.",
      where: "ppt_flow.probe.submit",
      diagnostic: {
        schema: CLI_DIAGNOSTIC_SCHEMA,
        category: "provider",
        operation: "probe",
        reason: { kind: error?.code || "probe_submit_failed" },
        next: createCliNext("repair_environment", {
          default: "Repair provider availability without exposing credentials, then rerun probe. Use Image2 Lab to discover an unconfirmed Call Shape.",
        }),
      },
    });
    return null;
  }

  console.log("Confirmed Image2 Call Shape retrieved an inspector-valid PNG. Connectivity only; this is not generate authorization.");
  return 0;
}
