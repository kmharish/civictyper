# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Scroll-driven image sequence animation website for a Honda Civic FD2 Type R showcase. As the user scrolls, pre-extracted video frames are drawn to a full-screen canvas, creating a "video scrubbing" effect synced to scroll position.

## Architecture

- **`index.html`** — Single-page app with a fixed canvas and overlay scroll sections (hero, features, handling, design, footer). No build system; open directly or serve with any static file server.
- **`script.js`** — Core runtime: preloads 738 WebP frames in two phases (fast-load first 30 frames, then lazy-load rest in batches of 5 to avoid iOS Safari connection limits), maps scroll position to frame index, renders to canvas with cover-fit scaling. Also adds mouse/gyroscope parallax tilt on the hero section.
- **`styles.css`** — Styling with CSS custom properties (`--bg-color`, `--text-accent`). Uses `clamp()` for responsive typography. Intersection Observer triggers `.visible` class for fade-in animations.
- **`frames_webp/`** — 738 WebP frames named `frame_0000.webp` through `frame_0737.webp` (1280px wide, 50% WebP quality).

## Frame Pipeline (Python)

Requires Python venv with `opencv-python`:

```bash
source venv/bin/activate
```

1. **Extract frames** from source video: `python split.py` — reads the mp4, writes JPGs to `frames/`
2. **Compress to WebP**: `python compress.py` — reads `frames/*.jpg`, resizes to 1280px width, saves as WebP at quality 50 to `frames_webp/`

## Key Constants

- `frameCount = 738` in `script.js:5` — must match actual frame count in `frames_webp/`
- `fastLoadCount = 30` in `script.js:48` — frames loaded before hiding the loader
- `batchSize = 5` in `script.js:94` — lazy-load batch size (tuned for iOS Safari)
- `TARGET_WIDTH = 1280` in `compress.py:14` — output frame width

## iOS/Safari Considerations

Image preloading uses Promise-based loading with batched lazy-loading (not concurrent bulk loading) because iOS Safari silently fails when too many image requests are in-flight simultaneously.
