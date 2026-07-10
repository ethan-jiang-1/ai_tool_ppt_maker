## Why

`framework-directory-layout` 主 spec 与现状不符，且与刚对齐的 `framework-charter` **自相矛盾**:

- root 写 "exactly **four** subdirectories"（Purpose 段 + 需求都只列 `workflow/ scripts/ charter/ reference/`）——实际 **5** 个（多 `playbook/`）。`framework-charter` 已在 main-specs-sync 修成 five，两个 spec 现在互相打架。
- reference 文档写大写 `QUICK_START.md` 等——实际小写 `quick-start.md`。

这是 main-specs-sync 漏掉的同一类 content↔现状 修复（framework-directory-layout 当时不在那次的 3 个目标 spec 里）。

## What Changes

- RENAMED + MODIFIED "Framework root has exactly four subdirectories" → **five**（+`playbook/`）；sync 时一并改 Purpose 段 "four-subdirectory root" 措辞
- MODIFIED "Reference documents are under reference/" → 小写文件名（`quick-start.md` / `glossary.md` / `anti-patterns.md` / `version-log.md`）

## Capabilities

### Modified Capabilities

- `framework-directory-layout`: root 子目录 4→5（+playbook/），reference 文档命名对齐现状
