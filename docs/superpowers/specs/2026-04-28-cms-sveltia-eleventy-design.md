# CIM Site CMS — Sveltia + Eleventy on Vercel

**Status:** Design approved through Section 6, awaiting written-spec review
**Date:** 2026-04-28
**Repo:** `ksu-oor/cim-site-3`
**Hosting:** Vercel
**Owner:** ngoldbla

---

## Context

The site at `ksu-oor/cim-site-3` is a hand-authored static HTML site for the
Kennesaw State University Center for Interactive Media. All content
(hero copy, three spotlight carousels with ~16 slides total, partner/sponsor
logos, 49-entry faculty list, launch-event details, accessibility statement)
currently lives directly in the markup of `index.html`, `faculty.html`,
`event.html`, and `accessibility.html`. Updating any visible string requires
editing HTML, opening a PR, and merging — fine for a developer but not for
the people who actually own the content.

We need a way to update the site with **minimal overhead** — a web-based
editor for the content owners, with simple authentication, that does not
require migrating to a new framework, and does not introduce a runtime
database or third-party services beyond the ones we already use (GitHub,
Vercel).

The intended outcome is that any content owner with a GitHub account and
collaborator access on `ksu-oor/cim-site-3` can edit any visible content on
the site through a web admin at `/admin/`, click save, and see the change
live on the public site within ~30 seconds — without ever touching HTML or
git directly.

## Constraints / Decisions Confirmed With User

| # | Decision | Value |
|---|---|---|
| 1 | Hosting | Vercel |
| 2 | Editable scope | Everything (hero, spotlights, partners, faculty, events, footer, accessibility) |
| 3 | Auth model | GitHub OAuth (not shared password) |
| 4 | Third-party services beyond GitHub + Vercel | None (no Supabase, no Auth0, no Netlify Identity) |
| 5 | CMS choice | Sveltia CMS (modern Decap-compatible fork) |
| 6 | Build tool | Eleventy v3 |
| 7 | Partner/sponsor logo handling | Hybrid — existing partners keep CSS classes; new partners use image upload |

## Architecture

### Edit flow

```
Editor opens /admin/
   │ "Sign in with GitHub"
   ▼
github.com OAuth consent (scope: repo, user)
   │ auth code
   ▼
api/auth/github/callback (Vercel function holds CLIENT_SECRET)
   │ exchanges code → access token
   ▼
Sveltia receives token via window.postMessage, stores in localStorage
   │ editor saves a change
   ▼
GitHub Contents API: PUT /content/<file>.json (one commit per save)
   │ commit lands on `main`
   ▼
Vercel auto-deploys: runs `npm run build` (Eleventy)
   │ Eleventy reads content/*.json + _includes/*.njk
   ▼
/index.html, /faculty.html, /event.html, /accessibility.html regenerated
   │
   ▼
Live site updated (~30 seconds end-to-end)
```

### Repo layout (after migration)

```
cim-site-3/
├── content/                  # Source-of-truth data (edited via CMS)
│   ├── site.json
│   ├── hero.json
│   ├── spotlights/
│   │   ├── research.json
│   │   ├── showcase.json
│   │   └── touchpoint.json
│   ├── partners.json
│   ├── faculty.json
│   ├── event.json
│   └── accessibility.md
├── _includes/                # Eleventy templates (partials)
│   ├── layout.njk
│   ├── slides/
│   │   ├── project-list.njk
│   │   ├── stats-grid.njk
│   │   ├── sponsor-grid.njk
│   │   ├── partner-grid.njk
│   │   ├── faculty-bar.njk
│   │   ├── game-card.njk
│   │   ├── feature.njk
│   │   └── touchpoint.njk
│   └── components/
│       ├── hero.njk
│       ├── spotlight.njk
│       ├── spotlight-controls.njk
│       ├── launch-event-tile.njk
│       └── footer.njk
├── src/                      # Eleventy input pages
│   ├── index.njk
│   ├── faculty.njk
│   ├── event.njk
│   └── accessibility.njk
├── admin/                    # Sveltia admin (served as static)
│   ├── index.html
│   └── config.yml
├── api/auth/                 # Vercel serverless functions
│   ├── github.js
│   └── github/callback.js
├── public/                   # Static assets, passthrough-copied
│   ├── styles.css
│   ├── spotlight.js
│   ├── uploads/              # CMS-uploaded images land here
│   └── assets/partners/
├── .eleventy.js
├── package.json
├── vercel.json
└── .gitignore
```

