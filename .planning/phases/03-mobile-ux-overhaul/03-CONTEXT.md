# Phase 3: Mobile UX Overhaul - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Rebuild the mobile layout so coaches can build and adjust lineups on a phone as comfortably as on desktop. Roster moves above the field as a horizontal chip strip, formation/half controls and action buttons move below the field, touch targets get sized for thumb use. The desktop layout remains pixel-for-pixel identical — all changes are behind the existing `isMobile` breakpoint (max-width: 767px).

</domain>

<decisions>
## Implementation Decisions

### Roster placement (above field)
- Horizontal scrollable chip strip above the pitch, replacing the current bottom drawer as the primary bench
- Shows only unassigned (available) players — assigned players disappear from the strip
- Each chip shows: jersey number + first name (e.g., "7 Alex") — matches current bench bar pattern
- When all players are assigned, strip shows "All players assigned" message — strip area stays visible (no layout shift)
- When no player is selected, show a subtle hint like "Drag a player to a position" in the strip area
- Chip strip is a drag source AND drag target — players can be dragged from strip to field and from field back to strip
- Mobile roster drawer is removed ONLY AFTER the Roster management button (in action row) is wired up — never leave mobile without roster management access

### Touch drag-and-drop (CRITICAL)
- Drag-and-drop MUST work on mobile via touch events (touchstart/touchmove/touchend)
- HTML5 drag API does not work on touch screens — implement custom touch drag handling
- All existing drag interactions must work on mobile: chip-to-field (assign), field-to-chip-strip (remove to bench), field-to-field (swap), chip-to-occupied-field (swap)
- During touch drag, show a visual ghost/clone of the dragged element following the finger
- Drop targets highlight when a dragged element is over them (same orange glow as desktop)
- Touch drag must not conflict with page scrolling — use a drag handle, long-press to initiate, or prevent scroll only during active drag

### Mobile header
- Minimal header on mobile — logo + "Lineup Planner" title only
- All interactive controls (formation, half toggle, action buttons) move below the field
- Desktop header remains unchanged

### Controls below field (stacked rows)
- Row 1: Formation selector buttons (3-3-2, 4-3-1, etc.) — full-width row
- Row 2: Half toggle (1ST HALF / 2ND HALF) — full-width row
- Row 3: Action buttons — Save, Load, Print, Share, Roster — icons + short labels
- "Roster" button in action row opens roster management (add/edit/remove players, mark inactive) — replaces the drawer's management function

### Bench bar on mobile
- Completely removed on mobile — the chip strip above the field IS the bench
- Desktop bench bar remains exactly as-is (PRES-01)
- No layout shift when strip empties — "All players assigned" placeholder maintains height

### Touch targets & spacing
- Field position circles: 50px on mobile (same as desktop, no more compact mode shrinkage)
- Minimum tap target: 44px for all buttons, player chips, and interactive elements (Apple HIG standard)
- Current mobile chips (~24px tall) nearly double in size
- Selected chip state: same orange highlight as desktop (C.orange) — consistent visual language

### Inactive players on mobile
- Not shown in chip strip — they can't be assigned
- Visible only in roster management view (accessed via Roster button in action row)

### Claude's Discretion
- Exact chip strip padding, gap, and scroll behavior
- How roster management view opens (full-screen modal vs slide-in)
- Transition animations for layout changes
- How the stacked control rows distribute vertical space
- Pitch maxWidth adjustment if needed (currently capped at 360px mobile)
- Whether formation buttons scroll horizontally or wrap

</decisions>

<specifics>
## Specific Ideas

- The overall mobile flow should be: header (minimal) → chip strip (bench) → pitch → formation → half toggle → action buttons — a clean top-to-bottom flow
- Drag-and-drop MUST work on mobile — coaches use this at practice on their phones and need to drag players just like on desktop
- The "no dead ends" philosophy from Phase 2 carries forward — every interaction (drag AND tap) should work intuitively on mobile
- Don't remove any mobile functionality (drawer, roster management) until its replacement is wired up in the same plan

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `isMobile` / `isTablet` via `useMediaQuery` hook (line 72): Already used throughout for responsive branching — all mobile changes go behind this flag
- `RosterContent` component (line 394): Shared roster content for sidebar and drawer — can be reused for roster management modal
- `PlayerChip`-style rendering in bench bar (line 1041): Pattern for chip rendering already exists — scale up and move above field
- `rosterOpen` / `setRosterOpen` state (line 526 area): Currently controls drawer — repurpose for roster management modal
- Color constants `C` object: All existing colors stay the same
- `fontDisplay` / `fontBase`: Font declarations already established

### Established Patterns
- `isMobile ? mobileValue : desktopValue` ternary pattern used in all inline styles — extend this pattern for new layout
- `compact` prop on FieldPosition controls circle sizing — remove compact mode on mobile (use full 50px)
- Event handler pattern: `handle{Action}{Target}` naming convention
- Conditional rendering with `{!isMobile && (...)}` / `{isMobile && (...)}` blocks

### Integration Points
- Header bar (line ~887): Needs mobile-specific minimal version
- Main content area (line ~974): `flexDirection: isMobile ? "column" : "row"` — chip strip inserts above pitch in the column flow
- Bench bar (line ~1016): Hide on mobile, keep on desktop
- Mobile roster drawer (line ~1068): Remove entirely
- `FieldPosition` compact prop (line ~1003): Stop passing `compact={isMobile}`, use full size on mobile

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-mobile-ux-overhaul*
*Context gathered: 2026-03-15*
