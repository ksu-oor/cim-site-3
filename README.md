# cim-site-3

Marketing site for the **Center for Interactive Media (CIM)** at Kennesaw
State University. Built with [Eleventy](https://www.11ty.dev/) and
edited via [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at
`/admin/`.

## Quick start

```bash
npm install
npm run dev      # → http://localhost:8080 with live reload
npm run build    # → _site/ (what Vercel serves)
```

## How it works

- **Pages** live in `src/*.njk` (Nunjucks templates).
- **Content** lives in `content/*.json` (and `content/spotlights/*.json`).
  Editing a JSON file regenerates the matching HTML on the next build.
- **Shared layout** is in `_includes/layout.njk`; reusable components in
  `_includes/components/`; spotlight slide variants in `_includes/slides/`.
- **Static assets** (CSS, JS, partner logos) live in `public/` and are
  passthrough-copied to the site root by Eleventy.
- **Hosting:** Vercel auto-deploys every push to `main`.
- **Admin:** Sveltia CMS at `/admin/` lets content owners edit the JSON
  files via a web UI. Sign-in uses GitHub OAuth; only repo collaborators
  can save changes.

## CMS setup (one-time)

See [`docs/cms-setup-guide.md`](docs/cms-setup-guide.md) for the
GitHub OAuth App registration and Vercel env var setup. Until those are
done, `/admin/` won't be able to authenticate.

## Architecture spec

See [`docs/superpowers/specs/2026-04-28-cms-sveltia-eleventy-design.md`](docs/superpowers/specs/2026-04-28-cms-sveltia-eleventy-design.md)
for the full design rationale (data schema, variant slides, build
pipeline, OAuth flow).

## What's editable via the CMS

- Site settings (institution, footer, contact email)
- Homepage hero
- Three spotlight carousels (research, showcase, touchpoint) — 16 slides total across 8 variants
- Sponsors & partners (single source of truth for both spotlight grids)
- Faculty (49 entries across 6 colleges)
- Launch event (homepage tile + full event landing page)

The accessibility statement page (`accessibility.html`) is currently
**developer-edited** because of its heavily-styled prose. To update,
edit `src/accessibility.njk` and open a PR.

## Deploy flow

```
editor saves in /admin/
   → Sveltia commits content/<file>.json on main (via GitHub API)
   → Vercel webhook triggers `npm run build`
   → Eleventy regenerates HTML from JSON + templates
   → live site updated (~30s end-to-end)
```
