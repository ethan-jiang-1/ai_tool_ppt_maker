# Phase 4 — Image2 visual-slot refinement

This directory owns the optional, authorized modern Image2 capability for a
marked HTML-first version. `index.mjs` is the only public interface; the
implementation and injectable transport stay under `internal/`.

The lifecycle is deliberately bounded:

`plan -> authorize -> generate -> review -> accept|use-html -> cleanup`

No ordinary HTML build/local refresh or explicit whole-page Image2 command imports the
transport. Accepted bytes are version source under the two refined asset roots;
candidates, comparisons, attempts, and journals remain lazy derived/scratch
evidence. Use `ppt_flow image2 --help` for the closed command family.
