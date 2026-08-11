# PPT Maker Harness Workflow

New Page Image work is version-homogeneous. After `01-content` records one
Page Image Workflow and `02-visual-system` supplies shared visual inputs, the target
method graph is:

```text
03-framed-image XOR 04-pure-image -> 05-delivery -> 06-iteration
```

| Method module | Ownership |
| --- | --- |
| 00 | Run bundle and operation-scoped readiness |
| 01 | Page Image Workflow source, stable slide identity, and workflow receipt |
| 02 | Visual language and shared reference inputs |
| 03 | Framed semantic rules, protected geometry, local header-overlay composition |
| 04 | Pure display/raw contract and raw-to-final publication |
| 05 | Shared final manifest consumption, projection, PPTX, notes, delivery review |
| 06 | Workflow-aware refresh classification and structural routing |

`03` and `04` are mutually exclusive siblings; neither owns the other's
semantics or delivery. An undeclared, partial, hybrid, or mismatched source/state
pair is a byte-preserving `repair-current-protocol-identity` hard-stop, not an
observation-continuation or current workflow route.