### What does not change

- `styles.css` — design system stays as authored.
- `spotlight.js` — carousel runtime continues to query the same DOM.
- Public URL structure (`/`, `/faculty.html`, `/event.html`, `/accessibility.html`).

## Content Schema

### Variant slide pattern (the most important decision)

Each spotlight slide carries a `type` field. Sveltia's `list` widget with
`types:` renders different fields per variant. Eleventy's `spotlight.njk`
dispatches via `{% include "slides/" + slide.type + ".njk" %}`.

Eight slide variants:

| `type` | Fields |
|---|---|
| `project-list` | `label`, `tagline?`, `heroStat?: {value, unit}`, `projects[]: {name, tags, progress, progressLabel, progressVariant}` |
| `stats-grid` | `label`, `stats[]: {value, label}` |
| `sponsor-grid` | `label`, `items[]: partner` |
| `partner-grid` | `label`, `items[]: partner` |
| `faculty-bar` | `label`, `total`, `segments[]: {college, count, variant}`, `legend[]`, `cta: {text, href}` |
| `game-card` | `label`, `title`, `tags`, `meta`, `imageUrl`, `href`, `availableLabel?` |
| `feature` | `label`, `name`, `subtitle`, `ctaText`, `ctaHref`, `ctaVariant` (`interactive\|accent`), `worldStyling: bool` |
| `touchpoint` | `label`, `primary`, `primaryHref?`, `decoration` (`qr\|mark\|none`), `cta?: {text, href, variant}`, `address?: {lines[]}` |

### File-by-file schema

```jsonc
// content/site.json
{
  "siteName": "CIM",
  "fullName": "Center for Interactive Media",
  "institution": "KENNESAW STATE UNIVERSITY · OFFICE OF RESEARCH",
  "contactEmail": "cim@kennesaw.edu",
  "footerClusters": ["GAME STUDIO", "DIGITAL TWIN", "XR & HEALTHCARE", "IMMERSIVE ED", "DIGITAL HUMANITIES"],
  "footerCopy": "© 2026 Center for Interactive Media, Kennesaw State University"
}
```

```jsonc
// content/hero.json
{
  "label": "KENNESAW STATE UNIVERSITY · OFFICE OF RESEARCH",
  "title": "CIM",
  "subtitle": "Center for Interactive Media",
  "description": "49 KSU researchers build games, XR systems, and digital twins.",
  "ctaText": "START A CONVERSATION",
  "ctaHref": "mailto:cim@kennesaw.edu"
}
```

```jsonc
// content/spotlights/research.json
{
  "label": "Research spotlight",
  "stagger": 0,
  "slides": [
    {
      "type": "project-list",
      "label": "KSU GAME STUDIO",
      "tagline": null,
      "heroStat": { "value": "23", "unit": "STUDENTS" },
      "projects": [
        { "name": "Project Excelsior", "tags": "Visual Novel · Dungeon · Identity",
          "progress": 40, "progressLabel": "EARLY DEV", "progressVariant": "default" }
      ]
    }
    // ...4 more slides
  ]
}
```

```jsonc
// content/partners.json — single source of truth for sponsor + partner spotlight slides
{
  "sponsors": [
    { "name": "Amazon Web Services", "shortName": "AWS",
      "href": "https://aws.amazon.com/",
      "ariaLabel": "Amazon Web Services — cloud infrastructure sponsor",
      "logoClass": "aws", "logoImage": null }
  ],
  "partners": [
    { "name": "Atlanta Regional Commission", "shortName": "ARC",
      "href": "https://atlantaregional.org/",
      "ariaLabel": "Atlanta Regional Commission — regional planning partner",
      "logoClass": "arc", "logoImage": null }
  ]
}
```

```jsonc
// content/faculty.json
{
  "members": [
    { "name": "Joy Li", "dept": "Software Engineering & Game Development",
      "interest": "XR, HCI, serious games", "email": null }
    // ...48 more
  ]
}
```

