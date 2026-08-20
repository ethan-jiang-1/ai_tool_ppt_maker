#!/usr/bin/env node
/**
 * lab_cli.mjs — standalone Image2 Lab. Discover an unconfirmed Call Shape.
 * Not a ppt_flow route, not a production stage, not a lessons writer.
 */
import "../cli/cli_bootstrap.mjs?entry=shared/image2/lab_cli.mjs";
import {
  CLI_DIAGNOSTIC_SCHEMA,
  CLI_ERROR_CODES,
  createCliNext,
  emitCliError,
} from "../cli/cli_error.mjs";
import { createHash, randomUUID } from "node:crypto";
import { lstatSync, mkdirSync, readFileSync, realpathSync, renameSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { canonicalJson, canonicalJsonSha256 } from "../identity/canonical_json.mjs";
import {
  CALL_SHAPE_ENVELOPE_SCHEMA,
  Image2CallShapeError,
  LAB_TRIAL_SCHEMA,
  validateCallShapeValue,
} from "./call_shape.mjs";
import { executePageImageProviderCall, inspectPageImageExecutorPng } from "./provider_executor.mjs";
import { evaluateImage2PromptBudget } from "./provider_profile.mjs";
import { applyImage2StartupEnv } from "./startup_env.mjs";
import { resolveImage2Credentials } from "./credentials.mjs";
import {
  deckRoot,
  ensureLabScaffold,
  isVersionDir,
  LAB_DIR,
  LAB_FIXTURES_SUBDIR,
  LAB_RUNS_SUBDIR,
} from "../run-bundle/bundle_layout.mjs";
import { verifyDeckHarnessBinding } from "../run-bundle/run_bundle_locator.mjs";

const __filename = fileURLToPath(import.meta.url);

function stop(where, message, nextDefault, extra = {}) {
  emitCliError({
    code: extra.code || CLI_ERROR_CODES.FAILED,
    message,
    hint: nextDefault,
    where,
    diagnostic: {
      schema: CLI_DIAGNOSTIC_SCHEMA,
      category: extra.category || "gate",
      operation: extra.operation || "image2-lab",
      ...(extra.source ? { source: { path: extra.source } } : {}),
      reason: { kind: extra.reason || "lab_admission_failed" },
      next: createCliNext(extra.action || "repair_prerequisite", {
        requiresHuman: extra.requiresHuman ?? true,
        default: nextDefault,
        ...(extra.invocation ? { invocation: extra.invocation } : {}),
      }),
    },
  });
  return 1;
}

function sha256Bytes(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function versionKey(runDir) {
  return path.basename(path.resolve(runDir));
}

function confinedRegularFile(deckDir, candidate, label) {
  let stat;
  try {
    stat = lstatSync(candidate);
  } catch {
    throw new Error(`${label} is missing`);
  }
  if (stat.isSymbolicLink() || stat.isFIFO() || stat.isSocket() || stat.isCharacterDevice() || stat.isBlockDevice()) {
    throw new Error(`${label} must be a confined ordinary file`);
  }
  if (!stat.isFile()) throw new Error(`${label} must be a confined ordinary file`);
  const realDeck = realpathSync.native(deckDir);
  const realFile = realpathSync.native(candidate);
  const rel = path.relative(realDeck, realFile);
  if (!rel || rel.startsWith("..") || path.isAbsolute(rel)) {
    throw new Error(`${label} escapes the bound Run Bundle`);
  }
  return { path: realFile, relative: rel.split(path.sep).join("/"), bytes: readFileSync(realFile) };
}

function confinedDirectoryComponents(deckDir, targetPath) {
  const realDeck = realpathSync.native(deckDir);
  let current = realDeck;
  const rel = path.relative(realDeck, path.resolve(targetPath));
  if (!rel || rel.startsWith("..")) throw new Error("Lab path escapes the bound Run Bundle");
  const parts = rel.split(path.sep).filter(Boolean);
  for (const part of parts) {
    current = path.join(current, part);
    let stat;
    try {
      stat = lstatSync(current);
    } catch {
      continue;
    }
    if (stat.isSymbolicLink()) throw new Error("Lab path components must be ordinary directories");
  }
}

function admitRun(runDir, where) {
  const resolved = path.resolve(runDir || "");
  let real;
  try {
    real = realpathSync.native(resolved);
  } catch {
    stop(where, "Lab requires an exact 3_versions/vN run directory.", "Pass --run-dir to an exact version directory.", { reason: "run_dir_invalid" });
    return null;
  }
  if (!isVersionDir(real)) {
    stop(where, "Lab requires an exact 3_versions/vN run directory.", "Pass --run-dir to an exact version directory.", { reason: "run_dir_invalid" });
    return null;
  }
  const root = deckRoot(real);
  const binding = verifyDeckHarnessBinding(root);
  if (binding.kind !== "resolved") {
    stop(where, "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.", "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming Lab.", {
      reason: "harness_binding_invalid",
      source: root,
    });
    return null;
  }
  ensureLabScaffold(root);
  try {
    confinedDirectoryComponents(root, path.join(root, LAB_DIR));
  } catch (error) {
    stop(where, error.message, "Repair _lab/ so every path component is an ordinary directory inside the deck.", { reason: "lab_path_unsafe" });
    return null;
  }
  return { runDir: real, deckDir: root, version: versionKey(real) };
}

function parseCandidateFile(deckDir, filePath) {
  const file = confinedRegularFile(deckDir, path.resolve(filePath), "candidate");
  let parsed;
  try {
    parsed = parseYaml(file.bytes.toString("utf8"));
  } catch {
    throw new Error("candidate file is not readable YAML");
  }
  if (!parsed || typeof parsed !== "object" || parsed.schema !== CALL_SHAPE_ENVELOPE_SCHEMA) {
    throw new Error("candidate file must use schema pptmaker-image2-call-shape");
  }
  const { schema: _schema, ...value } = parsed;
  const validated = validateCallShapeValue(value);
  return { file, validated };
}

function promptFacts(deckDir, promptPath, operationProfile) {
  const file = confinedRegularFile(deckDir, path.resolve(promptPath), "prompt");
  const budget = evaluateImage2PromptBudget({
    prompt: file.bytes,
    operationProfile,
  });
  return {
    locator: file.relative,
    sha256: sha256Bytes(file.bytes),
    unit: operationProfile.prompt_budget.unit,
    tested_measurement: budget.measurement.measured,
    text: file.bytes.toString("utf8"),
  };
}

function referenceFacts(deckDir, referencePath) {
  if (!referencePath) return null;
  const file = confinedRegularFile(deckDir, path.resolve(referencePath), "reference");
  const inspected = inspectPageImageExecutorPng(file.bytes);
  if (!inspected.ok) throw new Error("reference file is not an inspector-valid PNG");
  return {
    locator: file.relative,
    sha256: sha256Bytes(file.bytes),
    bytes: file.bytes,
    width: inspected.actual.width,
    height: inspected.actual.height,
    source_class: file.relative.startsWith(`${LAB_DIR}/${LAB_FIXTURES_SUBDIR}/`) ? "lab-fixture" : "imported-style-master-bytes",
  };
}

function planDir(deckDir, version) {
  return path.join(deckDir, LAB_DIR, LAB_RUNS_SUBDIR, version, "plans");
}

function trialDir(deckDir, version, trialId) {
  return path.join(deckDir, LAB_DIR, LAB_RUNS_SUBDIR, version, "trials", trialId);
}

function cmdPlan(opts) {
  const admitted = admitRun(opts.runDir, "image2-lab.plan.admission");
  if (!admitted) return 1;
  if (!opts.candidates.length) {
    return stop("image2-lab.plan.arguments", "Lab plan requires at least one --candidate file.", "Pass one or more --candidate files.", { code: CLI_ERROR_CODES.USAGE, category: "usage", action: "fix_arguments", requiresHuman: false });
  }
  if (!opts.promptFile) {
    return stop("image2-lab.plan.arguments", "Lab plan requires --prompt-file.", "Pass a confined prompt file.", { code: CLI_ERROR_CODES.USAGE, category: "usage", action: "fix_arguments", requiresHuman: false });
  }
  let items;
  try {
    items = opts.candidates.map((candidatePath) => {
      const candidate = parseCandidateFile(admitted.deckDir, candidatePath);
      const operationProfile = {
        operation: "page-image-reference-generation",
        prompt_budget: candidate.validated.value.prompt_budget,
      };
      const prompt = promptFacts(admitted.deckDir, opts.promptFile, operationProfile);
      const needsReference = candidate.validated.value.transport.http_operation === "edits";
      if (needsReference && !opts.referenceFile) {
        throw new Error("edits candidates require --reference-file");
      }
      const reference = needsReference ? referenceFacts(admitted.deckDir, opts.referenceFile) : null;
      return {
        candidate_relative: candidate.file.relative,
        call_shape: candidate.validated.value,
        call_shape_sha256: candidate.validated.sha256,
        prompt: { locator: prompt.locator, sha256: prompt.sha256, unit: prompt.unit, tested_measurement: prompt.tested_measurement },
        reference: reference
          ? { locator: reference.locator, sha256: reference.sha256, width: reference.width, height: reference.height, source_class: reference.source_class }
          : null,
        may_poll: candidate.validated.value.transport.completion === "async-poll",
      };
    });
  } catch (error) {
    if (error instanceof Image2CallShapeError) {
      return stop("image2-lab.plan.candidate", error.message, "Repair the candidate Call Shape; unregistered dialects cannot be planned.", { reason: error.code });
    }
    return stop("image2-lab.plan.admission", error.message, "Repair candidate, prompt, and reference inputs so they are confined ordinary files.", { reason: "lab_input_invalid" });
  }
  const plan = {
    schema: "pptmaker-image2-lab-plan",
    run_version: admitted.version,
    candidate_count: items.length,
    submit_count: items.length,
    items,
  };
  const planHash = canonicalJsonSha256(plan);
  const sealed = { ...plan, plan_hash: planHash };
  const destDir = planDir(admitted.deckDir, admitted.version);
  mkdirSync(destDir, { recursive: true });
  const staging = `${destDir}/.${planHash}.tmp`;
  const dest = path.join(destDir, `${planHash}.json`);
  writeFileSync(staging, `${canonicalJson(sealed)}\n`);
  renameSync(staging, dest);
  console.log(JSON.stringify({
    ok: true,
    schema: "pptmaker-image2-lab-plan-receipt",
    plan_hash: planHash,
    candidate_count: items.length,
    submit_count: items.length,
  }));
  return 0;
}

async function cmdExecute(opts) {
  const admitted = admitRun(opts.runDir, "image2-lab.execute.admission");
  if (!admitted) return 1;
  if (!opts.planHash) {
    return stop("image2-lab.execute.arguments", "Lab execute requires --plan-hash.", "Form a bounded plan, then execute with that exact hash.", {
      code: CLI_ERROR_CODES.USAGE,
      category: "usage",
      action: "fix_arguments",
      requiresHuman: false,
      reason: "plan_hash_missing",
    });
  }
  const dest = path.join(planDir(admitted.deckDir, admitted.version), `${opts.planHash}.json`);
  let plan;
  try {
    plan = JSON.parse(readFileSync(dest, "utf8"));
  } catch {
    return stop("image2-lab.execute.plan", "Lab execute could not read the named plan.", "Form a new bounded plan, then execute with that exact hash.", { reason: "plan_hash_mismatch" });
  }
  const { plan_hash: storedHash, ...body } = plan;
  if (storedHash !== opts.planHash || canonicalJsonSha256(body) !== opts.planHash) {
    return stop("image2-lab.execute.plan", "Lab execute plan hash does not match the sealed plan.", "Form a new bounded plan, then execute with that exact hash.", { reason: "plan_hash_mismatch" });
  }
  applyImage2StartupEnv({ runDir: admitted.runDir });
  let credentials;
  try {
    credentials = resolveImage2Credentials();
  } catch {
    return stop("image2-lab.execute.environment", "Image2 credentials are unavailable.", "Repair IMAGE2_API_KEY and IMAGE2_BASE_URL, then rerun execute.", {
      category: "environment",
      action: "repair_environment",
      reason: "credentials_unavailable",
    });
  }
  const receipts = [];
  for (const item of plan.items) {
    let prompt;
    let reference;
    try {
      prompt = promptFacts(admitted.deckDir, path.join(admitted.deckDir, item.prompt.locator), {
        operation: "page-image-reference-generation",
        prompt_budget: item.call_shape.prompt_budget,
      });
      if (prompt.sha256 !== item.prompt.sha256) throw new Error("prompt bytes changed after plan");
      reference = item.reference
        ? referenceFacts(admitted.deckDir, path.join(admitted.deckDir, item.reference.locator))
        : null;
      if (item.call_shape.transport.http_operation === "edits" && !reference) {
        throw new Error("edits candidates require --reference-file");
      }
    } catch (error) {
      return stop("image2-lab.execute.admission", error.message, "Repair candidate, prompt, and reference inputs before execute.", { reason: "lab_input_invalid" });
    }
    const trialId = `trial-${randomUUID()}`;
    const stagingRoot = path.join(admitted.deckDir, LAB_DIR, LAB_RUNS_SUBDIR, admitted.version, "trials", `.${trialId}.tmp`);
    mkdirSync(stagingRoot, { recursive: true });
    let pngBytes = null;
    let classification = "success";
    let errorKind = null;
    try {
      pngBytes = await executePageImageProviderCall({
        credentials,
        provider: item.call_shape,
        prompt: prompt.text,
        styleMaster: reference ? { bytes: reference.bytes, candidate_media_type: "image/png" } : null,
        extraImages: [],
        idempotencyKey: `image2-lab-${trialId}`,
      });
      const inspected = inspectPageImageExecutorPng(pngBytes);
      if (!inspected.ok) {
        classification = "failure";
        errorKind = inspected.classification;
        pngBytes = null;
      } else {
        pngBytes = inspected.bytes;
      }
    } catch (error) {
      classification = "failure";
      errorKind = error?.code || "executor_failed";
      pngBytes = null;
    }
    const trial = {
      schema: LAB_TRIAL_SCHEMA,
      trial_id: trialId,
      run_version: admitted.version,
      call_shape: item.call_shape,
      call_shape_sha256: item.call_shape_sha256,
      prompt: { locator: item.prompt.locator, sha256: item.prompt.sha256, unit: item.prompt.unit, tested_measurement: item.prompt.tested_measurement },
      reference: item.reference,
      classification,
      ...(errorKind ? { error_kind: errorKind } : {}),
      ...(pngBytes ? {
        png_sha256: sha256Bytes(pngBytes),
        png_bytes: pngBytes.length,
        inspector_width: inspectPageImageExecutorPng(pngBytes).actual.width,
        inspector_height: inspectPageImageExecutorPng(pngBytes).actual.height,
      } : {}),
    };
    const trialSha = canonicalJsonSha256(trial);
    const sealed = { ...trial, trial_sha256: trialSha };
    writeFileSync(path.join(stagingRoot, "trial.json"), `${canonicalJson(sealed)}\n`);
    if (pngBytes) writeFileSync(path.join(stagingRoot, "output.png"), pngBytes);
    const finalDir = trialDir(admitted.deckDir, admitted.version, trialId);
    mkdirSync(path.dirname(finalDir), { recursive: true });
    try {
      renameSync(stagingRoot, finalDir);
    } catch {
      rmSync(stagingRoot, { recursive: true, force: true });
      return stop("image2-lab.execute.seal", "Lab could not atomically seal the trial.", "Rerun execute; do not treat a temporary directory as proven.", { reason: "trial_seal_failed" });
    }
    receipts.push({
      trial_id: trialId,
      trial_sha256: trialSha,
      call_shape_sha256: item.call_shape_sha256,
      classification,
      ...(pngBytes ? {
        png_sha256: sealed.png_sha256,
        inspector_width: sealed.inspector_width,
        inspector_height: sealed.inspector_height,
        tested_measurement: item.prompt.tested_measurement,
      } : {}),
    });
  }
  const success = receipts.find((entry) => entry.classification === "success");
  if (!success) {
    return stop("image2-lab.execute.failure", "Lab execute did not retrieve an inspector-valid PNG.", "Show the sealed failure trial to the Deck Author; do not confirm a profile.", {
      reason: "lab_trial_failed",
    });
  }
  console.log(JSON.stringify({
    ok: true,
    schema: "pptmaker-image2-lab-success",
    trial_id: success.trial_id,
    trial_sha256: success.trial_sha256,
    call_shape_sha256: success.call_shape_sha256,
    png_sha256: success.png_sha256,
    inspector_width: success.inspector_width,
    inspector_height: success.inspector_height,
    tested_measurement: success.tested_measurement,
    next: "Show this trial_id and trial_sha256 to the Deck Author for optional profile writeback. This is not generate authorization.",
  }));
  return 0;
}

function printHelp() {
  console.log(`Usage: node lab_cli.mjs <command> --run-dir <vN> [options]

Commands:
  plan     --run-dir <vN> --candidate <file> [--candidate <file> ...] --prompt-file <file> [--reference-file <file>]
  execute  --run-dir <vN> --plan-hash <hash>

Lab is the unconfirmed-candidate live owner. It does not write profile, State, or _lessons/.`);
}

function parseArgs(argv) {
  const opts = { command: argv[0] || null, runDir: null, planHash: null, promptFile: null, referenceFile: null, candidates: [] };
  for (let i = 1; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--run-dir") opts.runDir = argv[++i] || null;
    else if (arg === "--plan-hash") opts.planHash = argv[++i] || null;
    else if (arg === "--prompt-file") opts.promptFile = argv[++i] || null;
    else if (arg === "--reference-file") opts.referenceFile = argv[++i] || null;
    else if (arg === "--candidate") opts.candidates.push(argv[++i] || "");
    else if (arg === "--help" || arg === "-h") opts.help = true;
    else if (arg.startsWith("--")) opts.unknown = arg;
  }
  return opts;
}

async function _main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    process.exit(0);
  }
  const opts = parseArgs(argv);
  if (opts.unknown) {
    process.exit(stop("image2-lab.arguments", `Unknown argument ${opts.unknown}.`, "Run with --help and correct the arguments.", {
      code: CLI_ERROR_CODES.USAGE,
      category: "usage",
      action: "fix_arguments",
      requiresHuman: false,
    }));
  }
  let code = 1;
  if (opts.command === "plan") code = cmdPlan(opts);
  else if (opts.command === "execute") code = await cmdExecute(opts);
  else {
    code = stop("image2-lab.arguments", `Unknown subcommand ${opts.command}.`, "Use plan or execute.", {
      code: CLI_ERROR_CODES.USAGE,
      category: "usage",
      action: "fix_arguments",
      requiresHuman: false,
    });
  }
  process.exit(code);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const { installStandaloneFailureEnvelope } = await import("../cli/cli_error.mjs");
  installStandaloneFailureEnvelope({ where: "image2-lab" });
  await _main();
}

export { admitRun, cmdPlan, cmdExecute };
