/**
 * bundle_cli.mjs — CLI entry point for bundle_layout operations.
 *
 * Separated from bundle_layout.mjs to keep the SSOT file focused on path
 * constants, resolvers, and seed data. This file handles the CLI parsing
 * and dispatch logic.
 *
 * Authority: openspec/specs/run-bundle-layout/spec.md
 * Authority: openspec/specs/run-bundle-management/spec.md
 */

import { existsSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
    CLI_ERROR_CODES, CLI_DIAGNOSTIC_SCHEMA, createCliNext, emitCliError,
    installStandaloneFailureEnvelope,
} from "../cli/cli_error.mjs";
import {
    SLIDE_SPECS_NAME, OVERRIDES_SUBDIR, GENERATED_SUBDIR, VERSIONS_DIR,
    isVersionDir, renderTree, checkBundle, selfCheck, verifyDeckHarnessBinding,
    initBundle, createVersion, SLIDE_SPECS_GLOB,
} from "./bundle_layout.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function _parseArgs(argv) {
    const args = {
        init: null,
        deckType: null,
        style: null,
        unsupportedMode: null,
        check: null,
        structureOnly: false,
        newVersion: null,
        versionName: null,
        selfCheck: false,
    };
    let i = 0;
    while (i < argv.length) {
        const arg = argv[i];
        switch (arg) {
            case '--init': args.init = argv[++i] || null; break;
            case '--deck-type': args.deckType = argv[++i] || null; break;
            case '--style': args.style = argv[++i] || null; break;
            case '--mode': args.unsupportedMode = argv[++i] || ""; break;
            case '--check': args.check = argv[++i] || null; break;
            case '--structure-only': args.structureOnly = true; break;
            case '--new-version': args.newVersion = argv[++i] || null; break;
            case '--version-name': args.versionName = argv[++i] || null; break;
            case '--self-check': args.selfCheck = true; break;
            default: break;
        }
        i++;
    }
    return args;
}

function verifyCurrentBindingForCli(runDir, where) {
    const binding = verifyDeckHarnessBinding(join(runDir, "..", ".."));
    if (binding.kind === 'resolved') return binding;
    emitCliError({
        code: CLI_ERROR_CODES.FAILED,
        message: "RUN_BUNDLE.md does not verify this Deck's exact local PPT Maker Harness identity.",
        hint: "Preserve the existing Bundle unchanged; reconstruct a new current Bundle before resuming this content.",
        where,
        diagnostic: {
            schema: CLI_DIAGNOSTIC_SCHEMA,
            category: "gate",
            operation: "verify-harness-binding",
            source: { path: runDir },
            reason: { kind: "harness_binding_invalid", actual: binding.code },
            next: createCliNext("repair_prerequisite", {
                requiresHuman: true,
                default: "Confirm reconstruction of a new current Run Bundle; preserve the existing Bundle unchanged.",
            }),
        },
    });
    return null;
}

