# 02-visual-system internals

Visual configuration, asset catalog, components, tokens, and geometry loading belong here.

`page_design_system.mjs` owns the confined override-first resolver for the
optional shared opaque provider-design source. Its injected read-only filesystem
factory is internal test support only; the public entry exposes the Node-default
resolver and declared schema/error/byte-limit names, never filesystem access.
