# shadcn/ui Migration Plan

Migrate EPL Predictions App from custom Tailwind CSS to shadcn/ui component library with orange color palette and mobile-first layout optimizations.

## Context

| Property | Value |
|---|---|
| Framework | Next.js, React 19, App Router |
| Styling | Tailwind CSS v4 (PostCSS, no config file) |
| Language | JavaScript (no TypeScript) |
| Path alias | `@/*` → `./src/*` |
| Package manager | npm |
| Current accent | `#00c851` green |
| Target accent | Orange (shadcn palette, preset `b3bZE3MnoW`) |
| Primary target | Mobile screens (~390px viewport) |

---

## Execution Order

```
Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6 → Phase 7
Setup      Utils     MatchCard  Modals    WeekSel   Features   Polish
```

---

## Phase 1 — Setup & Foundation

### 1.1 Init shadcn/ui + Apply Preset

The preset `b3bZE3MnoW` was built at https://ui.shadcn.com/create and encodes the orange color palette, base color, radius, and font choices.

Option A — single command (combines init + preset):
```bash
npx shadcn@latest init --preset b3bZE3MnoW
```

Option B — two steps (inspect before applying theme):
```bash
# Sets up components.json, installs core deps, wires globals.css
npx shadcn@latest init

# Stamps orange theme, fonts, radius from the create.shadcn preset
npx shadcn@latest apply --preset b3bZE3MnoW
```

To re-apply just the color tokens later without touching installed components:
```bash
npx shadcn@latest apply --preset b3bZE3MnoW --only theme
```

To inspect the preset before applying:
```bash
npx shadcn@latest preset decode b3bZE3MnoW
```

### 1.2 Add App-Specific Semantic Tokens

After `apply` writes orange tokens to `globals.css`, manually add these tokens for prediction feedback states (not in the preset — app-specific semantic colors):

```css
/* globals.css — under :root */
--prediction-correct: oklch(0.723 0.219 149.579);  /* green-500 — correct prediction */
--prediction-wrong: oklch(0.628 0.258 29.234);     /* red — incorrect prediction */
```

Map these to Tailwind via `@theme inline`:
```css
@theme inline {
  --color-prediction-correct: var(--prediction-correct);
  --color-prediction-wrong: var(--prediction-wrong);
}
```

Orange = brand/primary/CTAs. Green = correct prediction feedback only. Red = incorrect/destructive only.

### 1.3 Install All Required Components

```bash
npx shadcn@latest add \
  button card badge dialog drawer sheet \
  input label scroll-area separator skeleton \
  spinner alert tabs toggle-group table \
  sonner empty avatar alert-dialog
```

---

## Phase 2 — Utility Components (Quick Wins)

Low-risk, drop-in replacements. No logic changes.

| Current File | Replace With | Notes |
|---|---|---|
| `LoadingSpinner.js` | `Spinner` | Wrap shadcn `<Spinner>` in same centered container |
| `EmptyState.js` | `Empty` | Use shadcn `<Empty>` with existing "No matches available" copy |
| `ErrorDisplay.js` | `Alert` (destructive) + `Button` | Remove custom card div; use `<Alert variant="destructive">` with retry `<Button>` |
| Status badges in `MatchdayHeader.js` | `Badge` | "Completed" → `outline`, "Current" → `default` (orange), "Upcoming" → `secondary` |

---

## Phase 3 — MatchCard (Highest Visual Impact)

`MatchCard.js` is the core UI. Every user interaction goes through it.

### Component Replacements

| Element | Replace With |
|---|---|
| `.match-card` CSS class | `Card` + `CardContent` |
| Status indicator (live/finished) | `Badge` |
| Score increment/decrement buttons | `Button` (variant=ghost, size=sm) |
| Loading null renders | `Skeleton` |
| Result feedback banner | Colored dot `Badge` (not full-width banner) |

### Mobile Layout Changes

- Team row: logo (32px) + truncated name + score input — all inline, single row
- Remove VS spacer for upcoming matches; use compact `—` divider
- Prediction result (correct/wrong) shown as small colored `Badge`, not full-width colored banner
- All tap targets minimum 44px height
- `Skeleton` placeholders shown while match data loads (eliminates layout shift)

---

## Phase 4 — Modals → Drawers (Mobile-First)

Current modals use custom fixed-position overlays. Replace all with bottom-sheet patterns for native mobile feel.

| Current Component | Replace With | Reason |
|---|---|---|
| `ScoreModal.js` | `Drawer` (bottom sheet) | Swipe to dismiss, full-width score grid on mobile |
| `SignInModal.js` | `Drawer` (bottom sheet) | Full-width email input + passkey button |
| `HowToPlayModal.js` | `Sheet` | Scrollable rules content, side or bottom |
| `QRCodeModal.js` | `Sheet` | Compact QR + share card |
| League delete confirmation | `AlertDialog` | Explicit confirm/cancel for destructive action |

`Dialog` reserved for desktop-width breakpoints if needed later.

---

## Phase 5 — WeekSelector (Mobile Navigation)

Replace the current horizontal scrollable button row with shadcn primitives.

### Implementation

- `ScrollArea` (horizontal, no visible scrollbar) wrapping `ToggleGroup` (single selection)
- Current matchweek auto-scrolled into center view on mount via `scrollIntoView`
- Past MDs: `secondary` toggle variant (muted/dim)
- Current MD: `default` variant (orange primary highlight)
- Completed MDs: `outline` variant with subtle checkmark indicator