```jsonc
// content/event.json — launch event page
{
  "date": "APR 27", "year": "2026",
  "time": "9 AM – 2 PM",
  "venue": "Shore Innovation Center",
  "city": "Marietta, GA",
  "address": { "lines": ["970 Technology Way", "Marietta, GA 30060", "KSU Marietta Campus"] },
  "tagline": "...",
  "sponsors": ["AWS", "UNITY", "SGR LAW"],
  "program": [ /* sessions, populated from current event.html */ ]
}
```

`content/accessibility.md` — markdown body, edited via Sveltia rich-text widget.

### Partner logo handling (γ — hybrid)

Each partner object has both `logoClass` (string, optional, picks from a
fixed dropdown) and `logoImage` (image upload, optional). Mutually
exclusive. Template:

```njk
{% if item.logoClass %}
  <span class="partner-logo partner-logo--{{ item.logoClass }}" aria-hidden="true"></span>
{% else %}
  <img src="{{ item.logoImage }}" alt="" class="partner-logo partner-logo--uploaded" />
{% endif %}
```

Editors adding a brand-new partner choose image upload. Existing partners
keep their hand-tuned CSS classes. Adding a new `logoClass` value remains
a developer task (requires CSS).

## Build Pipeline

`.eleventy.js`:

```js
module.exports = (eleventy) => {
  eleventy.addPassthroughCopy({ "public": "/" });
  eleventy.addShortcode("year", () => new Date().getFullYear());
  return {
    dir: { input: "src", includes: "../_includes", data: "../content", output: "_site" },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
```

`package.json`:

```json
{
  "name": "cim-site-3", "private": true,
  "scripts": {
    "dev": "eleventy --serve --quiet",
    "build": "eleventy"
  },
  "devDependencies": { "@11ty/eleventy": "^3.0.0" }
}
```

`vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "_site",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    { "source": "/admin/:path*",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Cache-Control",   "value": "no-store" }
      ]
    }
  ]
}
```

Local dev workflow: `npm install && npm run dev` → `http://localhost:8080`,
live-reloads on JSON or template change.

### Variant dispatch (the keystone template)

`_includes/components/spotlight.njk`:

```njk
{% set spotData = spotlights[spot] %}
<section class="spotlight spotlight--{{ spot }} tile" data-spotlight="{{ spot }}"
         role="region" aria-roledescription="carousel" aria-label="{{ spotData.label }}">
  <div class="spotlight__stage" aria-live="off">
    {% for slide in spotData.slides %}
      <article class="slide" data-slide-index="{{ loop.index0 }}"
               {% if loop.first %}data-active{% endif %}>
        {% include "slides/" + slide.type + ".njk" %}
      </article>
    {% endfor %}
  </div>
  {% include "components/spotlight-controls.njk" %}
</section>
```

## Authentication & Admin UI

### Decisions

- **Standard OAuth web flow**, not device flow. ~30 lines of Vercel function trades for one-click sign-in.
- **OAuth App registered under `ksu-oor` GitHub org**, not personal. Survives staff turnover.
- **Editor allow-list = repo collaborators** on `ksu-oor/cim-site-3`. GitHub repo permissions are the single source of truth for who can edit.
- **Admin URL `/admin/` is not obscured.** Real auth makes obscurity unnecessary.
- **Sveltia CMS loaded from CDN, version-pinned via specific semver tag** (not `@latest` in production).

### `/admin/index.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>CIM Admin</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body>
  <script type="module" src="https://unpkg.com/@sveltia/cms@0.x/dist/sveltia-cms.js"></script>
</body>
</html>
```

### `/admin/config.yml` (skeleton — full file is ~150 lines)

```yaml
backend:
  name: github
  repo: ksu-oor/cim-site-3
  branch: main
  base_url: https://cim-site-3.vercel.app
  auth_endpoint: api/auth/github

media_folder: "public/uploads"
public_folder: "/uploads"

