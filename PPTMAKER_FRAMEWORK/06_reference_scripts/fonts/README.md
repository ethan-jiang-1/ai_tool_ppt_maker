# fonts/ — bundled fonts for the Header-Lock stage (optional)

Stage 3 (`stage3_lock_headers.mjs`) overlays kicker/title/subtitle text onto the
AI-generated body images. Its `_load_font()` resolves fonts **cross-platform** in
this order:

1. **this `fonts/` dir** (bundled — highest priority)
2. `$PPT_FONT_DIR` (an env var pointing at a font dir)
3. common OS font dirs (macOS `/Library/Fonts`, Linux `/usr/share/fonts`,
   Windows `C:/Windows/Fonts`, plus the usual per-user dirs)

## Why drop fonts here

The style-anchor typeface is **Source Sans Pro**. If you put its `.otf` files in
this dir, the deck renders with the exact intended face on **any** machine — no
OS install required, fully reproducible (e.g. in CI or on a colleague's laptop).

Expected filenames (see the `FONT_*` constants at the top of the script):

- `SourceSansPro-Bold.otf`
- `SourceSansPro-Semibold.otf`
- `SourceSansPro-Regular.otf`

(Download from the [Source Sans family](https://github.com/adobe-fonts/source-sans).)

## What happens if this dir is empty

Nothing breaks silently. If the intended face isn't found anywhere, `_load_font`
falls back to a readable, **correctly-sized** system sans (DejaVu / Arial /
Liberation / Helvetica) and prints a loud one-time warning that the typeface
differs from the anchor. Only if *no* usable font exists at all does it hard-abort
with install guidance. It never returns `ImageFont.load_default()` (a fixed-size
bitmap that would ignore the palette's `size_px` and ship garbled headers).

## CJK text

For Chinese/Japanese/Korean slides, drop a Noto Sans CJK `.otf` here and point
`FONT_BOLD` / `FONT_SEMIBOLD` / `FONT_REGULAR` at it.

---

*This dir may be empty — it exists so the bundled-font path is discoverable. Font
binaries are intentionally not committed.*
