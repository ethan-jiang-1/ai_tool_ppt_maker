# Zero To Ready

1. Run `ppt_flow doctor --mode image2-page-authority --operation framed-local-refresh`.
2. Create a deck with `ppt_flow init deck_<name> --deck-type <type> --style <style>`.
3. Author Page Authority source with stable mnemonic IDs and explicit Pure or Framed ownership.
4. Run raw-generation readiness only when a user-approved raw scope is ready.

The local Framed readiness path is provider-free. A successful raw readiness
check never authorizes generation by itself.
