## 1. framework-directory-layout 内容对齐

- [x] 1.1 "Framework root has exactly four subdirectories" → five（+`playbook/`），RENAMED + MODIFIED body + scenario
- [x] 1.2 Purpose 段 "four-subdirectory root (`workflow/`, `scripts/`, `charter/`, `reference/`)" → five（+`playbook/`）
- [x] 1.3 "Reference documents are under reference/" 文件名大写→小写

## 2. Sync + Verify

- [x] 2.1 sync delta 到 `openspec/specs/framework-directory-layout/spec.md`（含 Purpose 段直接编辑）
- [x] 2.2 与 `framework-charter` "five subdirectories" 一致（两处 grep 都是 five，不再打架）
- [x] 2.3 `ls -d PPTMAKER_FRAMEWORK/*/` = 5，与 spec 计数一致
- [x] 2.4 `openspec validate framework-directory-layout --specs` 通过（该 spec 本就是规范格式）
