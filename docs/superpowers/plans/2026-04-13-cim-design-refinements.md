# CIM Design Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refine the CIM landing page with blueprint light mode, updated hero copy, CIM World red accent, interaction polish, and a Nothing Design skill.

**Architecture:** Pure CSS token changes for blueprint mode and CIM World accent. One HTML text change for hero copy. CSS additions for active states and faculty legend. One new skill file. No structural changes.

**Tech Stack:** HTML5, CSS3, vanilla JS

---

### Task 1: Blueprint Light Mode Tokens

**Files:**
- Modify: `styles.css:54-65`

- [ ] **Step 1: Replace light mode token block**

In `styles.css`, replace the `[data-theme="light"]` block (lines 54-65) with:

```css
/* --- BLUEPRINT MODE --- */
[data-theme="light"] {
  --black: #F7F5F0;
  --surface: #FFFDF8;
  --surface-raised: #F0EDE6;
  --border: #D4CFC4;
  --border-visible: #B8B2A6;
  --text-disabled: #A39D94;
  --text-secondary: #7A7468;
  --text-primary: #2C2824;
  --text-display: #1A1714;
  --interactive: #2B5EA7;
}
```

- [ ] **Step 2: Add blueprint grid-line background pattern**

Immediately after the `[data-theme="light"]` block, add:

```css
[data-theme="light"] body {
  background-image:
    repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(180, 170, 155, 0.03) 31px, rgba(180, 170, 155, 0.03) 32px),
    repeating-linear-gradient(90deg, transparent, transparent 31px, rgba(180, 170, 155, 0.03) 31px, rgba(180, 170, 155, 0.03) 32px);
}
```

- [ ] **Step 3: Commit**

```bash
git add styles.css
git commit -m "Replace light mode with warm blueprint variant

Swap cold-white tokens for warm parchment/cream palette.
Add faint engineering-grid background pattern.

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 2: Blueprint Toggle Label

**Files:**
- Modify: `index.html:385-386`

- [ ] **Step 1: Update JS toggle label text**

In `index.html`, find the theme toggle JS (around line 385-386):

```js
      if (saved === 'light') {
        html.setAttribute('data-theme', 'light');
        label.textContent = 'LIGHT';
      }
```

Replace `'LIGHT'` with `'BLUEPRINT'`:

```js
      if (saved === 'light') {
        html.setAttribute('data-theme', 'light');
        label.textContent = 'BLUEPRINT';
      }
```

- [ ] **Step 2: Update the toggle click handler**

Find the click handler (around line 391):

```js
        label.textContent = next.toUpperCase();
```

Replace with:

```js
        label.textContent = next === 'light' ? 'BLUEPRINT' : 'DARK';
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Rename light mode toggle label to BLUEPRINT

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 3: Hero Copy Update

**Files:**
- Modify: `index.html:49`
- Modify: `styles.css:333-343`

- [ ] **Step 1: Replace hero description text**

In `index.html`, find line 49:

```html
      <p class="tile-hero__desc">Where games, simulations, and immersive technology become research tools — advancing healthcare, preserving culture, and modeling the built world.</p>
```

Replace with:

```html
      <p class="tile-hero__desc">49 KSU researchers build games, XR systems, and digital twins.</p>
```

- [ ] **Step 2: Simplify hero desc CSS**

In `styles.css`, find the `.tile-hero__desc` block (lines 333-343):

