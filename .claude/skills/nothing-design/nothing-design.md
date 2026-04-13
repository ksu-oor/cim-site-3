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
