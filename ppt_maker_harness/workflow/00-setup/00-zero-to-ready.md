# Zero To Ready

1. Run `ppt_flow doctor --run-dir <run-dir> --operation framed-local-refresh` only for a bound Framed version.
2. Create a deck with `ppt_flow init deck_<name> --deck-type <type> --style <style>`.
3. Author Page Image Workflow source with stable mnemonic IDs, then explicitly record one
   `production.workflow: framed|pure` for the version.
4. Run raw-generation readiness only when a user-approved raw scope is ready.

The local Framed readiness path is provider-free. A successful raw readiness
check never authorizes generation by itself.
