# Phase 1: Display Polish - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Sharpen player name formatting and field position sizing so players are immediately readable at a glance. Field positions show abbreviated names ("J. Smith"), bench shows full names, and position circles are larger with proportionally bigger text. No new features, no layout changes, no drag-and-drop changes.

</domain>

<decisions>
## Implementation Decisions

### Field circle content
- Number stays inside the circle (e.g., "7") — no change to circle interior
- Name below the circle changes from last-name-only to "J. Smith" format (first initial + dot + last name)
- Position label (LW, CB, etc.) remains below the name — three-line stack: number in circle, abbreviated name, position label
- Empty positions show position label only inside a dashed circle — unchanged from current behavior

### Bench/roster names
- Bench already shows full player names — no changes needed (DISP-02 is satisfied as-is)

### Circle sizing
- Normal circles increase from 46px to ~56px (~20% larger)
- All text inside and below circles scales up proportionally (number ~20px, name ~12px, position label ~10px)
- Empty position circles are the same size as filled circles (56px) — uniform field layout
- Compact mode also scales up proportionally (36px → ~44px)

### Print view
- Print field positions get the "J. Smith" name formatting to match screen view
- Print circle sizes stay as-is (24px filled, 18px empty) — no size increase for ink/paper efficiency
- Print bench already shows full names — no changes needed

### Claude's Discretion
- Multi-part name handling (e.g., "Carlos De La Cruz" → pick best abbreviation approach for readability in limited field space)
- Name overflow handling when abbreviated name exceeds max width (truncate with ellipsis vs wrap)
- Exact font sizes and spacing for the new proportional scale

</decisions>

<specifics>
## Specific Ideas

- Player "Mary Claire" goes by "M.C." — the abbreviation logic must handle names already entered as initials (e.g., "M.C. Smith" should display as "M.C. Smith" on the field, not re-abbreviate to "M. Smith")
- Single-word names (e.g., "Pelé") display as-is with no abbreviation or initial dot

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `FieldPosition` component (line 142): Already has the three-line stack structure (circle → name → position label). Name formatting change is a one-line edit to the text content; sizing changes are constant value updates.
- `PlayerChip` component (line 179): Bench display — no changes needed.
- `PrintPitch` component (line 212): Has parallel structure to FieldPosition for print. Name formatting change mirrors the screen change.
- Color constants in `C` object: All existing colors stay the same.

### Established Patterns
- Inline styles with conditional ternaries for sizing (compact vs normal, has player vs empty)
- `player.name.split(" ").slice(-1)[0]` is the current last-name extraction — will be replaced with abbreviation logic
- `compact` boolean prop controls smaller sizing variant — used in compact views

### Integration Points
- `FieldPosition` is rendered inside the main pitch area — sizing changes may affect position overlap in dense formations (4-3-1 has 9 positions)
- `PrintPitch` renders independently via CSS `@media print` — changes are isolated from screen layout
- Name formatting logic should be a shared utility function used by both FieldPosition and PrintPitch

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-display-polish*
*Context gathered: 2026-03-15*
