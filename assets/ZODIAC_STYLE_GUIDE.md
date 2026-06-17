# Zodiac Mascot Style Guide

## Required Style

- Premium Japanese character-goods illustration.
- Refined children's picture-book quality.
- Cute, finely detailed, warm, and sophisticated.
- Large glossy eyes with subtle highlights.
- Soft rounded cheeks and readable facial expression.
- Natural anatomy and a clear, believable pose.
- Clean soft linework with subtle hand-painted gouache texture.
- Transparent PNG or WebP with crisp, clean edges.
- Consistent character proportions, lighting, rendering, and color quality across all zodiac animals.

## Forbidden

- Geometric mascots.
- Simple SVG illustrations.
- Emoji or icon substitutes.
- Flat low-detail clip art.
- Malformed, duplicated, or unreadable limbs.
- Using the wrong zodiac animal as a fallback.
- Text, logos, watermarks, cast shadows, or opaque backgrounds.

## Zodiac Mapping

The dashboard calculates the zodiac from the displayed year.

- 2024: dragon
- 2025: snake
- 2026: horse
- 2027: goat

The full cycle is:

```text
rat / ox / tiger / rabbit / dragon / snake /
horse / goat / monkey / rooster / dog / pig
```

## Asset Naming

```text
<zodiac>-<scene>-v<version>.png
```

Examples:

```text
horse-run-v2.png
horse-wrap-v2.png
dragon-new-year-v1.png
dragon-boat-v1.png
goat-autumn-v1.png
```

## Generation Prompt Baseline

```text
Create an exceptionally polished, finely detailed, irresistibly cute chibi
<zodiac animal> mascot for a calendar dashboard.

Use premium Japanese character-goods illustration and refined children's
picture-book quality. Use clean soft linework, subtle hand-painted gouache
texture, large glossy eyes, rounded cheeks, correct anatomy, and a clear
expressive pose.

Keep the character design, proportions, rendering quality, lighting, and
palette consistent with the existing DongDong zodiac mascot collection.

Output as an isolated full-body character with generous padding. No text,
logo, watermark, scenery, cast shadow, malformed limbs, geometry, SVG style,
emoji style, or low-detail clip art.
```

Generate on a removable chroma-key background, convert it to a transparent
PNG locally, verify the alpha channel, and optimize the final file before
publishing.
