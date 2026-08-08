## ADDED Requirements

### Requirement: Delivery projections preserve final PNG authority across supported layouts

Shared delivery SHALL render its rebuildable final-media contact projection
from CRC-valid final PNG media with an exact decoded pixel count and supported
8-bit or 16-bit grayscale, grayscale-alpha, RGB, or RGBA layout. It SHALL use
only derived normalized pixels for that projection while retaining final PNG
bytes, actual dimensions, manifest entries, hashes, JPEG delivery-media
bindings, PPTX input lineage, and receipt authority unchanged.

An inconsistent or unsupported decoded layout SHALL stop the owning delivery
projection before delivery writes final PNG files, delivery media, or its
receipt. It SHALL not overwrite or transcode the final PNG, alter the final
manifest, invent a delivery-media entry, or bypass existing final-media
validation.

#### Scenario: Delivery contact projection renders a 16-bit RGB Pure final PNG

- **WHEN** a current Pure final manifest references CRC-valid 16-bit RGB PNG
  bytes with matching final hash and actual dimensions
- **THEN** shared delivery renders its derived contact projection from
  normalized pixels
- **AND** the final manifest and Pure final PNG remain byte-identical to the
  accepted provider page

#### Scenario: Invalid decoded final layout cannot publish a receipt

- **WHEN** the delivery projection encounters a decoded final PNG layout whose
  sample count is inconsistent with its dimensions
- **THEN** delivery stops before writing final PNG files, delivery media, or
  the final delivery receipt
- **AND** it does not modify the persisted final manifest or final PNG bytes
