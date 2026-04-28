# CIM CMS — Plan A: Build Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the static `cim-site-3` repo into an Eleventy-built site that produces visually-identical output to the current hand-authored HTML, then extract the shared layout (`<head>` + footer) and the hero tile into JSON-driven templates. Set up Vercel to build via Eleventy.

**Architecture:** Eleventy v3 with Nunjucks templates. Static assets (`styles.css`, `spotlight.js`, `accessibility.css`, `assets/`) move into `public/` and are passthrough-copied to the build output root, so all relative URLs in existing HTML and CSS keep working without rewrites. Pages start as byte-identical `.njk` copies of the current HTML; we then progressively replace inline content with `{{ }}` expressions that pull from `content/*.json`. This is the "steel thread" approach: prove the build works end-to-end before changing any visible output.

**Tech Stack:** Node ≥ 18, `@11ty/eleventy@^3.0.0` (only dev dep), Vercel for hosting, Nunjucks template engine.

**Spec:** [`docs/superpowers/specs/2026-04-28-cms-sveltia-eleventy-design.md`](../specs/2026-04-28-cms-sveltia-eleventy-design.md)

**Phases covered:** 0 (Scaffolding), 1 (Layout & global), 2 (Hero). Phases 3+ are out of scope for this plan; see Plans B–E.

---

## File Structure (after this plan)

```
cim-site-3/
├── package.json                    # NEW — eleventy dev dep, build/dev scripts
├── package-lock.json               # NEW — lockfile
├── .eleventy.js                    # NEW — Eleventy config (~12 lines)
├── vercel.json                     # NEW — build command, output dir, headers
├── .gitignore                      # MODIFIED — add _site/, node_modules/, .vercel/
├── content/                        # NEW
│   ├── site.json                   # global: institution, footer copy + clusters, contact email
│   └── hero.json                   # hero tile copy (label, title, subtitle, desc, CTA)
├── _includes/                      # NEW
│   ├── layout.njk                  # shared <head>, theme-script, footer, body wrapper
│   └── components/
│       └── hero.njk                # hero tile partial
├── src/                            # NEW — Eleventy input
│   ├── index.njk                   # was index.html (byte-identical at first; later uses layout + hero)
│   ├── faculty.njk                 # was faculty.html (byte-identical; uses layout)
│   ├── event.njk                   # was event.html (byte-identical; uses layout)
│   └── accessibility.njk           # was accessibility.html (byte-identical; uses layout)
├── public/                         # NEW — passthrough-copied to /_site root
│   ├── styles.css                  # MOVED from repo root
│   ├── accessibility.css           # MOVED from repo root
│   ├── spotlight.js                # MOVED from repo root
│   └── assets/                     # MOVED from repo root
│       └── partners/*.svg, *.png   # 18 partner logo files
└── _site/                          # NEW (gitignored) — Eleventy output, what Vercel serves

REMOVED (moved into public/):
  styles.css, accessibility.css, spotlight.js, assets/

UNCHANGED at repo root:
  .gitkeep, .picasso.md, docs/, .context/, .claude/
```

**Boundaries:**
- `public/` is the only directory whose contents are served verbatim. CSS, JS, and partner SVGs live here so they don't accidentally pick up Nunjucks rendering.
- `src/` holds page templates. One template = one rendered HTML file at the corresponding URL.
- `_includes/` holds partials and layouts. Anything `src/` files reference via `{% extends %}` or `{% include %}` lives here.
- `content/` holds JSON data files. Eleventy auto-loads each as a top-level template variable named after the filename (`content/hero.json` → `{{ hero }}`).

---

## Verification Strategy

The site has no test framework. We use **build sanity + HTML/visual diff** as our verification. Three checks:

1. **Build sanity** — `npm run build` exits 0 and `_site/` contains the expected files.
2. **Byte/whitespace comparison** — `diff -B -w _site/index.html index.html.baseline` (after stripping trailing whitespace differences). Exit 0 = no semantic HTML drift.
3. **Visual smoke check** — open both files in a browser via the Chrome MCP and verify they render identically.

We capture a baseline copy of the original HTML *before* moving any files, so we can keep diffing against it through the migration.

**Commit cadence:** one commit per task group (typically 3–5 tasks per commit), aligned with phase boundaries from the spec. The commit messages match the spec's phase numbering.

---

## Phase 0 — Scaffolding

### Task 1: Capture baselines of the existing HTML

**Files:**
- Create: `.context/baselines/index.html`, `.context/baselines/faculty.html`, `.context/baselines/event.html`, `.context/baselines/accessibility.html`

`.context/` is gitignored — these baselines are scratch artifacts for verification, not source files.

- [ ] **Step 1:** Create the baselines directory and copy current HTML.

