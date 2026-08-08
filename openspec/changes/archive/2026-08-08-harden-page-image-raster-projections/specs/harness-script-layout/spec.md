## ADDED Requirements

### Requirement: Cross-owner derived-raster conversion has one registered public seam

The Harness SHALL expose a registered public shared interface for deterministic
PNG-to-derived-raster conversion when that conversion is used by more than one
target method module. The interface SHALL be listed by the architecture guard
and its source/test owner SHALL declare the interface and focused tests in the
repository ownership manifest. A target method module SHALL import that
registered interface rather than a private shared implementation path.

The shared raster interface SHALL operate only on decoded PNG layouts and
derived canvas pixels. It SHALL not own workflow semantics, provider work,
selection, evidence, manifests, persistent state, or delivery publication.

#### Scenario: Framed and delivery use the registered shared raster interface

- **WHEN** architecture validation inspects Framed capture and shared delivery
  imports for derived PNG rendering
- **THEN** it recognizes the common raster interface as a registered public
  shared seam
- **AND** the interface and its focused tests have exactly one declared owner

#### Scenario: An unregistered raster helper cannot become a cross-owner import

- **WHEN** a target method module imports a shared raster helper that is not
  registered as a public interface
- **THEN** architecture validation rejects the import before it becomes a
  production route
- **AND** it does not treat a file's presence or a test's existence as public
  seam admission
