# Poultry Platform — internal design brief

## Direction

The product should feel like a dependable Nigerian farm market and training
desk: useful, direct and warm. Visual references come from poultry pens, feed
sacks, stacked egg trays, hatchery grids, weighing marks, market labels and
hand-painted practical farm signage. Avoid glassmorphism, neon gradients,
floating AI orbs and generic blue-purple startup styling.

## Foundations

### Named palette

| Name | Token | Value | Use |
| --- | --- | --- | --- |
| Palm Leaf | `palm` | `#176B45` | Primary actions, trust and navigation |
| Coop Charcoal | `coop` | `#20251F` | Headlines, dark surfaces and strong borders |
| Yolk Gold | `yolk` | `#F2B544` | Highlights, ratings and active market labels |
| Eggshell | `eggshell` | `#FFF8E8` | Main warm canvas and elevated pale surfaces |
| Feed Sack | `sack` | `#B86B3D` | Secondary accents, category cues and alerts |

### Typography

- Display: **Bitter**, a sturdy slab serif with the character of printed market
  labels and agricultural manuals.
- Body: **Public Sans**, a highly legible service typeface for forms, prices,
  tables and mobile reading.
- Scale: 12, 14, 16, 18, 24, 32, 44 and 60px. Body copy is 16px/1.6; compact
  labels are 12–14px; page titles use 32–44px; only campaign hero copy reaches
  60px.

### Space, shape and depth

- Use a 4px base spacing unit. Common gaps are 8, 12, 16, 24, 32, 48 and 64px.
- Keep dense controls at 40–44px tall and primary touch targets at least 44px.
- Radii: 8px for controls and labels, 14px for cards, 22px for major panels;
  use pills only for statuses and compact filters.
- Shadows should resemble stacked paper or crates: short, low-blur and slightly
  warm. Standard cards use `0 2px 0 rgba(32,37,31,.08), 0 10px 28px
  rgba(32,37,31,.07)`. Interactive cards may lift by 2px, never glow.

## Signature motif: the hatchery ledger

Use a restrained grid of rounded egg-tray cells crossed by small weighing ticks.
It can appear behind hero copy, in section dividers and on empty states. The grid
must remain low contrast so content stays dominant. Pair it with small uppercase
market-label captions, solid rule lines and occasional stamped Yolk Gold markers.

## Photography and icons

Photography must show real birds, eggs, feed, equipment and farm work. Prefer
daylight, honest textures and useful context over glossy lifestyle staging.
Crop imagery to practical catalogue ratios: 16:10 for hero media, 4:3 for
categories and square for products. Icons should be simple 1.75px line icons,
always accompanied by labels when their meaning is not universal.

## Interaction principles

- Product search and categories lead the public experience.
- Prices, availability and status must scan quickly on small screens.
- Focus rings use Palm Leaf with a visible Eggshell offset.
- Destructive actions use explicit text and confirmation, not color alone.
- Loading, empty and error states should explain the next practical action.