```bash
mkdir -p .context/baselines
cp index.html faculty.html event.html accessibility.html .context/baselines/
```

- [ ] **Step 2:** Verify baseline copies match originals.

```bash
diff -q index.html .context/baselines/index.html
diff -q faculty.html .context/baselines/faculty.html
diff -q event.html .context/baselines/event.html
diff -q accessibility.html .context/baselines/accessibility.html
```

Expected: no output (files identical).

---

### Task 2: Create `package.json` and install Eleventy

**Files:**
- Create: `package.json`
- Create: `package-lock.json` (auto-generated by npm)
- Create: `node_modules/` (auto-generated; will be gitignored)

- [ ] **Step 1:** Write `package.json`.

```json
{
  "name": "cim-site-3",
  "version": "1.0.0",
  "description": "CIM — Center for Interactive Media at Kennesaw State University",
  "private": true,
  "scripts": {
    "dev": "eleventy --serve --quiet",
    "build": "eleventy"
  },
  "devDependencies": {
    "@11ty/eleventy": "^3.0.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

- [ ] **Step 2:** Install Eleventy.

```bash
npm install
```

Expected: `node_modules/` populated, `package-lock.json` created, no errors. Eleventy version printed during install.

- [ ] **Step 3:** Verify Eleventy CLI is callable.

```bash
npx eleventy --version
```

Expected: prints a version starting with `3.` (e.g., `3.0.0`).

---

### Task 3: Update `.gitignore`

**Files:**
- Modify: `.gitignore` (currently does not exist at repo root — confirm with `ls -la`; if absent, create it)

- [ ] **Step 1:** Check current `.gitignore` state.

```bash
ls -la .gitignore 2>/dev/null && cat .gitignore || echo "no .gitignore yet"
```

- [ ] **Step 2:** Create or append the required ignores.

If `.gitignore` does not exist, create it with this content. If it exists, append any of these lines that aren't already present.

```
# Build output
_site/

# Dependencies
node_modules/

# Vercel
.vercel/

