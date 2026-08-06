# HTML runtime font provenance

Snapshot date: 2026-07-18

## Source Sans 3

- Upstream owner: Adobe Fonts
- Release: `3.052R`
- Release page: `https://github.com/adobe-fonts/source-sans/releases/tag/3.052R`
- Official release asset: `WOFF2-source-sans-3.052R.zip`
- Committed original filename: `SourceSans3VF-Upright.ttf.woff2`
- Committed source URL: `https://raw.githubusercontent.com/adobe-fonts/source-sans/3.052R/WOFF2/VF/SourceSans3VF-Upright.ttf.woff2`
- Style and axis: normal variable, weights 200-900
- Acquisition note: the byte-identical tagged-repository file was used because the release-asset CDN failed with an HTTP/2 framing error in this maintenance environment.

## Noto Sans SC

- Upstream service: Google Fonts CSS API and `fonts.gstatic.com`
- Request URL: `https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@100..900&display=swap`
- User-agent class: modern Chromium on Windows x86-64
- User-Agent: `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36`
- Served family path/version: `s/notosanssc/v40`
- Style and axis: normal variable, weights 100-900
- Snapshot rule: `original.css` and every URL it references are immutable inputs. The record count is response-specific and is not a permanent product requirement.

All runtime CSS uses committed relative URLs. Doctor and rendering never contact either upstream.
