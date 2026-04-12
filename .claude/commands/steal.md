Run the Picasso /steal command -- extract design DNA from a URL or Figma file.

Use the Picasso agent to extract the design language from the provided source: $ARGUMENTS

## Steps

1. Screenshot the URL at desktop (1440x900) and mobile (375x812)
2. Fetch the page source and extract: font-family declarations, color values (#hex, rgb, oklch), border-radius values, box-shadow values
3. Analyze the screenshots visually for: layout structure, spacing rhythm, typography hierarchy, color palette, animation style
4. Generate a `.picasso.md` config that matches the extracted aesthetic
5. Optionally generate a `DESIGN.md` with the full token set

If a Figma URL is provided, run /figma first to extract design tokens, then proceed with those as ground truth.

If no URL is provided, ask the user for one.