### Behavior

```
[ MD1 ][ MD2 ][ MD3 ][ ◉ MD4 ][ MD5 ][ MD6 ] →
                       ^ auto-centered, orange
```

---

## Phase 6 — Feature Components

### LeagueLeaderboard.js
- `Table` for rank/name/points rows
- `Badge` for rank medals: gold (`yellow-400`), silver (`zinc-300`), bronze (`orange-400`)
- `Avatar` for user initials (fallback when no profile image)

### LeagueManager.js
- `Input` + `Label` for create/join form fields
- `Button` variants: `default` for create/join, `destructive` for delete
- `AlertDialog` for league delete confirmation (replaces custom confirm modal)

### SyncStatusIndicator.js
- `Alert` (warning variant) for persistent offline/pending sync banner
- `Sonner` toasts for sync success/failure events (transient feedback)
- `Button` (outline, size=sm) for "Force Sync" action

### PredictionStats.js
- `Card` shell with stats inside
- `Badge` for correct prediction count

### Account Page (`/account`)
- `Card` layout sections (profile, security, danger zone)
- `Input` + `Label` for display name editor
- `Button` variants: `default` for save, `outline` for passkey register, `destructive` for sign out

### Admin Page (`/admin`)
- `Table` for user list
- `Button` (ghost, size=sm) for prediction edit/delete actions

### Header.js
- Keep structure; apply `Button` (ghost) for "How to play" trigger
- Use semantic token colors (`text-foreground`, `text-muted-foreground`)

### BottomNavigation.js
- Keep fixed-position structure
- Replace raw div/span nav items with `Button` (ghost, size=sm)
- Active tab: `--primary` orange background (replaces green `#113620a6` tint)
- Add `pb-safe` (safe-area-inset-bottom) padding for iPhone home bar

---

## Phase 7 — Mobile Layout Polish

Final pass after all component swaps are done.

### Layout Constraints
- Wrap all page content in `max-w-md mx-auto` — app designed for ~390px, centers gracefully on tablets/desktop
- `ScrollArea` on match list — inertial scroll, hidden scrollbars

### Spacing
- Match list: `gap-2` between cards (down from `gap-4`)
- Date group headers: remove if same-day grouping adds no value; keep only for multi-day matchweeks
- Card padding: `p-3` (compact) vs current `p-4`

### Typography
- Team name: `text-sm font-semibold`
- Score display: `text-lg font-bold`
- Match time: `text-xs text-muted-foreground`

### Safe Areas (iOS)
- `BottomNavigation`: add `pb-[env(safe-area-inset-bottom)]`
- Page content: `mb-[calc(4rem+env(safe-area-inset-bottom))]` to clear fixed nav

### Matchweek Focus
- Current matchweek expanded/prominent at top on load
- Other matchweeks accessible via `WeekSelector` but not pre-rendered
- `MatchdayHeader` badge for current week styled with orange primary

---

## Component → shadcn Mapping Reference

| Current | shadcn Component(s) |
|---|---|
| Custom buttons | `Button` |
| `.match-card` div | `Card`, `CardContent` |
| Custom modals | `Drawer`, `Sheet`, `AlertDialog` |
| Inline status text | `Badge` |
| Loading spinner | `Spinner` |
| Empty states | `Empty` |
| Error cards | `Alert` |
| Horizontal scroll tabs | `ScrollArea` + `ToggleGroup` |
| Custom table rows | `Table` |
| Form fields | `Input`, `Label` |
| Toast feedback | `Sonner` |
| User avatars | `Avatar` |
| Skeleton loaders | `Skeleton` |

---

## Color Strategy

| Role | Color | Token |
|---|---|---|
| Primary CTA / brand / active states | Orange-500 | `--primary` |
| Correct prediction feedback | Green-500 | `--prediction-correct` |
| Incorrect prediction feedback | Red | `--prediction-wrong` |
| Destructive actions | Red | `--destructive` |
| Surfaces / cards | Dark gray | `--card` |
| Borders | Subtle gray | `--border` |
| Muted text | Gray | `--muted-foreground` |

Orange does not replace green for correct predictions — green retains semantic meaning (traffic light logic). Orange is exclusively the brand/interaction color.

---

## Files Modified

```
src/app/globals.css                    — theme tokens (preset apply + custom tokens)
src/app/components/LoadingSpinner.js   — Phase 2
src/app/components/EmptyState.js       — Phase 2
src/app/components/ErrorDisplay.js     — Phase 2
src/app/components/MatchdayHeader.js   — Phase 2 (Badge)
src/app/components/MatchCard.js        — Phase 3
src/app/components/ScoreModal.js       — Phase 4
src/app/components/SignInModal.js      — Phase 4
src/app/components/HowToPlayModal.js   — Phase 4
src/app/components/QRCodeModal.js      — Phase 4
src/app/components/WeekSelector.js     — Phase 5
src/app/components/LeagueLeaderboard.js — Phase 6
src/app/components/LeagueManager.js   — Phase 6
src/app/components/SyncStatusIndicator.js — Phase 6
src/app/components/PredictionStats.js — Phase 6
src/app/components/Header.js           — Phase 6
src/app/components/BottomNavigation.js — Phase 6 + 7
src/app/account/page.js                — Phase 6
src/app/admin/page.js                  — Phase 6
src/app/layout.js                      — Phase 7 (Sonner provider)
```

New directory created by shadcn CLI:
```
src/components/ui/                     — all shadcn component files
```
