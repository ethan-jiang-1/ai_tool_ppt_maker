import { mkdirSync, mkdtempSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  IMAGE2_STARTUP_KEYS,
  applyImage2StartupEnv,
  resolveImage2StartupEnv,
} from "../../../ppt_maker_harness/scripts/shared/image2/startup_env.mjs";

const ORIGINAL_CWD = process.cwd();
let fixtureRoot = null;

function fixture() {
  fixtureRoot = mkdtempSync(join(tmpdir(), "startup-env-"));
  const deck = join(fixtureRoot, "deck_startup_env");
  const runDir = join(deck, "3_versions", "v1");
  const cwd = join(fixtureRoot, "cwd");
  mkdirSync(runDir, { recursive: true });
  mkdirSync(cwd, { recursive: true });
  process.chdir(cwd);
  return { deck, runDir, cwd };
}

afterEach(() => {
  process.chdir(ORIGINAL_CWD);
  if (fixtureRoot) {
    rmSync(fixtureRoot, { recursive: true, force: true });
    fixtureRoot = null;
  }
});

describe("restricted Image2 startup environment", () => {
  it("fills missing declared keys from deck then cwd and never overwrites explicit values", () => {
    const value = fixture();
    writeFileSync(join(value.deck, ".env"), "IMAGE2_API_KEY=deck-key\nIMAGE2_BASE_URL=https://deck.example/v1\nUNRELATED_KEY=deck-only\n");
    writeFileSync(join(value.cwd, ".env"), "IMAGE2_BASE_URL=https://cwd.example/v1\nIMAGE2_PROVIDER_PROFILE_ID=cwd-profile\n");

    const result = resolveImage2StartupEnv({ runDir: value.runDir, env: {} });
    expect(result.env.IMAGE2_API_KEY).toBe("deck-key");
    expect(result.env.IMAGE2_BASE_URL).toBe("https://deck.example/v1");
    expect(result.env.IMAGE2_PROVIDER_PROFILE_ID).toBe("cwd-profile");
    expect(result.env.UNRELATED_KEY).toBeUndefined();
    expect(result.loadedFrom).toContain(realpathSync(value.deck));
    expect(result.loadedFrom).toContain(realpathSync(value.cwd));

    const explicit = resolveImage2StartupEnv({
      runDir: value.runDir,
      env: { IMAGE2_PROVIDER_PROFILE_ID: "shell-profile" },
    });
    expect(explicit.env.IMAGE2_PROVIDER_PROFILE_ID).toBe("shell-profile");
    expect(explicit.env.IMAGE2_API_KEY).toBe("deck-key");
  });

  it("reads only declared keys and never returns values in the location summary", () => {
    const value = fixture();
    writeFileSync(join(value.deck, ".env"), "IMAGE2_API_KEY=secret-value\nPPT_FONT_DIR=/fonts\nOTHER=1\n");

    const result = resolveImage2StartupEnv({ runDir: value.runDir, env: {} });
    expect(result.env.IMAGE2_API_KEY).toBe("secret-value");
    expect(result.env.PPT_FONT_DIR).toBeUndefined();
    expect(result.env.OTHER).toBeUndefined();
    expect(JSON.stringify(result.loadedFrom)).not.toContain("secret-value");
    expect(JSON.stringify(result.loadedFrom)).not.toContain("IMAGE2_API_KEY");

    const withExtra = resolveImage2StartupEnv({ runDir: value.runDir, env: {}, extraKeys: ["PPT_FONT_DIR"] });
    expect(withExtra.env.PPT_FONT_DIR).toBe("/fonts");
  });

  it("supports unbound searchDirs order (nearest ancestor first, fills still-missing)", () => {
    const value = fixture();
    writeFileSync(join(value.cwd, ".env"), "IMAGE2_API_KEY=nearest\n");
    const parent = join(fixtureRoot, "parent");
    mkdirSync(parent, { recursive: true });
    writeFileSync(join(parent, ".env"), "IMAGE2_API_KEY=parent\nIMAGE2_PROVIDER_PROFILE_ID=parent-profile\n");

    const result = resolveImage2StartupEnv({ searchDirs: [value.cwd, parent], env: {} });
    expect(result.env.IMAGE2_API_KEY).toBe("nearest");
    expect(result.env.IMAGE2_PROVIDER_PROFILE_ID).toBe("parent-profile");
  });

  it("apply fills env gaps idempotently without touching other keys", () => {
    const value = fixture();
    writeFileSync(join(value.deck, ".env"), "IMAGE2_API_KEY=deck-key\nIMAGE2_BASE_URL=https://deck.example/v1\n");
    const env = { IMAGE2_PROVIDER_PROFILE_ID: "shell-profile", UNRELATED: "keep" };
    const first = applyImage2StartupEnv({ runDir: value.runDir, env });
    const second = applyImage2StartupEnv({ runDir: value.runDir, env });
    expect(env.IMAGE2_API_KEY).toBe("deck-key");
    expect(env.IMAGE2_BASE_URL).toBe("https://deck.example/v1");
    expect(env.IMAGE2_PROVIDER_PROFILE_ID).toBe("shell-profile");
    expect(env.UNRELATED).toBe("keep");
    expect(second.loadedFrom).toEqual([]);
    expect(first.loadedFrom.length).toBeGreaterThan(0);
    expect(Object.keys(env).sort()).toEqual(["IMAGE2_API_KEY", "IMAGE2_BASE_URL", "IMAGE2_PROVIDER_PROFILE_ID", "UNRELATED"].sort());
  });

  it("handles missing and empty .env files without error", () => {
    const value = fixture();
    const missing = resolveImage2StartupEnv({ runDir: value.runDir, env: {} });
    expect(missing.env.IMAGE2_API_KEY).toBeUndefined();
    expect(missing.loadedFrom).toEqual([]);
    writeFileSync(join(value.deck, ".env"), "# comment only\n");
    const empty = resolveImage2StartupEnv({ runDir: value.runDir, env: {} });
    expect(empty.loadedFrom).toEqual([]);
  });

  it("exposes the canonical declared key set", () => {
    expect(IMAGE2_STARTUP_KEYS).toEqual(["IMAGE2_API_KEY", "IMAGE2_BASE_URL", "IMAGE2_PROVIDER_PROFILE_ID"]);
    expect(Object.isFrozen(IMAGE2_STARTUP_KEYS)).toBe(true);
  });
});