# OS / editor
.DS_Store
```

- [ ] **Step 3:** Verify the ignores are recognized.

```bash
git check-ignore -v _site/foo node_modules/bar .vercel/baz
```

Expected: each line printed as ignored (referring back to `.gitignore`).

---

### Task 4: Create the directory skeleton

**Files:**
- Create: `public/`, `src/`, `_includes/`, `_includes/components/`, `content/`

- [ ] **Step 1:** Create the directories.

```bash
mkdir -p public _includes/components content src
```

- [ ] **Step 2:** Verify structure.

```bash
ls -d public _includes _includes/components content src
```

Expected: all five paths printed.

---

### Task 5: Move static assets into `public/`

**Files:**
- Move: `styles.css` → `public/styles.css`
- Move: `accessibility.css` → `public/accessibility.css`
- Move: `spotlight.js` → `public/spotlight.js`
- Move: `assets/` → `public/assets/`

These files contain no template syntax and should never be processed by Eleventy. Putting them in `public/` is what tells Eleventy to passthrough-copy them.

- [ ] **Step 1:** Move files using `git mv` so history is preserved.

```bash
git mv styles.css public/styles.css
git mv accessibility.css public/accessibility.css
git mv spotlight.js public/spotlight.js
git mv assets public/assets
```

- [ ] **Step 2:** Verify the new locations.

```bash
ls public/
ls public/assets/partners/ | head -5
```

Expected: `public/` contains `styles.css`, `accessibility.css`, `spotlight.js`, `assets/`. `public/assets/partners/` contains the 18 SVG/PNG logo files.

- [ ] **Step 3:** Verify the old paths are empty.

```bash
ls styles.css spotlight.js accessibility.css assets 2>&1 | head -5
```

Expected: each line says "No such file or directory."

---

### Task 6: Copy HTML pages to `src/*.njk` byte-identically

**Files:**
- Create: `src/index.njk` (from `index.html`)
- Create: `src/faculty.njk` (from `faculty.html`)
- Create: `src/event.njk` (from `event.html`)
- Create: `src/accessibility.njk` (from `accessibility.html`)

We're moving the existing HTML into Eleventy's input directory with a `.njk` extension. Nunjucks treats unrecognized syntax as literal text, so the output should be byte-identical until we start adding `{{ }}` expressions.

- [ ] **Step 1:** Move HTML files using `git mv`.

```bash
git mv index.html src/index.njk
git mv faculty.html src/faculty.njk
git mv event.html src/event.njk
git mv accessibility.html src/accessibility.njk
```

- [ ] **Step 2:** Verify the moves.

```bash
ls src/
```

Expected: `index.njk faculty.njk event.njk accessibility.njk`.

- [ ] **Step 3:** Verify content survived intact (sample).

```bash
diff src/index.njk .context/baselines/index.html
```

Expected: no output (files identical).

---

### Task 7: Create `.eleventy.js` config

**Files:**
- Create: `.eleventy.js`

- [ ] **Step 1:** Write the Eleventy config.

```js
module.exports = (eleventy) => {
  eleventy.addPassthroughCopy({ "public": "/" });

  eleventy.addShortcode("year", () => new Date().getFullYear());

  return {
    dir: {
      input: "src",
      includes: "../_includes",
      data: "../content",
      output: "_site",
    },
    templateFormats: ["njk", "html", "md"],
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
  };
};
```

- [ ] **Step 2:** Verify Eleventy can load the config.

```bash
npx eleventy --dry-run
```

Expected: Eleventy reports it would process the four `.njk` files in `src/` and copy `public/` contents. No errors. Should mention "Wrote 0 files" because of `--dry-run`.

---

### Task 8: Run the first real build and inspect output

**Files:**
- Create (auto): `_site/index.html`, `_site/faculty.html`, `_site/event.html`, `_site/accessibility.html`, `_site/styles.css`, `_site/spotlight.js`, `_site/accessibility.css`, `_site/assets/...`

- [ ] **Step 1:** Run the build.

```bash
npm run build
```

Expected:
- Exit code 0.
- Console reports "Wrote 4 files" (the four pages) + "Copied X file(s)" for the public passthrough.

- [ ] **Step 2:** Verify all expected output files exist.

```bash
ls _site/
ls _site/assets/partners/ | wc -l
```

Expected: `_site/` contains `index.html`, `faculty.html`, `event.html`, `accessibility.html`, `styles.css`, `accessibility.css`, `spotlight.js`, `assets/`. `assets/partners/` contains 18 files.

- [ ] **Step 3:** Diff each page against its baseline.

```bash
diff -B -w _site/index.html .context/baselines/index.html
diff -B -w _site/faculty.html .context/baselines/faculty.html
diff -B -w _site/event.html .context/baselines/event.html
diff -B -w _site/accessibility.html .context/baselines/accessibility.html
```

Expected: no output for any file (semantically identical, modulo whitespace differences which `-B -w` ignores).

If any file shows differences:
- Inspect the diff. Eleventy may strip a trailing newline or normalize line endings on Windows. If the diff is *only* trailing-whitespace or a final newline, it's acceptable for byte-identity-modulo-whitespace. Document any acceptable drift in a brief comment in `.eleventy.js`.
- If the diff includes any visible content drift (an attribute reordered, a tag changed), STOP. Do not commit until investigated.

---

### Task 9: Create `vercel.json`

**Files:**
- Create: `vercel.json`

- [ ] **Step 1:** Write the Vercel config.

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "_site",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/admin/:path*",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Cache-Control", "value": "no-store" }
      ]
    }
  ]
}
```

The `/admin/` headers will only matter once Plan D wires up the admin. Setting them now means we don't have to remember later.

- [ ] **Step 2:** Validate the JSON.

```bash
node -e "JSON.parse(require('fs').readFileSync('vercel.json'))" && echo "valid"
```

Expected: prints `valid`.

---

### Task 10: Local dev-server smoke test

- [ ] **Step 1:** Start the dev server in the background.

```bash
npm run dev &
DEV_PID=$!
sleep 3
```

- [ ] **Step 2:** Curl each page.

```bash
curl -s -o /dev/null -w "%{http_code} index.html\n" http://localhost:8080/
curl -s -o /dev/null -w "%{http_code} faculty.html\n" http://localhost:8080/faculty.html
curl -s -o /dev/null -w "%{http_code} event.html\n" http://localhost:8080/event.html
curl -s -o /dev/null -w "%{http_code} accessibility.html\n" http://localhost:8080/accessibility.html
curl -s -o /dev/null -w "%{http_code} styles.css\n" http://localhost:8080/styles.css
curl -s -o /dev/null -w "%{http_code} spotlight.js\n" http://localhost:8080/spotlight.js
curl -s -o /dev/null -w "%{http_code} aws logo\n" http://localhost:8080/assets/partners/aws--on-dark.svg
```

Expected: every line prints `200 <name>`.

- [ ] **Step 3:** Kill the dev server.

```bash
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

---

### Task 11: Commit Phase 0

- [ ] **Step 1:** Stage the changes.

```bash
git add package.json package-lock.json .eleventy.js vercel.json .gitignore
git add public/ src/ content/ _includes/
git status
```

Expected: `git status` shows the `git mv` renames (styles.css → public/styles.css, etc.), the four .html → src/.njk renames, plus new files (package.json, lockfile, .eleventy.js, vercel.json, updated .gitignore, new directories).

- [ ] **Step 2:** Commit.

```bash
git commit -m "$(cat <<'EOF'
Phase 0: Scaffold Eleventy build pipeline

Convert hand-authored static HTML into Eleventy-built site producing
byte-identical output. Move CSS/JS/assets to public/ for passthrough copy;
move HTML pages to src/*.njk; configure .eleventy.js and vercel.json.
No visible site changes — output diff against baselines is empty modulo
whitespace.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

Expected: commit succeeds with the message above.

---

## Phase 1 — Extract Layout & Global Data

### Task 12: Capture the shared `<head>` and footer regions

We need to identify what's *common* to all four pages. Read them carefully:

- `src/index.njk` and `src/faculty.njk` and `src/event.njk` all share a similar `<head>` (charset, viewport, fonts, title, theme-script).
- All pages share the footer copy mark, but `event.html` and `faculty.html` may not have a footer at all (they're standalone pages with their own bottom UI).
- The theme-toggle script + button is shared between `index.html` and the others.

The right scope for the layout is: `<head>` block (preconnects, fonts, title, meta, theme script, link to styles.css) + the `<body>` + skip-link + page-toolbar (theme toggle), then a `{% block main %}` slot for page-specific content, then a closing `</body></html>`. Footer is page-specific because it varies (or doesn't exist on some pages).

**Files:**
- Create: `_includes/layout.njk`

- [ ] **Step 1:** Read the current `<head>` regions.

```bash
head -25 src/index.njk
echo "---"
head -25 src/faculty.njk
echo "---"
head -25 src/event.njk
echo "---"
head -25 src/accessibility.njk
```

- [ ] **Step 2:** Identify the meta-tag superset across pages. The layout must include all *common* meta tags. Page-specific tags (e.g., per-page `<title>` and `<meta name="description">`) become block parameters.

The layout takes these inputs:
- `title` — page title text
- `description` — meta description
- `dataAttributes` — any `<html>` data attributes (e.g., `data-zoom="medium"` on faculty)
- `extraHead` — block for page-specific extra `<head>` content (e.g., `accessibility.css` link, inline `<style>` blocks)
- `main` — block for `<main>` content

- [ ] **Step 3:** Write `_includes/layout.njk`.

```njk
<!DOCTYPE html>
<html lang="en" dir="ltr" data-theme="dark"{% if zoom %} data-zoom="{{ zoom }}"{% endif %}>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">

  <!-- Google Fonts: Doto (display), Space Grotesk (body), Space Mono (labels/data) -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Doto:wght@400;700&family=Space+Grotesk:wght@300;400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="/styles.css">
  {% block extraHead %}{% endblock %}
  <script>
    // Prevent FOUC: apply saved theme + zoom before first paint
    (function(){
      var t=localStorage.getItem('cim-theme');if(t)document.documentElement.setAttribute('data-theme',t);
      {% if zoom %}var z=localStorage.getItem('cim-zoom')||'{{ zoom }}';document.documentElement.setAttribute('data-zoom',z);{% endif %}
    })();
  </script>
</head>
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>

  {% block toolbar %}
  <div class="page-toolbar" role="toolbar" aria-label="Display settings">
    <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark and light mode" title="Toggle theme">
      <span class="theme-toggle__track">
        <span class="theme-toggle__knob"></span>
      </span>
      <span class="theme-toggle__label" aria-hidden="true">DARK</span>
    </button>
  </div>
  {% endblock %}

  {% block main %}{% endblock %}

  {% block footer %}{% endblock %}

  {% block scripts %}{% endblock %}
</body>
</html>
```

**Important:** This layout is the union of features across the four pages. Some pages don't use the toolbar (faculty has its own back-arrow), some don't use the footer, some have inline `<style>` (faculty, event, accessibility). Each page can override or skip blocks via `{% block name %}{% endblock %}`.

---

### Task 13: Create `content/site.json`

**Files:**
- Create: `content/site.json`

- [ ] **Step 1:** Read the current footer markup to extract the values.

```bash
grep -A 5 'site-footer' src/index.njk | head -15
```

This shows: cluster pills, accessibility link, copyright. Extract values verbatim.

- [ ] **Step 2:** Write `content/site.json`.

```json
{
  "siteName": "CIM",
  "fullName": "Center for Interactive Media",
  "institution": "KENNESAW STATE UNIVERSITY · OFFICE OF RESEARCH",
  "contactEmail": "cim@kennesaw.edu",
  "footerClusters": [
    "GAME STUDIO",
    "DIGITAL TWIN",
    "XR & HEALTHCARE",
    "IMMERSIVE ED",
    "DIGITAL HUMANITIES"
  ],
  "footerCopy": "© 2026 Center for Interactive Media, Kennesaw State University"
}
```

- [ ] **Step 3:** Validate the JSON.

```bash
node -e "JSON.parse(require('fs').readFileSync('content/site.json'))" && echo "valid"
```

Expected: prints `valid`.

- [ ] **Step 4:** Verify Eleventy picks it up as data.

```bash
npx eleventy --dry-run --quiet 2>&1 | head -20
```

Expected: no errors. (Eleventy doesn't print data discovery during build, but absence of errors confirms parse success.)

---

### Task 14: Create the footer partial

**Files:**
- Create: `_includes/components/footer.njk`

- [ ] **Step 1:** Locate the current footer in `src/index.njk`.

```bash
grep -n 'site-footer' src/index.njk
```

- [ ] **Step 2:** Write `_includes/components/footer.njk`.

```njk
<footer class="site-footer">
  <div class="footer-inner">
    <span class="footer-clusters">{{ site.footerClusters | join(" · ") }}</span>
    <span class="footer-links">
      <a href="/accessibility.html">ACCESSIBILITY</a>
    </span>
    <span class="footer-copy">&copy; {% year %} {{ site.fullName }}, Kennesaw State University</span>
  </div>
</footer>
```

The `{% year %}` shortcode (defined in `.eleventy.js`) outputs the current year — this de-couples the copyright from a hardcoded date. The cluster names and full name come from `content/site.json`.

**Footnote on the copyright change:** The current footer hardcodes `© 2026`. Switching to `{% year %}` means the year auto-updates each January. If the user wants to lock the year (some institutions prefer "© 2026" for the year of last substantive update), revert the `{% year %}` to `2026` and add a comment.

- [ ] **Step 3:** Verify the year shortcode runs.

```bash
npx eleventy --dry-run 2>&1 | grep -i error
```

Expected: no output (no errors).

---

### Task 15: Refactor `src/index.njk` to use the layout

This is the most involved task in Phase 1 because `index.html` is the longest file (~550 lines). We're replacing the `<!DOCTYPE>`, `<head>`, `<body>` opening, skip-link, toolbar, and closing `</body></html>` with `{% extends %}` + a `{% block main %}` containing only the `<main>` body, plus a `{% block footer %}` that includes the footer partial, plus a `{% block scripts %}` for the `spotlight.js` reference.

**Files:**
- Modify: `src/index.njk`

- [ ] **Step 1:** Read the current content boundaries in `src/index.njk`.

```bash
grep -n '^<!DOCTYPE\|<head>\|</head>\|<body>\|<main\|</main>\|<footer\|</footer>\|<script src=\|</body>' src/index.njk
```

Note the line numbers: where `<main>` starts, where `</main>` ends, where the footer is, where `<script src="spotlight.js">` is.

- [ ] **Step 2:** Replace the file with a layout-extending version. The structure is:

```njk
{% extends "layout.njk" %}

{% set title = "CIM — Center for Interactive Media · Kennesaw State University" %}
{% set description = "Kennesaw State University's Center for Interactive Media — Game Studio, Digital Twin, XR Healthcare, Immersive Education, and Digital Humanities research." %}

{% block main %}
  <main id="main-content" class="bento-grid">

    <!-- … the entire <main> contents from the original index.html, lines ~36 to ~505, paste verbatim … -->

  </main>
{% endblock %}

{% block footer %}
  {% include "components/footer.njk" %}
{% endblock %}

{% block scripts %}
  <script src="/spotlight.js" defer></script>
{% endblock %}
```

**Concrete instructions:**
1. Copy the *current* `src/index.njk` to `.context/index.njk.before` for safekeeping.
2. Replace the file contents with the structure above.
3. For the `{% block main %}` body: copy lines 36–505 (the entire `<main class="bento-grid">…</main>` block) from `.context/index.njk.before` verbatim.
4. The footer (lines ~507–516 in the original) is replaced by `{% include "components/footer.njk" %}`.
5. The `<script src="spotlight.js" defer></script>` line is moved into the `scripts` block. Path becomes `/spotlight.js` (absolute) so it works regardless of nesting.

```bash
cp src/index.njk .context/index.njk.before
```

Then edit `src/index.njk` per the structure above. Use the Read tool to grab the exact `<main>` content from `.context/index.njk.before`.

- [ ] **Step 3:** Run the build and diff against baseline.

```bash
npm run build
diff -B -w _site/index.html .context/baselines/index.html
```

Expected: the diff is small and *only* shows the year change (footer copy now uses `{% year %}` → "© 2026" remains "© 2026" since current year is 2026, but on 2027-01-01 it will become "© 2027"). If the diff is empty or only differs in `\n` placement, you're good.

If the diff shows missing `<main>` content, attribute reordering, or any other drift, return to Step 2 and verify the `<main>` block was copied verbatim.

---

### Task 16: Refactor the other three pages to use the layout

**Files:**
- Modify: `src/faculty.njk`, `src/event.njk`, `src/accessibility.njk`

These pages each have a `<style>` block in `<head>` (page-specific CSS). Use the `{% block extraHead %}` slot for that, plus an explicit override of `{% block toolbar %}` if the page has a different toolbar (faculty does — it has zoom controls; that stays page-specific for now).

For each page, the steps are the same:

- [ ] **Step 1: faculty.njk** — Save baseline, then refactor.

```bash
cp src/faculty.njk .context/faculty.njk.before
```

Refactor `src/faculty.njk`:
- Compute `title`, `description`, `zoom` (faculty uses `data-zoom="medium"` on `<html>`).
- The `<style>` block in the original `<head>` goes into `{% block extraHead %}`.
- The custom `<head>` script that handles theme + zoom can be removed — `layout.njk` handles it via the `zoom` parameter.
- The toolbar (zoom + theme) is page-specific; override `{% block toolbar %}` with the original markup (don't deduplicate yet — that's a later refactor).
- The page body goes into `{% block main %}`.
- No footer on faculty page; omit the `footer` block (defaults to empty).
- Faculty has an inline `<script>` at the end; put it in `{% block scripts %}`.

```njk
{% extends "layout.njk" %}

{% set title = "Faculty Network — CIM · Kennesaw State University" %}
{% set description = "49 affiliated faculty across 7+ colleges driving interdisciplinary research in interactive media at Kennesaw State University." %}
{% set zoom = "medium" %}

{% block extraHead %}
<style>
  /* … entire <style> block from original faculty.html, paste verbatim … */
