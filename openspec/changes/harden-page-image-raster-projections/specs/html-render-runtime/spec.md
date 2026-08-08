## ADDED Requirements

### Requirement: Framed capture crops decoded PNG pixels without a fixed source stride

The private Framed capture runtime SHALL crop its fixed device-pixel output
from CRC-valid Chromium screenshot PNGs according to their decoded dimensions
and supported pixel layout, rather than assuming four source bytes per pixel.
For supported 8-bit grayscale, grayscale-alpha, RGB, and RGBA captures, it
SHALL produce an output-profile PNG with the exact required dimensions and
preserve visible-pixel/nonblank verification semantics across RGB and RGBA
captures.

An invalid capture dimension, malformed sample count, or unsupported decoded
layout SHALL fail closed at the current runtime capture path before final
artifact publication. It SHALL not select a different browser, change the
capture profile, add a fallback renderer, or create workflow state.

#### Scenario: Chromium RGB screenshot crops to the fixed output height

- **WHEN** Chromium returns a CRC-valid RGB screenshot at the expected raw
  capture dimensions
- **THEN** the runtime removes exactly the fractional device row and emits the
  fixed output-profile PNG
- **AND** nonblank verification evaluates the cropped pixels without treating
  RGB samples as RGBA source bytes

#### Scenario: Chromium RGBA screenshot retains equivalent crop behavior

- **WHEN** Chromium returns a CRC-valid RGBA screenshot at the expected raw
  capture dimensions
- **THEN** the runtime emits the same fixed output dimensions and verifies its
  visible pixels
- **AND** it does not change the pinned browser or capture profile

