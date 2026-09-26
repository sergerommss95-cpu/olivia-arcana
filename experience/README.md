# Editable Olivia experience

Start with [the current session handoff](../SESSION_HANDOFF.md). This directory preserves the complete source and reference inputs needed to recreate the latest product. `website/public/experience/` is committed as a ready-to-build snapshot; it is generated, not the place to make product edits.

## Rebuild from a fresh checkout

Requirements: Node.js 20.9 or newer (22 LTS recommended), npm, Python 3.10 or newer. Use the committed package locks.

From the repository root:

```sh
npm --prefix experience/work/background-study ci --ignore-scripts
npm --prefix experience/work/olivia-product ci --ignore-scripts
node --test experience/work/olivia-product/*.test.mjs
node experience/work/olivia-product/mobile-question.review.mjs
python3 experience/build.py
npm --prefix website ci --ignore-scripts
npm --prefix website run build
```

`experience/build.py` regenerates the portable HTML and hosted assets, validates their references and JavaScript, then copies the hosted files into the native website. It retains older hash-addressed assets for already-open documents. `website/out/` is the static export. Netlify edge functions are required for optional personal readings; a plain static file server does not run them.

## Develop

```sh
npm --prefix website run dev
```

Edit `experience/work/olivia-product/`, run `python3 experience/build.py`, then reload the native preview. The EN/UK homepage markup is rendered into the Next export; it is not an iframe. Native routes, SEO and integration live under `website/src/`. The optional reading service lives under `website/netlify/edge-functions/`.

## Inputs preserved

- `work/olivia-product/`: current product source, tests, 56 Minor Arcana images, documented snapshots.
- `work/hero-v12/assets/public/cards-portal/`: 22 Major Arcana images used by the builder. This folder name is historical; do not substitute another animation revision based on it.
- `outputs/olivia-card-back.webp`: approved Olive Lattice back.
- `outputs/olivia-approved-motion-2026-09-24.html`: immutable animation/artwork reference, verified by SHA-256 in regression tests.
- `work/fonts-inline.css`, font license files: original font inputs.
- `work/background-study/package*.json`: pinned esbuild and Shaders dependency installation.
- `outputs/`: dated strategy, research, release and QA records. Older records describe older releases; see the session handoff for current authority.

Do not run `work/olivia-product/prepare.py`: it is an old bootstrap script that would overwrite current source with an earlier template. `snapshots/`, `integration-backup/`, `hero-lab/`, and older handoffs are historical material, not the current runtime.

## Services and private data

Credentials are not included. Native account/payment features default to unavailable unless their real services are configured. Follow the current service source and environment variable names; never infer production readiness from historical notes. Browser-local readings are not cloud-synced accounts. Do not upload a visitor's existing journal without explicit consent.