</style>
{% endblock %}

{% block toolbar %}
  <!-- … the original page-toolbar markup from faculty.html (zoom + theme), paste verbatim … -->
{% endblock %}

{% block main %}
  <!-- … the entire <body> contents below the toolbar from faculty.html, paste verbatim … -->
{% endblock %}

{% block scripts %}
  <!-- … the inline <script> block from the bottom of faculty.html, paste verbatim … -->
{% endblock %}
```

- [ ] **Step 2: event.njk** — Repeat the pattern.

```bash
cp src/event.njk .context/event.njk.before
```

Same approach; event has its own `<style>` block and ends with the footer (use `{% block footer %}{% include "components/footer.njk" %}{% endblock %}` if so).

- [ ] **Step 3: accessibility.njk** — Repeat. This page additionally references `accessibility.css`:

```njk
{% block extraHead %}
<link rel="stylesheet" href="/accessibility.css">
{% endblock %}
```

Plus footer.

- [ ] **Step 4: Build and diff every page.**

```bash
npm run build
for page in index faculty event accessibility; do
  echo "=== ${page}.html ==="
  diff -B -w "_site/${page}.html" ".context/baselines/${page}.html" | head -30
done
```

Expected: each page produces only the year-change diff (or no diff). Any other drift means content was moved incorrectly — investigate before proceeding.

---

### Task 17: Local visual smoke test

- [ ] **Step 1:** Start dev server.

```bash
npm run dev &
DEV_PID=$!
sleep 3
```

- [ ] **Step 2:** Use the Chrome MCP to load each page and visually verify.

For each of `/`, `/faculty.html`, `/event.html`, `/accessibility.html`:
- Open via `mcp__claude-in-chrome__tabs_create_mcp` then `mcp__claude-in-chrome__navigate` (or use the playwright MCP).
- Take a screenshot.
- Compare to the baseline (open `.context/baselines/index.html` directly via `file://` and screenshot).
- Look for: header/title rendered, hero present, all three carousels visible (research/showcase/touchpoint), partner logos load, fonts load.