export function main() {
    const argv = process.argv.slice(2);
    const args = _parseArgs(argv);

    if (args.unsupportedMode !== null) {
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--mode is not a current bundle initialization argument.", hint: "Create an unbound draft, then record framed or pure in the exact current source.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Remove --mode and select framed or pure through the current source workflow." }) } });
        process.exit(1);
    }
    if ((args.deckType || args.style) && !args.init) {
        console.error('✗ --deck-type / --style only apply together with --init.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--deck-type and --style require --init.", hint: "Use the template options only while initializing a deck.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --init or remove the template-only options." }) } });
        process.exit(1);
    }
    if (args.versionName && !args.newVersion) {
        console.error('✗ --version-name only applies together with --new-version.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--version-name requires --new-version.", hint: "Use --version-name only while creating a version.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --new-version or remove --version-name." }) } });
        process.exit(1);
    }
    const primaryModes = [args.init, args.check, args.newVersion, args.selfCheck].filter(Boolean).length;
    if (primaryModes > 1) {
        console.error('✗ choose only one of --init, --check, --new-version, or --self-check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Bundle layout modes are mutually exclusive.", hint: "Choose one primary mode.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Choose exactly one of --init, --check, --new-version, or --self-check." }) } });
        process.exit(1);
    }
    if (args.structureOnly && !args.check) {
        console.error('✗ --structure-only only applies together with --check.');
        emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "--structure-only requires --check.", hint: "Pair the option with a run directory check.", where: "bundle_layout.arguments", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", next: createCliNext("fix_arguments", { default: "Add --check <run-dir> or remove --structure-only." }) } });
        process.exit(1);
    }

    if (args.selfCheck) {
        const drift = selfCheck();
        if (drift.length > 0) {
            console.error(`✗ SSOT self-inconsistency — ${drift.length} drift problem(s):`);
            for (const d of drift) console.error(`  - ${d}`);
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle layout SSOT has ${drift.length} coherence issue(s).`, hint: "Repair the layout constants and generated tree together.", where: "bundle_layout.self-check", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "internal", operation: "self-check", issues: drift.map((message) => ({ message })), next: createCliNext("report_internal", { default: "Inspect bundle_layout.mjs and repair the reported SSOT drift." }) } });
            process.exit(1);
        }
        console.log('✓ SSOT self-consistent: renderTree / whitelist / init all agree.');
        process.exit(0);
    }

    if (args.init) {
        const deckDir = resolve(args.init);
        if (!basename(deckDir).startsWith('deck_')) {
            console.error(`✗ deck dir name must start with 'deck_' (Page Image delivery derives the .pptx name from it); got: ${basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "Deck directory name must start with deck_.", hint: "Rename the target directory and rerun init.", where: "bundle_layout.init.name", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "init", subject: { kind: "deck", id: basename(deckDir) }, source: { path: deckDir }, next: createCliNext("fix_arguments", { inspect: [{ path: dirname(deckDir) }], default: "Choose a target directory whose basename starts with deck_." }) } });
            process.exit(1);
        }
        const harnessDir = resolve(__dirname, '..', '..', '..');
        if (harnessDir === deckDir || deckDir.startsWith(harnessDir + sep)) {
            console.error(`✗ refusing to scaffold inside the Harness (${basename(harnessDir)}/). A run bundle is a separate project — give an absolute path or a path outside the Harness, e.g. --init ~/decks/${basename(deckDir)}`);
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "refusing to scaffold a run bundle inside ppt_maker_harness.", hint: "Choose a target outside the Harness source tree.", where: "bundle_layout.init.location", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "init", source: { path: deckDir }, reason: { kind: "harness_source_boundary" }, next: createCliNext("fix_arguments", { inspect: [{ path: harnessDir }], default: "Choose a deck_ target outside ppt_maker_harness and rerun init." }) } });
            process.exit(1);
        }
        let created;
        try {
            created = initBundle(deckDir, null, args.deckType, args.style);
        } catch {
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: "unknown or invalid bundle initialization option.", hint: "Choose a documented deck type and style preset.", where: "bundle_layout.init.options", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "init", source: { path: deckDir }, next: createCliNext("fix_arguments", { default: "Inspect --help, choose supported initialization options, and rerun." }) } });
            process.exit(1);
        }
        const seeded = [];
        if (args.deckType) seeded.push(`deck-type=${args.deckType}`);
        if (args.style) seeded.push(`style=${args.style}`);
        const suffix = seeded.length > 0 ? ` [${seeded.join(', ')}]` : '';
        console.log(`✓ Scaffolded bundle at ${deckDir} (${created.length} items)${suffix}:`);
        for (const line of created) console.log(`  + ${line}`);
        console.log(`\nNext: ppt_flow.mjs status ${deckDir}/${VERSIONS_DIR}/v1`);
        console.log(`Verify anytime:  node ${__filename} --check ${deckDir}/${VERSIONS_DIR}/v1`);
        process.exit(0);
    }

    if (args.newVersion) {
        const sourceRunDir = resolve(args.newVersion);
        if (!verifyCurrentBindingForCli(sourceRunDir, "bundle_layout.new-version.binding")) process.exit(1);
        let target;
        try {
            target = createVersion(sourceRunDir, args.versionName);
        } catch (exc) {
            console.error(`✗ ${exc.message}`);
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: "Unable to create the requested clean version.", hint: "Inspect the source version structure and version name.", where: "bundle_layout.new-version", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "new-version", source: { path: resolve(args.newVersion) }, next: createCliNext("inspect", { inspect: [{ path: resolve(args.newVersion) }], default: "Inspect the source version and correct its structure or requested version name." }) } });
            process.exit(1);
        }
        console.log(`✓ Created clean version: ${target}`);
        console.log(`  Copied: ${SLIDE_SPECS_NAME} + ${OVERRIDES_SUBDIR}/`);
        console.log(`  Reset:  ${GENERATED_SUBDIR}/ (no stale images, JSON, or PPTX)`);
        process.exit(0);
    }

    if (args.check) {
        const runDir = resolve(args.check);
        if (!isVersionDir(runDir)) {
            emitCliError({ code: CLI_ERROR_CODES.USAGE, message: `--check requires an exact ${VERSIONS_DIR}/vN run directory.`, hint: `Pass deck_<name>/${VERSIONS_DIR}/v1, not a Deck root.`, where: "bundle_layout.check.target", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "usage", operation: "parse-arguments", source: { path: runDir }, next: createCliNext("fix_arguments", { default: `Pass an exact ${VERSIONS_DIR}/vN run directory, e.g. deck_name/${VERSIONS_DIR}/v1.` }) } });
            process.exit(1);
        }
        if (!args.structureOnly && !verifyCurrentBindingForCli(runDir, "bundle_layout.check.binding")) process.exit(1);
        const ready = !args.structureOnly;
        const violations = checkBundle(runDir, ready);
        const scope = args.structureOnly ? 'structure' : 'structure + pipeline-readiness';
        if (violations.length > 0) {
            console.error(`✗ Bundle does NOT conform (${scope}) — ${violations.length} violation(s):`);
            for (const v of violations) console.error(`  - ${v}`);
            console.error('\nThe structure is the constitution. Fix these, or see the canonical tree:');
            console.error('  node bundle_layout.mjs');
            emitCliError({ code: CLI_ERROR_CODES.FAILED, message: `Bundle ${scope} check found ${violations.length} violation(s).`, hint: "Fix the named source layout, then rerun the check.", where: "bundle_layout.check", diagnostic: { schema: CLI_DIAGNOSTIC_SCHEMA, category: "structure", operation: "check", source: { path: runDir }, issues: violations.map((message) => ({ message, source: { path: runDir }, reason: { kind: "layout_violation" } })), next: createCliNext("edit_source", { inspect: [{ path: runDir }], invocation: { program: "node", args: [__filename, "--check", runDir, ...(args.structureOnly ? ["--structure-only"] : [])] }, default: "Repair the reported run-bundle paths; do not edit _generated artifacts as source." }) } });
            process.exit(1);
        }
        const note = ready ? '' : '  (pipeline assets and Phase approvals are not required at this gate.)';
        console.log(`✓ ${runDir} conforms (${scope}).${note}`);
        process.exit(0);
    }
    console.log(renderTree());
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
    installStandaloneFailureEnvelope({ where: "bundle_layout" });
    if (process.argv.includes("--help")) {
        console.log("Usage: node bundle_layout.mjs [--init <deck>] [--deck-type <type>] [--style <preset>] [--check <run-dir> [--structure-only]] [--new-version <run-dir> [--version-name <name>]] [--self-check]");
        process.exit(0);
    }
    _main();
}