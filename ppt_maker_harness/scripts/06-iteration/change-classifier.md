# Target Change Classifier

Read the exact v2 source/state pair first. Use the bound version workflow and
direct receipt/evidence facts; do not classify from generated files, a snapshot
position, or an authority choice for one slide.

| Bound workflow / request | Owner-valid path |
| --- | --- |
| `framed` Text Frame-only, current accepted raw + preset | Header Text & Style Refresh through `03-framed-image`, then delivery. |
| `framed` preset, underlay, or visual change | Generated Image Rebuild through the Framed workflow. |
| `pure` visible display or visual change | Generated Image Rebuild through the Pure workflow. |
| Either workflow, speaker notes only | Notes-Only Refresh through `05-delivery`. |
| Insert, delete, reorder, or Framed/Pure switch | Structural Versioning Path. |

Selection is by stable `slide_id`. Structural operations bind the target workflow
into preview and exact plan hash; `position` resolves only to a stable ID. The
target may report `needs_render` debt but structural apply never creates a
provider request. Raw generation remains separately authorized.