If anything looks broken (e.g., logos missing, fonts not loading, layout shifted), the most likely cause is a relative-vs-absolute URL change. Inspect the `<link>` and `<script>` tag URLs in the rendered HTML:

```bash
curl -s http://localhost:8080/ | grep -E '(href|src)=' | head -20
```

Expected: relative URLs that worked before (e.g., `href="/styles.css"`) still work.

- [ ] **Step 3:** Kill the dev server.

```bash
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

---

### Task 18: Commit Phase 1

- [ ] **Step 1:** Stage and commit.

```bash
git add _includes/ content/site.json src/
git status
git commit -m "$(cat <<'EOF'
Phase 1: Extract shared layout and global content

Move <head>, theme-init script, body wrapper, and footer markup into
_includes/layout.njk. Extract footer cluster names + copyright into
content/site.json. Refactor index/faculty/event/accessibility to extend
the layout. Output remains visually identical to the pre-migration
baseline.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase 2 — Hero Component & Data

### Task 19: Create `content/hero.json`

**Files:**
- Create: `content/hero.json`

- [ ] **Step 1:** Read current hero markup to extract values.

```bash
grep -A 10 'tile-hero' .context/baselines/index.html | head -15
```

The hero on line 39–45 of the baseline contains: label, title (`CIM`), subtitle, description, CTA text, CTA href.

