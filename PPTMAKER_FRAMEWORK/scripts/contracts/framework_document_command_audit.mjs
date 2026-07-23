import { existsSync } from "node:fs";
import { join, normalize } from "node:path";
import { spawnSync } from "node:child_process";
import { EXECUTABLE_INVENTORY, normalizeExecutablePath } from "./executable_inventory.mjs";

function issue(file, line, rule, message, hint) { return { file, line, rule, message, hint }; }
function parseCommandTokens(command) {
  return command.match(/(?:"[^"]*"|'[^']*'|\S+)/g)?.map((token) => token.replace(/^['"]|['"]$/g, "")) || [];
}

/** Opt-in audit: it deliberately starts documented commands with --help. */
export function validateDocumentedCommands(commands, scriptsDir) {
  const issues = [];
  const helpCache = new Map();
  for (const item of commands) {
    const tokens = parseCommandTokens(item.command);
    while (tokens[0]?.includes("=") && !tokens[0].startsWith("--")) tokens.shift();
    if (tokens[0] !== "node") continue;
    const scriptToken = tokens[1];
    const scriptName = scriptToken?.split("/").at(-1);
    if (!scriptName?.endsWith(".mjs") || /[*?]/.test(scriptName)) continue;
    const scriptRelative = normalizeExecutablePath(String(scriptToken).replace(/^\.\//, "").replace(/^PPTMAKER_FRAMEWORK\/scripts\//, "").replace(/^scripts\//, ""));
    const scriptPath = join(scriptsDir, scriptRelative);
    if (!EXECUTABLE_INVENTORY.includes(scriptRelative) || !existsSync(scriptPath)) {
      issues.push(issue(item.file, item.line, "command-script", `unknown script ${scriptRelative || scriptName}`, "use a canonical path from contracts/executable_inventory.mjs"));
      continue;
    }
    let helpArgs = [scriptPath, "--help"];
    let optionStart = 2;
    if (scriptRelative === "ppt_flow.mjs" && tokens[2] && !tokens[2].startsWith("-") && !tokens[2].startsWith("<")) {
      helpArgs = [scriptPath, tokens[2], "--help"];
      optionStart = 3;
    }
    const cacheKey = helpArgs.join("\0");
    if (!helpCache.has(cacheKey)) helpCache.set(cacheKey, spawnSync("node", helpArgs, { encoding: "utf8", timeout: 10000 }));
    const help = helpCache.get(cacheKey);
    if (help.status !== 0) {
      issues.push(issue(item.file, item.line, "command-help", `help failed for ${scriptName}`, help.stderr || "make --help side-effect free"));
      continue;
    }
    const helpText = `${help.stdout}\n${help.stderr}`;
    for (const token of tokens.slice(optionStart).filter((token) => /^--[a-z0-9-]+$/i.test(token))) {
      if (!helpText.includes(token)) issues.push(issue(item.file, item.line, "unsupported-flag", `${scriptName} does not expose ${token}`, "use a real flag from --help"));
    }
  }
  return issues;
}
