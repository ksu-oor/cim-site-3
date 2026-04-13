# CIM Landing Page Design Refinements

## Summary

Three targeted fixes from the Picasso design critique, plus a Nothing Design interaction skill to guide future work.

## Changes

### 1. Blueprint Light Mode

Replace the current flat-white light mode with a warm engineering-blueprint variant.

**Token changes in `[data-theme="light"]`:**

| Token | Current | New |
|---|---|---|
| `--black` | `#F5F5F5` | `#F7F5F0` |
| `--surface` | `#FFFFFF` | `#FFFDF8` |
| `--surface-raised` | (inherits) | `#F0EDE6` |
| `--border` | `#E8E8E8` | `#D4CFC4` |
| `--border-visible` | `#CCCCCC` | `#B8B2A6` |
| `--text-display` | `#000000` | `#1A1714` |
| `--text-primary` | `#1A1A1A` | `#2C2824` |
| `--text-secondary` | `#666666` | `#7A7468` |
| `--text-disabled` | `#999999` | `#A39D94` |
| `--interactive` | `#007AFF` | `#2B5EA7` |

**Additional CSS for blueprint mode:**
- Add a faint grid-line pattern on `[data-theme="light"] body` using `repeating-linear-gradient` at `opacity: 0.03` to evoke engineering paper.
- Change toggle label text from "LIGHT" to "BLUEPRINT" in JS.

**No structural/layout changes.** Same bento grid, same components.

### 2. Hero Copy

Replace the hero description in `index.html`:

**Old:** `Where games, simulations, and immersive technology become research tools — advancing healthcare, preserving culture, and modeling the built world.`

**New:** `49 KSU researchers build games, XR systems, and digital twins.`

Also bump `.tile-hero__desc` `max-width` from `36ch` to `42ch` for breathing room. Remove `-webkit-line-clamp: 3` and related truncation properties since the new copy is a single sentence that fits comfortably.

### 3. CIM World Red Accent

Align the CIM World tile with the `.picasso.md` design intent.

**CSS changes:**
- `.tile-world` `border-color`: `var(--border-visible)` to `var(--accent)`
- `.tile-world:hover` `background`: `var(--surface-raised)` to `var(--accent-subtle)`
- `.tile-world:hover` `border-color`: `var(--text-secondary)` to `var(--accent)`
- `.tile-world__cta` `color`: `var(--interactive)` to `var(--accent)`

This creates two red-accented tiles (Event + CIM World) as the visual anchors.

### 4. Nothing Design Interaction Skill

Create `.claude/skills/nothing-design/nothing-design.md` codifying the interaction language.

**Contents:**
- **Easing:** `cubic-bezier(0.25, 0.1, 0.25, 1)` for all transitions (already used consistently).
- **Durations:** 150ms for color/opacity micro-transitions, 200ms for state changes (hover, focus), 300ms for layout changes (expand/collapse).
- **Active states:** Add `transform: scale(0.995)` on `:active` for all clickable tiles to create a mechanical "press" feel.
- **Rejected patterns:** No `translateY` lifts, no `shadow` changes on hover, no bounce/elastic easing, no entrance animations.
- **Partner pill fix:** Remove hover states from `.partners-list span` since they aren't links.
- **Faculty legend fix:** Add tiny colored indicator dots before each legend label to map segments to colleges.

## Files Modified

| File | Change |
|---|---|
| `styles.css` | Blueprint tokens, hero max-width, CIM World accent, active states, partner pill hover removal, faculty legend dots |
| `index.html` | Hero copy, toggle label |
| `.claude/skills/nothing-design/nothing-design.md` | New file |
| `.picasso.md` | Update to reflect blueprint mode replaces "light mode" |

## Out of Scope

- Keyboard tile navigation (future work, documented in the skill)
- Faculty bar tooltips (future work, documented in the skill)
- Removing light mode entirely (user chose blueprint variant)