collections:
  - name: site
    label: "Site Settings"
    files:
      - { name: site,  label: Global,       file: content/site.json,  fields: [...] }
      - { name: hero,  label: Hero,         file: content/hero.json,  fields: [...] }
      - { name: event, label: Launch Event, file: content/event.json, fields: [...] }

  - name: spotlights
    label: "Spotlight Carousels"
    files:
      - { name: research,   file: content/spotlights/research.json,   fields: [...] }
      - { name: showcase,   file: content/spotlights/showcase.json,   fields: [...] }
      - { name: touchpoint, file: content/spotlights/touchpoint.json, fields: [...] }

  - name: faculty
    label: "Faculty"
    files:
      - { name: members, file: content/faculty.json, fields:
          [{ label: Members, name: members, widget: list, fields:
              [ {label: Name,        name: name,     widget: string},
                {label: Department,  name: dept,     widget: string},
                {label: Interest,    name: interest, widget: string},
                {label: Email,       name: email,    widget: string, required: false} ] }] }

  - name: partners
    label: "Sponsors & Partners"
    files:
      - { name: partners, file: content/partners.json, fields: [...] }
```

### `/api/auth/github.js` (initial redirect)

```js
export default function handler(req, res) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
    redirect_uri: `${process.env.SITE_URL}/api/auth/github/callback`,
    scope: "repo,user",
    state: req.query.state || "",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
```

### `/api/auth/github/callback.js` (token exchange + postMessage handoff)

```js
export default async function handler(req, res) {
  const { code } = req.query;
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_OAUTH_CLIENT_ID,
      client_secret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      code,
    }),
  });
  const { access_token, error } = await tokenRes.json();
  const payload = error
    ? `authorization:github:error:${JSON.stringify({ error })}`
    : `authorization:github:success:${JSON.stringify({ token: access_token, provider: "github" })}`;
  res.setHeader("Content-Type", "text/html");
  res.end(`<script>
    (function(){
      function send(){ window.opener.postMessage(${JSON.stringify(payload)}, "*"); }
      window.addEventListener("message", send, { once: true });
      send();
    })();
  </script>`);
}
```

## Vercel Configuration

### Environment variables

| Var | Value | Scope |
|---|---|---|
| `GITHUB_OAUTH_CLIENT_ID`     | from GitHub OAuth App | Production, Preview |
| `GITHUB_OAUTH_CLIENT_SECRET` | from GitHub OAuth App (encrypted)| Production, Preview |
| `SITE_URL`                   | `https://cim-site-3.vercel.app` (or custom domain) | Production |

### GitHub OAuth App (registered under `ksu-oor` org)

| Field | Value |
|---|---|
| Application name | CIM Site CMS |
| Homepage URL | `https://cim-site-3.vercel.app` |
| Authorization callback URL | `https://cim-site-3.vercel.app/api/auth/github/callback` |

### `.gitignore` additions

```
_site/
node_modules/
.vercel/
```

## Migration Plan

Phased rollout. Each phase is a separate PR, independently deployable, with
a side-by-side visual diff against the live site as the acceptance test.

| # | Phase | What ships | Visible change |
|---|---|---|---|
| 0 | Scaffolding | `package.json`, `.eleventy.js`, `vercel.json`, dir structure, move `styles.css`/`spotlight.js`/`assets/` → `public/`. `src/index.njk`, `src/faculty.njk`, etc. start as **byte-for-byte copies of the existing HTML** with a `.njk` extension — Nunjucks treats unrecognized syntax as literal text, so the files render identically until we start replacing inline content with `{{ }}` expressions. | None. Vercel now builds via Eleventy; output byte-identical. |
| 1 | Layout & global | Extract `<head>` + footer to `_includes/layout.njk`. `content/site.json`. | None. |
| 2 | Hero | `content/hero.json` + `_includes/components/hero.njk`. | None. |
| 3a | Spotlight: research | `content/spotlights/research.json`, project-list slide partial, `spotlight.njk` component. | None. |
| 3b | Spotlight: showcase | `content/spotlights/showcase.json`, all remaining slide variants. | None. |
| 3c | Spotlight: touchpoint | `content/spotlights/touchpoint.json`, touchpoint slide partial. | None. |
| 4 | Launch event | `content/event.json`, `event.njk`. | None. |
| 5 | Faculty page | `content/faculty.json` (49 entries), `faculty.njk`. | None. |
| 6 | Accessibility page | `content/accessibility.md`, `accessibility.njk`. | None. |
| 7 | Admin wired up | GitHub OAuth App created; env vars set; `api/auth/github.js`, `api/auth/github/callback.js`; `/admin/index.html`, `/admin/config.yml`. | `/admin/` URL exists. |
| 8 | Editor handoff | `docs/cms-editor-guide.md`, README updated, visual regression sweep. | None. |