- [ ] **Step 2:** Write `content/hero.json`.

```json
{
  "label": "KENNESAW STATE UNIVERSITY · OFFICE OF RESEARCH",
  "title": "CIM",
  "subtitle": "Center for Interactive Media",
  "description": "49 KSU researchers build games, XR systems, and digital twins.",
  "ctaText": "START A CONVERSATION",
  "ctaHref": "mailto:cim@kennesaw.edu"
}
```

- [ ] **Step 3:** Validate JSON.

```bash
node -e "JSON.parse(require('fs').readFileSync('content/hero.json'))" && echo "valid"
```

Expected: prints `valid`.

---

### Task 20: Create the hero partial

**Files:**
- Create: `_includes/components/hero.njk`

- [ ] **Step 1:** Write the partial. Match the original markup exactly (preserves CSS class hooks).

```njk
<section class="tile tile-hero" aria-label="CIM Hero">
  <div class="tile-hero__label">{{ hero.label }}</div>
  <h1 class="tile-hero__title">{{ hero.title }}</h1>
  <p class="tile-hero__subtitle">{{ hero.subtitle }}</p>
  <p class="tile-hero__desc">{{ hero.description }}</p>
  <a href="{{ hero.ctaHref }}" class="btn-primary tile-hero__cta">{{ hero.ctaText }}</a>
</section>
```

