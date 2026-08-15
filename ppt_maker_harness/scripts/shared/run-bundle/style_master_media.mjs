import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

// This leaf module is shared by bundle layout and State without importing either
// owner, so the State condition can use the layout path without an ESM cycle.
export const STYLE_MASTER_IMAGE = "style_master.png";

export function styleMasterLocalSourcePath(runDir) {
  const resolvedRunDir = resolve(runDir || "");
  const deckDir = dirname(dirname(resolvedRunDir));
  const override = join(resolvedRunDir, "overrides", "visual-style", STYLE_MASTER_IMAGE);
  return existsSync(override)
    ? override
    : join(deckDir, "2_backbone", "visual-style", STYLE_MASTER_IMAGE);
}