### Acceptance test (every phase)

Side-by-side visual diff: local `npm run dev` vs deployed `main`, checked at:

- Desktop + mobile (the responsive breakpoints exist on `faculty.html` and elsewhere).
- Dark + light theme.
- Small / medium / large `data-zoom`.
- All three spotlight rotations have completed at least one full cycle.

If any pixel differs, the phase isn't done.

## Verification (end-to-end, post-merge)

The CMS is "working" when all of the following pass:

1. **Build sanity**: `npm install && npm run build` produces `_site/` with
   `index.html`, `faculty.html`, `event.html`, `accessibility.html`, and
   their bytes match what the site looked like pre-migration when the JSON
   matches the original content.
2. **Local dev**: `npm run dev` opens at `http://localhost:8080`,
   live-reloads when `content/hero.json` is edited.
3. **OAuth round-trip**: visiting `https://cim-site-3.vercel.app/admin/`,
   clicking "Sign in with GitHub", consenting, and landing back in the
   admin without errors. Token visible in `localStorage` under
   `sveltia-cms.user`.
4. **Edit-to-deploy**: change a hero string in the admin → save → see a
   commit appear on `main` within ~5 seconds → see Vercel deploy succeed
   within ~30 seconds → see the change on the public site.
5. **Schema fidelity**: every variant slide type round-trips
   (load → edit → save → reload) without losing fields.
6. **Permission boundary**: a GitHub user *without* collaborator access on
   `ksu-oor/cim-site-3` who clicks "Sign in with GitHub" gets a clear error
   from Sveltia, not a silent failure or 500.

## Critical Files (paths to know)

| Path | Purpose |
|---|---|
| `.eleventy.js` | Build config |
| `package.json` | Scripts, deps |
| `vercel.json` | Build command, output dir, headers |
| `content/**/*.json` | All editable content (the "database") |
| `_includes/components/spotlight.njk` | Variant dispatch keystone |
| `_includes/slides/*.njk` | One file per slide variant |
| `admin/config.yml` | CMS schema (collections, fields, variant types) |
| `api/auth/github.js` + `api/auth/github/callback.js` | OAuth handshake |
| `public/styles.css` | Existing design system, unchanged |
| `public/spotlight.js` | Existing carousel runtime, unchanged |

## Out of Scope (deliberately)

- Multi-environment content (staging vs production) — single `main` branch is the only environment.
- Editorial workflows (draft / review / publish) — Sveltia supports it but adds complexity; not needed for one editor.
- Image optimization beyond Vercel defaults — pursue only if Lighthouse demands it.
- Search / tagging across faculty — current site has none; add later if needed.
- Internationalization — site is English-only and KSU has no i18n requirement on file.

## Implementation Plan Decomposition

The migration is too large for a single implementation plan file. After
this spec is approved, I'll create separate implementation plans grouped
by safety boundary:

1. **Plan A — Build pipeline** (Phases 0–2): scaffolding + layout + hero. Establishes
   the steel thread end-to-end. Lowest risk, must succeed before anything else.
2. **Plan B — Spotlights** (Phases 3a–3c): the variant-template work.
   Largest single chunk; landing this proves the schema design.
3. **Plan C — Remaining pages** (Phases 4–6): event, faculty, accessibility.
   Mostly mechanical content extraction at this point.
4. **Plan D — Admin wiring** (Phase 7): GitHub OAuth App, env vars, Sveltia
   config, Vercel functions. Independent of content work.
5. **Plan E — Editor handoff** (Phase 8): docs, regression sweep, optional
   scheduled cleanup agent.

Each plan stands alone; each lands a fully-deployed PR before the next begins.

## Open Questions (none currently — surface during implementation)

This section will be appended to as implementation reveals decisions that
need user input. None blocking at design-approval time.
