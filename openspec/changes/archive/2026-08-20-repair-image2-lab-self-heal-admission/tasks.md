## 1. Binding identity vs repairable Lab absence

- [x] 1.1 Teach `checkDeckRootControls` an identity-only option that ignores complete `_lab/` absence and still rejects file/symlink/non-directory present paths via `lstat` (`run-bundle-management`). Done: `--check` still reports missing `_lab/` as repairable layout; binding can opt out of that finding.
- [x] 1.2 `verifyDeckHarnessBinding` uses that option and stays read-only (`run-bundle-management`). Done: missing `_lab/` alone does not yield `deck_root_unverified`; unsafe present `_lab` still does.
- [x] 1.3 Locator tests for missing-lab resolve and file/symlink hard-stop (`run-bundle-management`). Done: `--check` still names missing `_lab/`; symlink-to-directory is not accepted as an ordinary lab directory; no production `deck_*` fixture.

## 2. Lab confine-then-heal

- [x] 2.1 Lab `admitRun` confines existing `_lab/` components before `ensureLabScaffold`, then re-confines the final directory (`image2-lab`). Done: symlink/file fail with zero scaffold writes on the target.
- [x] 2.2 Missing `_lab/` Lab `plan` heals the canonical empty scaffold and continues (`image2-lab`). Done: binding no longer blocks the heal; generate/probe still do not write `_lab/`.
- [x] 2.3 Lab tests for missing-scaffold heal and symlink-target byte-identity (`image2-lab`). Done: zero fetch on the symlink case; no production deck fixture.

## 3. Validation

- [x] 3.1 `openspec validate repair-image2-lab-self-heal-admission --strict` and `npm test`, plus the targeted locator/Lab tests. Done: specified scenarios have proof.