```css
.tile-hero__desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--body-sm);
  line-height: 1.5;
  color: var(--text-secondary);
  max-width: 36ch;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

Replace with:

```css
.tile-hero__desc {
  font-family: 'Space Grotesk', sans-serif;
  font-size: var(--body-sm);
  line-height: 1.5;
  color: var(--text-secondary);
  max-width: 42ch;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html styles.css
git commit -m "Update hero copy to direct, actor-forward statement

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 4: CIM World Red Accent

**Files:**
- Modify: `styles.css:888-952`

- [ ] **Step 1: Update CIM World tile border**

In `styles.css`, find `.tile-world` (around line 889):

```css
.tile-world {
  grid-area: world;
  position: relative;
  cursor: pointer;
  border-color: var(--border-visible);
  overflow: hidden;
}
```

Replace `border-color: var(--border-visible)` with `border-color: var(--accent)`:

```css
.tile-world {
  grid-area: world;
  position: relative;
  cursor: pointer;
  border-color: var(--accent);
  overflow: hidden;
}
```

- [ ] **Step 2: Update CIM World hover state**

Find `.tile-world:hover` (around line 896):

```css
.tile-world:hover {
  border-color: var(--text-secondary);
  background: var(--surface-raised);
}
```

Replace with:

```css
.tile-world:hover {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
```

- [ ] **Step 3: Update CIM World CTA color**

Find `.tile-world__cta` (around line 936):

```css
  color: var(--interactive);
```

Replace with:

```css
  color: var(--accent);
```

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "Give CIM World tile red accent per .picasso.md intent

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 5: Active States + Partner Pill Fix + Faculty Legend Dots

**Files:**
- Modify: `styles.css` (tile active states, partner pills, faculty legend)
- Modify: `index.html` (faculty legend markup)

- [ ] **Step 1: Add active press state to clickable tiles**

In `styles.css`, after the `.tile:hover` rule (line 281), add:

```css
a.tile:active,
.tile[onclick]:active {
  transform: scale(0.995);
  transition: transform 100ms cubic-bezier(0.25, 0.1, 0.25, 1);
}
```

- [ ] **Step 2: Remove partner pill hover states**

In `styles.css`, find `.partners-list span:hover` (around line 983):

```css
.partners-list span:hover {
  color: var(--text-primary);
  border-color: var(--text-secondary);
}
```

Delete this entire rule block. Also remove the `transition` properties from `.partners-list span` (around line 979-980):

```css
  transition: color 200ms cubic-bezier(0.25, 0.1, 0.25, 1),
              border-color 200ms cubic-bezier(0.25, 0.1, 0.25, 1);
```

- [ ] **Step 3: Add faculty legend colored dots**

In `styles.css`, find `.tile-faculty__legend` (around line 853). After that block, add:

```css
.tile-faculty__legend span {
  display: flex;
  align-items: center;
  gap: 3px;
}

.tile-faculty__legend span::before {
  content: '';
  display: inline-block;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tile-faculty__legend span:nth-child(1)::before { background: var(--text-primary); }
.tile-faculty__legend span:nth-child(2)::before { background: var(--text-secondary); }
.tile-faculty__legend span:nth-child(3)::before { background: var(--text-disabled); }
.tile-faculty__legend span:nth-child(4)::before { background: var(--border-visible); }
.tile-faculty__legend span:nth-child(5)::before { background: var(--border); }
```

- [ ] **Step 4: Commit**

```bash
git add styles.css
git commit -m "Add mechanical active states, fix partner pills, add faculty legend dots

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 6: Nothing Design Interaction Skill

**Files:**
- Create: `.claude/skills/nothing-design/nothing-design.md`

- [ ] **Step 1: Create the skill directory**

```bash
mkdir -p .claude/skills/nothing-design
```

- [ ] **Step 2: Write the skill file**

Create `.claude/skills/nothing-design/nothing-design.md` with:

```markdown
---
name: nothing-design
description: Interaction and styling rules for the CIM Nothing Design System. Use when modifying the CIM landing page or adding new tiles/components.
---

# Nothing Design System — Interaction Rules

The CIM site uses a "Nothing Instrument Panel" aesthetic. All interactions feel like precision mechanical switches, not organic fluid motion.

## Easing

All transitions use one curve: `cubic-bezier(0.25, 0.1, 0.25, 1)`.

No other easing function is permitted. No `ease`, `ease-in-out`, `linear`, or spring/bounce functions.

## Duration Scale

| Category | Duration | Examples |
|---|---|---|
| Micro | 150ms | Color changes, opacity, border-color |
| State | 200ms | Hover backgrounds, focus rings, toggle knobs |
| Layout | 300ms | Expand/collapse, tile resize |

Nothing over 300ms. If an animation needs to be longer, the interaction design is wrong.

## Hover

- Border becomes more visible: `border-color: var(--border-visible)`
- Clickable tiles with destinations may tint background: `var(--surface-raised)` or `var(--accent-subtle)` for red-accented tiles
- Arrow icons translate 4px right: `transform: translateX(4px)`
- Text links shift from secondary to display color

## Active / Press

All clickable tiles (`<a>` tiles) get: `transform: scale(0.995)` with `transition: transform 100ms`.

This creates a subtle mechanical "click" without any bounce-back.

## Focus

All interactive elements get: `outline: 2px solid var(--interactive); outline-offset: 2px`.

Never remove focus outlines. Never use `outline: none` without a replacement.

## Rejected Patterns

These are banned. They break the instrument panel metaphor:

- `translateY` on hover (floating/lifting)
- `box-shadow` changes on hover (depth shifts)
- `bounce`, `elastic`, or spring easing
- Entrance/scroll-triggered animations
- Hover states on non-interactive elements
- `opacity` changes below 0.8 on hover (too dramatic)
- `transition: all` (always specify properties)

## Color Accents

- One accent: Nothing Red `#D71921` / `var(--accent)`
- Used on: Event tile border, CIM World tile border, CTAs on those tiles
- Everything else: monochrome hierarchy via `--text-display` through `--border`
- Interactive blue `var(--interactive)` for links and non-red CTAs only

## Typography in Interactions

- Labels use Space Mono, ALL CAPS, letter-spacing 0.06em+
- Display numbers in Doto are static. Never animate type size or weight.
- Arrow symbols (`→`) are the only animated text element (translateX on hover)

## Adding New Tiles

1. Use the `.tile` base class
2. Add a `.tile-label` as the first child (Space Mono, 10px, uppercase)
3. Choose: is this tile a link? If yes, use `<a class="tile tile-[name]">`. If no, use `<section>`.
4. Non-interactive elements must not have hover states
5. Follow the grid area naming convention in `.bento-grid`

## Future Interaction Work

Documented for later implementation:
- Keyboard tile navigation (arrow keys map to grid positions)
- Faculty bar segment hover tooltips
- Tile expand/collapse refinements for blueprint mode
```

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/nothing-design/nothing-design.md
git commit -m "Add Nothing Design interaction skill for CIM design system

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 7: Update .picasso.md

**Files:**
- Modify: `.picasso.md`

- [ ] **Step 1: Update the light mode section**

In `.picasso.md`, find the "Color Tokens (Light Mode)" section and replace it with:

```markdown
## Color Tokens (Blueprint Mode)
- Background: #F7F5F0 (warm parchment)
- Surface: #FFFDF8 (cream)
- Surface Raised: #F0EDE6 (light kraft)
- Border: #D4CFC4 / #B8B2A6 (warm stone)
- Text: #1A1714 (display) / #2C2824 (primary) / #7A7468 (secondary) / #A39D94 (disabled)
- Interactive: #2B5EA7 (blueprint blue)
- Faint 32px engineering grid overlay at 0.03 opacity
```

- [ ] **Step 2: Update the Identity section**

In the "Identity" section, after the line about CIM World tile, add:

```markdown
- Toggle labeled "DARK" / "BLUEPRINT" (not "LIGHT")
```

- [ ] **Step 3: Commit**

```bash
git add .picasso.md
git commit -m "Update .picasso.md to reflect blueprint mode and toggle label

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>"
```

---

### Task 8: Visual Verification

- [ ] **Step 1: Open the page locally and screenshot dark mode at 1440x900**

Verify: OLED black bento grid, CIM World tile has red border matching Event tile, hero copy reads "49 KSU researchers build games, XR systems, and digital twins." with no truncation, faculty legend has colored dots.

- [ ] **Step 2: Toggle to blueprint mode and screenshot**

Verify: Warm parchment background, cream tile surfaces, faint grid lines visible, red accents still pop against warm paper, toggle label says "BLUEPRINT".

- [ ] **Step 3: Resize to 375px width and screenshot mobile dark mode**

Verify: Single column layout, no clipping, all tiles readable.

- [ ] **Step 4: Click a tile (Event or CIM World) and verify active state**

Verify: Subtle scale(0.995) press feel, no bounce, immediate response.

- [ ] **Step 5: Hover partner pills**

Verify: No hover state change (static badges).
