import { lstatSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import { sha256Bytes } from "../../shared/identity/byte_hash.mjs";
import {
  BACKBONE_DIR,
  BACKBONE_STYLE_SUBDIR,
  OVERRIDES_SUBDIR,
  PAGE_DESIGN_SYSTEM_FILE,
} from "../../shared/run-bundle/bundle_layout.mjs";

export const PAGE_DESIGN_SYSTEM_BINDING_SCHEMA = "page-image-design-system-binding";
export const PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES = 8192;

const OVERRIDE_RELATIVE_PATH = `${OVERRIDES_SUBDIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_DESIGN_SYSTEM_FILE}`;
const BACKBONE_RELATIVE_PATH = `${BACKBONE_DIR}/${BACKBONE_STYLE_SUBDIR}/${PAGE_DESIGN_SYSTEM_FILE}`;

const NODE_READ_ONLY_FILE_SYSTEM = Object.freeze({
  lstat: lstatSync,
  readFile: readFileSync,
  realpath: realpathSync.native,
});

export class PageDesignSystemError extends Error {
  constructor(code, message, details = {}) {
    super(message);
    this.name = "PageDesignSystemError";
    this.code = code;
    this.details = Object.freeze({ ...details });
    this.issues = Object.freeze([{ code, message, ...details }]);
  }
}

function frozenBinding(text, sha256) {
  return Object.freeze({ schema: PAGE_DESIGN_SYSTEM_BINDING_SCHEMA, text, sha256 });
}

const NULL_PAGE_DESIGN_SYSTEM_BINDING = frozenBinding(null, null);

function isWithin(root, candidate) {
  const relation = relative(root, candidate);
  return relation === "" || (!relation.startsWith(`..${sep}`) && relation !== ".." && !isAbsolute(relation));
}

function inspectPathComponent(fileSystem, componentPath, {
  expectedKind,
  label,
  optional,
  ownerReal,
  relativePath,
}) {
  let stat;
  try {
    stat = fileSystem.lstat(componentPath);
  } catch (error) {
    if (error?.code === "ENOENT" && optional) return null;
    throw new PageDesignSystemError(
      "page_design_system_source_unavailable",
      `Page Design System ${label} cannot be inspected safely`,
      { source: componentPath, actual: error?.code || "unknown" },
    );
  }

  if (stat.isSymbolicLink()) {
    if (expectedKind === "regular file") {
      throw new PageDesignSystemError(
        "page_design_system_source_invalid",
        `Page Design System ${label} must not be a symbolic link`,
        { source: componentPath, kind: "symlink" },
      );
    }
    let componentReal = null;
    try {
      componentReal = fileSystem.realpath(componentPath);
    } catch {
      // A dangling or otherwise unresolvable symlink is still an invalid selected branch.
    }
    if (componentReal !== null && !isWithin(ownerReal, componentReal)) {
      throw new PageDesignSystemError(
        "page_design_system_source_escape",
        `Page Design System ${label} escapes its selected owner root`,
        { source: componentPath },
      );
    }
    throw new PageDesignSystemError(
      "page_design_system_source_invalid",
      `Page Design System ${label} must not contain a symbolic link`,
      { source: componentPath, kind: "symlink" },
    );
  }

  const validKind = expectedKind === "directory" ? stat.isDirectory() : stat.isFile();
  if (!validKind) {
    throw new PageDesignSystemError(
      "page_design_system_source_invalid",
      `Page Design System ${label} must be one ${expectedKind}`,
      { source: componentPath, kind: expectedKind === "directory" ? "non-directory" : "non-regular" },
    );
  }

  let componentReal;
  try {
    componentReal = fileSystem.realpath(componentPath);
  } catch (error) {
    throw new PageDesignSystemError(
      "page_design_system_source_unavailable",
      `Page Design System ${label} cannot be resolved safely`,
      { source: componentPath, actual: error?.code || "unknown" },
    );
  }
  const expectedReal = resolve(ownerReal, relativePath);
  if (!isWithin(ownerReal, componentReal) || componentReal !== expectedReal) {
    throw new PageDesignSystemError(
      "page_design_system_source_escape",
      `Page Design System ${label} escapes its selected owner root`,
      { source: componentPath },
    );
  }
  return stat;
}

function ownerRealPath(fileSystem, ownerRoot, label) {
  try {
    return fileSystem.realpath(ownerRoot);
  } catch (error) {
    throw new PageDesignSystemError(
      "page_design_system_source_unavailable",
      `Page Design System ${label} owner root cannot be resolved safely`,
      { source: ownerRoot, actual: error?.code || "unknown" },
    );
  }
}

function inspectCandidate(fileSystem, {
  components,
  label,
  optionalAncestors,
  ownerRoot,
}) {
  const ownerReal = ownerRealPath(fileSystem, ownerRoot, label);
  let currentPath = ownerRoot;
  const relativeComponents = [];
  for (let index = 0; index < components.length; index += 1) {
    const component = components[index];
    currentPath = resolve(currentPath, component);
    relativeComponents.push(component);
    const leaf = index === components.length - 1;
    const stat = inspectPathComponent(fileSystem, currentPath, {
      expectedKind: leaf ? "regular file" : "directory",
      label: `${label} ${leaf ? "source" : "ancestor"}`,
      optional: leaf || optionalAncestors,
      ownerReal,
      relativePath: relativeComponents.join(sep),
    });
    if (stat === null) return null;
    if (leaf) {
      return Object.freeze({
        sourcePath: currentPath,
        stat,
        label,
      });
    }
  }
  return null;
}

function selectSource(fileSystem, runDir) {
  if (typeof runDir !== "string" || !runDir) {
    throw new PageDesignSystemError(
      "page_design_system_run_dir_invalid",
      "Page Design System resolution requires one non-empty runDir path",
    );
  }
  const resolvedRunDir = resolve(runDir);
  const resolvedDeckRoot = resolve(resolvedRunDir, "..", "..");
  const override = inspectCandidate(fileSystem, {
    components: [OVERRIDES_SUBDIR, BACKBONE_STYLE_SUBDIR, PAGE_DESIGN_SYSTEM_FILE],
    label: "override",
    optionalAncestors: true,
    ownerRoot: resolvedRunDir,
  });
  if (override !== null) return override;
  return inspectCandidate(fileSystem, {
    components: [BACKBONE_DIR, BACKBONE_STYLE_SUBDIR, PAGE_DESIGN_SYSTEM_FILE],
    label: "backbone",
    optionalAncestors: false,
    ownerRoot: resolvedDeckRoot,
  });
}

export function createPageDesignSystemResolver(fileSystem = NODE_READ_ONLY_FILE_SYSTEM) {
  for (const method of ["lstat", "readFile", "realpath"]) {
    if (typeof fileSystem?.[method] !== "function") {
      throw new TypeError(`Page Design System resolver requires fileSystem.${method}()`);
    }
  }

  return function resolveWithFileSystem(runDir) {
    const selected = selectSource(fileSystem, runDir);
    if (!selected) return NULL_PAGE_DESIGN_SYSTEM_BINDING;

    let bytes;
    try {
      bytes = fileSystem.readFile(selected.sourcePath);
    } catch (error) {
      throw new PageDesignSystemError(
        "page_design_system_source_unreadable",
        `Page Design System ${selected.label} source cannot be read`,
        { source: selected.sourcePath, actual: error?.code || "unknown" },
      );
    }
    if (bytes.length > PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES) {
      throw new PageDesignSystemError(
        "page_design_system_source_too_large",
        `Page Design System ${selected.label} source exceeds ${PAGE_DESIGN_SYSTEM_MAX_SOURCE_UTF8_BYTES} raw UTF-8 bytes`,
        { source: selected.sourcePath, actual: bytes.length },
      );
    }

    let text;
    try {
      // ignoreBOM keeps a leading BOM in the bound author text rather than normalizing it away.
      text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes);
    } catch (error) {
      throw new PageDesignSystemError(
        "page_design_system_source_utf8_invalid",
        `Page Design System ${selected.label} source is not valid UTF-8`,
        { source: selected.sourcePath, actual: error?.code || "invalid-utf8" },
      );
    }
    if (text.trim().length === 0) return NULL_PAGE_DESIGN_SYSTEM_BINDING;
    return frozenBinding(text, sha256Bytes(bytes));
  };
}

/**
 * Resolve the optional Page Design System source once for a candidate compiler.
 * The returned binding deliberately contains no physical path or selection origin.
 */
export const resolvePageDesignSystemBinding = createPageDesignSystemResolver();
