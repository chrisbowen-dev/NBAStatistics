# NBA Statistics App — Design System

This document defines the visual design principles for the NBA Statistics app. Any agent building or modifying pages should follow these guidelines to maintain a consistent look and feel across the application.

---

## 1. Foundation

**Dark theme only.** The app uses a near-black background (`#0a0a0a`) throughout. There is no light mode.

**Typography.** Inter, falling back to `system-ui`. Tabs for indentation (4 spaces wide). All components follow PascalCase folder structure: `ComponentName/ComponentName.tsx`, `.css`, `.test.tsx`.

**Color palette.**

| Role | Value | Usage |
|---|---|---|
| Page background | `#0a0a0a` | Body, page shell |
| Card background | `rgba(4–14, 4–14, 18–20, 0.75–0.78)` | All glass cards |
| Surface border (neutral) | `rgba(255,255,255,0.08–0.1)` | Cards with no team context |
| Text primary | `rgba(255,255,255,0.88–0.93)` | Names, values, headings |
| Text secondary | `rgba(255,255,255,0.62–0.65)` | Table data, body text |
| Text muted | `rgba(255,255,255,0.25–0.38)` | Labels, metadata, captions |
| Text ultra-muted | `rgba(255,255,255,0.18–0.22)` | Column headers, GB stats |

---

## 2. Team colors

Every page that shows a specific team (PlayerDetail, TeamDetail) is driven by that team's primary and secondary colors from `TEAM_COLORS` in `src/utils/teamColors.ts`.

### Injecting team colors

Always inject colors as CSS variables on the outermost page wrapper:

```tsx
const colors = getTeamColors(teamAbbreviation);

<div
  className="page-root"
  style={{
    '--team-primary': colors.primary,
    '--team-secondary': colors.secondary,
  } as React.CSSProperties}
>
```

Use a `hexToRgb` helper to use colors at variable opacity in inline styles:

```ts
function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}
```

### Color roles

| Element | Color used |
|---|---|
| Card / table borders | Secondary color |
| Card inner gradient bleed (top-left) | Primary color, ~5–7% opacity |
| Hero background gradient | Primary color, ~14–18% opacity |
| Hero top border line | Secondary color, fading left to right |
| Icon pill (odd cards) | Primary color background |
| Icon pill (even cards) | Secondary color background |
| Team abbreviation text | Secondary color |
| Conference seed badge | Secondary color |
| Table row separators | Secondary color, ~8–12% opacity |
| Table hover | Secondary color, ~3–4% opacity |
| Team name hyperlink | Primary color |
| Team abbreviation hyperlink | Primary color |

### Pages with no team context (Players list, Teams standings)

Use neutral white borders and no team color anywhere:
- Border: `rgba(255,255,255,0.1)`
- Gradient: `rgba(255,255,255,0.025)`
- Row separators: `rgba(255,255,255,0.05)`
- Hover: `rgba(255,255,255,0.03)`

---

## 3. Glassmorphism cards

All cards and tables share the same glass treatment.

```css
.card {
  position: relative;
  background: rgba(4, 12, 20, 0.75);   /* tinted slightly toward team primary */
  border: 1px solid /* secondary color at 28–35% opacity, or neutral 10% */;
  border-radius: 10px;
  overflow: hidden;
}

.card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 10px;
  background: linear-gradient(150deg, /* primary at 5–7% */ 0%, transparent 55%);
  pointer-events: none;
}
```

**Never** use a solid opaque background on cards. The near-black page background must show through.

---

## 4. Hero sections (PlayerDetail, TeamDetail)

Every detail page has a hero band at the top with three visual elements driven by team colors:

1. **Top border line** — 2px, secondary color fading left to right (`linear-gradient(90deg, secondary@70%, secondary@8%, transparent)`)
2. **Background gradient** — primary color bleeding in from top-left (`linear-gradient(135deg, primary@18%, transparent@60%)`)
3. **Avatar/logo border** — secondary color at ~25% opacity

Meta rows follow this order:
- Row 1: Abbreviation (secondary color) · City · Est. year
- Row 2: Conference · Division
- Row 3: Conference seed badge (secondary color pill) — only on TeamDetail

---

## 5. Stat cards