---

### Task 21: Update `src/index.njk` to use the hero partial

**Files:**
- Modify: `src/index.njk`

- [ ] **Step 1:** Replace the inline hero `<section>` with an include.

In `src/index.njk`, find the `<section class="tile tile-hero" aria-label="CIM Hero">` block (5 lines + closing tag, about lines 39–45 of the original). Replace with:

```njk
{% include "components/hero.njk" %}
```

- [ ] **Step 2:** Build and diff.

```bash
npm run build
diff -B -w _site/index.html .context/baselines/index.html | head -20
```

Expected: only the year-change diff (and potentially small whitespace differences from the include). The hero markup should match the baseline.

If there's drift in the hero region:
- Check that `content/hero.json` strings match the baseline exactly (case, punctuation, special characters like `·`).
- Check that the partial markup matches the original element-by-element.

---

### Task 22: Visual verification

- [ ] **Step 1:** Build and serve.

```bash
npm run build
npm run dev &
DEV_PID=$!
sleep 3
```

- [ ] **Step 2:** Load index page and visually inspect the hero tile.

Use the Chrome MCP to navigate to `http://localhost:8080/` and screenshot the hero. Compare to the baseline file URL screenshot. The hero text should be identical pixel-for-pixel.

- [ ] **Step 3:** Edit `content/hero.json` to test the live data binding (smoke test).

```bash
node -e "
const fs = require('fs');
const h = JSON.parse(fs.readFileSync('content/hero.json'));
h.title = 'CIM-TEST';
fs.writeFileSync('content/hero.json', JSON.stringify(h, null, 2));
"
sleep 2
curl -s http://localhost:8080/ | grep 'tile-hero__title'
```