Stat cards appear in grids of 3 columns. Each card has:
- An **icon pill** in the top-left — alternates between primary (odd) and secondary (even) color backgrounds
- A **large value** (`font-size: 24–26px`, `font-weight: 700`)
- A **label** and **sublabel**
- The same glass card treatment as all other cards

**Icon set** — use Lucide React icons consistently:

| Stat | Icon |
|---|---|
| Points Per Game | `basketball` from `@lucide/lab` |
| Rebounds Per Game | `ArrowUpFromLine` |
| Assists Per Game | `Share2` |
| Steals Per Game | `Zap` |
| Blocks Per Game | `ShieldBan` |
| Stocks (STL+BLK) | `ShieldBan` |
| Minutes Per Game | `Timer` |
| Field Goal % | `Crosshair` |
| 3-Point % | `Target` |
| Free Throw % | `Medal` |
| W-L Record | `Trophy` |
| Win % | `Activity` |
| PPG (team) | `basketball` from `@lucide/lab` |
| RPG (team) | `ArrowUpFromLine` |
| APG (team) | `Share2` |

---

## 6. Tables

All tables are custom `<table>` elements — **no MUI DataGrid**.

### Visual treatment
- Card wrapper uses the same glassmorphism card style
- Card title has a bottom border using secondary color at ~18% opacity
- Column headers: `10px`, uppercase, `letter-spacing: 0.07em`, muted white
- Header bottom border: secondary color at ~15% opacity
- Row separators: secondary color at ~8% opacity
- Row hover: secondary color at ~3% opacity

### Sort indicators
- **No sort UI** on inactive columns — plain text only
- **Active sorted column** — label gets a white underline (`border-bottom: 1px solid rgba(255,255,255,0.45)`) plus a small `▼` or `▲` arrow (`font-size: 8px`)
- Column headers are clickable `<th>` elements, not `<button>` elements inside `<th>`

### Player/team name links
- Wherever a team name or abbreviation appears, it is a React Router `<Link>` to `/teams/:teamId`
- Wherever a player name appears in a table, it is a `<Link>` to `/players/:playerId`
- Link color: primary color at ~85% opacity
- Link underline: `border-bottom: 1px solid` primary color at ~30% opacity
- Hover: primary color at 100% opacity, border brightens to ~60%

### Pagination
- **No page numbers, no rows-per-page selector**
- Use a "Load more" button at the bottom of the table
- Show a count below the button: `Showing X of Y players` or `All X players loaded`

---

## 7. Navigation — Navbar

The navbar is not modified per team. It uses the existing Lucide icons (`Home`, `Users`, `Users2`). No team colors bleed into the navbar.

The browser favicon is `basketball.svg` (the Lucide basketball icon) in black/white with `prefers-color-scheme` auto-switching.

---

## 8. Hyperlinks

**Team names** are always links to `/teams/:teamId` — in hero meta rows, info cards, table cells, and career stat rows.

**Player names** are always links to `/players/:playerId` — in roster tables and any player listing.

Link style pattern (consistent across all pages):
```css
.team-link {
  color: /* primary at 85% */;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid /* primary at 30% */;
  transition: color 0.15s, border-color 0.15s;
}
.team-link:hover {
  color: /* primary at 100% */;
  border-bottom-color: /* primary at 60% */;
}
```

---

## 9. Position abbreviations

Player positions are always shown as single-letter abbreviations in tables:

| Full | Abbr |
|---|---|
| Guard | G |
| Forward | F |
| Center | C |

---

## 10. Pages with no team context

The **Players** list page has a sidebar filter panel that is toggleable (show/hide via a Filters button in the toolbar). When hidden, the table expands to full width.

The **Teams** page shows East/West conference standings side by side. Each team row uses that team's primary color as a left border accent and a very faint row background tint — but all text stays neutral white. Section dividers (Play-In, Eliminated) use the same neutral treatment as card headers.

---

## 11. Things we explicitly avoid

- **No MUI DataGrid** — replaced with custom `<table>` elements everywhere
- **No MUI Typography, Box, CircularProgress** — replaced with plain HTML elements and a custom CSS spinner
- **No colored text** — team colors appear in borders, backgrounds, icons, and links only; body text and stat values stay neutral white
- **No pagination** — replaced with "Load more" pattern
- **No search bars on pages where all data is always visible** (Teams page)
- **No button chrome on sort headers** — plain clickable `<th>` only
- **No hardcoded season strings** — derive dynamically from API or current date