Expected: the curl output shows `<h1 class="tile-hero__title">CIM-TEST</h1>`. (The dev server's live-reload picks up the JSON change.)

- [ ] **Step 4:** Revert the test change.

```bash
node -e "
const fs = require('fs');
const h = JSON.parse(fs.readFileSync('content/hero.json'));
h.title = 'CIM';
fs.writeFileSync('content/hero.json', JSON.stringify(h, null, 2));
"
sleep 2
curl -s http://localhost:8080/ | grep 'tile-hero__title'
```

Expected: shows `<h1 class="tile-hero__title">CIM</h1>` again.

- [ ] **Step 5:** Kill dev server.

```bash
kill $DEV_PID 2>/dev/null
wait $DEV_PID 2>/dev/null
```

---

### Task 23: Commit Phase 2

- [ ] **Step 1:** Stage and commit.

```bash
git add content/hero.json _includes/components/hero.njk src/index.njk
git status
git commit -m "$(cat <<'EOF'
Phase 2: Extract hero tile to JSON-driven partial

Move hero tile copy (label, title, subtitle, description, CTA) into
content/hero.json. Extract markup into _includes/components/hero.njk.
Replace inline hero section in src/index.njk with {% include %}.
Output identical to baseline.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Final — Push Branch and Verify Vercel Preview

### Task 24: Push branch

- [ ] **Step 1:** Push the branch.

```bash
git push -u origin ngoldbla/cms-design
```

Expected: branch pushed; Vercel webhook fires; preview deployment starts within ~10 seconds.

- [ ] **Step 2:** Verify the push succeeded.

```bash
git log --oneline origin/ngoldbla/cms-design 2>/dev/null | head -5
```

Expected: shows the latest local commits.

---

### Task 25: Verify the Vercel preview deployment

- [ ] **Step 1:** Wait for the preview build, then list deployments.

Use the `mcp__claude_ai_Vercel__list_deployments` MCP tool with the project name to find the latest preview URL. (If the user has not yet linked Vercel to the repo, this is a STOP — flag to the user that Vercel link is needed before we can verify previews.)

- [ ] **Step 2:** If the deployment URL is available, visit each page on the preview.

```bash
PREVIEW=https://<preview-url>.vercel.app   # filled from MCP output
for page in / faculty.html event.html accessibility.html; do
  echo "=== ${page} ==="
  curl -s -o /dev/null -w "%{http_code}\n" "${PREVIEW}${page}"
done
```

Expected: every page returns 200.

- [ ] **Step 3:** Visually compare preview pages to local dev.

Open the preview in Chrome MCP, screenshot, compare to `.context/baselines/`. Should be visually identical.

---

### Task 26: Open the PR

- [ ] **Step 1:** Use `gh pr create` to open the PR.

```bash
gh pr create --base main --head ngoldbla/cms-design \
  --title "CMS Plan A: scaffold Eleventy build pipeline" \
  --body "$(cat <<'EOF'
## Summary

Implements Phases 0–2 of the CMS migration spec
(`docs/superpowers/specs/2026-04-28-cms-sveltia-eleventy-design.md`):

- **Phase 0 — Scaffolding:** Eleventy v3 build pipeline; static assets moved to `public/`; pages moved to `src/*.njk`.
- **Phase 1 — Layout:** shared `<head>`, theme-init, footer, body wrapper extracted to `_includes/layout.njk`. Global content (footer clusters, copyright) in `content/site.json`.
- **Phase 2 — Hero:** hero tile copy in `content/hero.json`; markup in `_includes/components/hero.njk`.

## Visible site changes

None. Output is byte-identical to the pre-migration site modulo the auto-updating year in the footer copyright (currently still "© 2026").

## Test plan

- [ ] `npm install && npm run build` succeeds locally.
- [ ] Vercel preview deployment renders all four pages identically to the production site.
- [ ] `diff -B -w _site/<page>.html .context/baselines/<page>.html` is empty (or whitespace-only) for every page.
- [ ] Manually verify hero data binding by editing `content/hero.json` in dev mode and confirming the page reflects the change.

## Next plans

- **Plan B:** Spotlights (3 carousels, 8 slide variants).
- **Plan C:** Remaining pages (event, faculty, accessibility content).
- **Plan D:** Sveltia admin + GitHub OAuth wiring.
- **Plan E:** Editor handoff.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL is returned and printed.

- [ ] **Step 2:** Print the PR URL for the user.

---

## Self-Review

**Spec coverage check:**
- Phase 0 (scaffolding) → Tasks 1–11 ✓
- Phase 1 (layout & global) → Tasks 12–18 ✓
- Phase 2 (hero) → Tasks 19–23 ✓
- Migration acceptance test (visual diff vs baseline) → embedded in every phase's diff/curl steps ✓
- Vercel preview verification → Tasks 24–25 ✓
- PR opened → Task 26 ✓

**Placeholder scan:** No "TBD", no "implement later", no naked code shapes without bodies. The few `<!-- … paste verbatim … -->` markers in Tasks 15–16 are intentional pointers to specific saved baselines (`.context/<page>.njk.before`), and the surrounding instructions explain exactly which lines to copy. The `--quiet` flag on `eleventy --serve` is a deliberate choice (suppresses noisy "Wrote N files" logs but keeps errors visible).

**Type / naming consistency:**
- `content/site.json` field names (`siteName`, `fullName`, `institution`, `contactEmail`, `footerClusters`, `footerCopy`) match across `content/site.json` (Task 13) and `_includes/components/footer.njk` (Task 14). ✓
- `content/hero.json` field names (`label`, `title`, `subtitle`, `description`, `ctaText`, `ctaHref`) match across `content/hero.json` (Task 19) and `_includes/components/hero.njk` (Task 20). ✓
- The `zoom` layout parameter (Task 12) is read in `_includes/layout.njk` and set in faculty.njk (Task 16). ✓

**Scope check:** Plan covers exactly the spec's Phases 0–2; Phases 3+ are explicitly deferred to Plans B–E. Single coherent unit. ✓

**Ambiguity:** The decision to use `{% year %}` shortcode versus hardcoded `2026` in the footer is flagged in Task 14 with a footnote; default is the shortcode but trivially reversible.

Plan is ready for execution.
