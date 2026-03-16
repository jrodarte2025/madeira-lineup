# Phase 2: Drag-and-Drop Completion - Context

**Gathered:** 2026-03-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete all drag-and-drop interactions so coaches can move players in any direction with no dead ends. Field-to-bench removal, bench-to-field swap, and bench-to-empty-field assignment must all work via both drag and click. No new features, no mobile layout changes (Phase 3), no changes to field position sizing or formatting (Phase 1 complete).

</domain>

<decisions>
## Implementation Decisions

### Bench drop target (field-to-bench removal)
- Entire roster panel is the drop zone — sidebar on desktop, bench bar on mobile
- Both the bench bar (desktop top area) and the sidebar roster accept field-to-bench drops
- Roster panel gets a subtle highlight (border glow or background tint) when a field player is dragged over it, matching the existing inactive zone hover pattern
- No confirmation feedback (toast/flash) after drop — the field position going empty is feedback enough

### Visual drag feedback
- All valid field positions get a soft box-shadow glow (orange accent) while a player is being dragged
- Same highlight for occupied and empty positions — no visual distinction between "will assign" vs "will swap"
- Source position dims/goes semi-transparent while its player is being dragged
- Roster panel highlights when it can accept a field player drop

### Click interaction parity
- Double-click a field player to remove them to bench (new)
- Select bench player + click occupied field position = swap (bench player to field, field player to bench)
- Select bench player + click empty field position = assign (existing behavior, unchanged)
- Select field player + click another field position = swap them (field-to-field click swap, new)
- No visual swap indicator on occupied positions when a bench player is selected — swap just happens

### Claude's Discretion
- Exact glow color intensity and animation (pulse vs static)
- Dim opacity level for source position during drag
- How highlight transitions in/out (instant vs fade)
- Any edge cases around drag events (dragenter vs dragover timing)

</decisions>

<specifics>
## Specific Ideas

- Highlight pattern should match the existing inactive zone hover behavior for consistency
- Click interactions should feel like natural extensions of the existing select-then-click pattern
- The goal is "no dead ends" — every reasonable player movement should work intuitively

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `handleDragStart` / `handleDragEnd` (line 723): Already captures playerId and source type — extend with new source types
- `handlePositionDrop` (line 728): Handles roster→field and position→position — add bench swap logic here
- `handleInactiveDrop` / `handleInactiveDragOver` / `handleInactiveDragLeave` (lines 395-406): Pattern for drop zone highlighting — reuse for roster panel
- `removeFromPosition` (line 629): Already exists — clears a position, perfect for field→bench removal
- `assignPlayer` (line 605): Handles bench→field assignment, already clears existing position if player was elsewhere
- `swapPositions` (line 619): Array swap for field-to-field — works for drag, extend to click
- `dragSource` state (line 539): Tracks what's being dragged — use to determine valid drop zones for highlighting

### Established Patterns
- Inline styles with conditional ternaries for visual states (selected, highlighted, dimmed)
- `dragSource` state object `{ playerId, source }` where source is "roster", "inactive", or position index
- Event handler naming: `handle{Action}{Target}` (e.g., handlePositionDrop, handleInactiveDrop)
- Drop zones use `onDragOver` + `onDrop` + `onDragLeave` trio for highlight management

### Integration Points
- `Sidebar` component (line ~392): Needs `onDragOver` / `onDrop` / `onDragLeave` handlers added for bench drop zone
- Bench bar (desktop, line ~980): Needs same drop handlers as sidebar
- `FieldPosition` component (line 153): Needs conditional glow styling based on `dragSource` state
- `handlePositionClick` (line 747): Needs swap logic when clicking occupied position with selected bench player
- `handlePositionDrop` (line 728): Needs new branch for "roster" source onto occupied position = swap

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-drag-drop-completion*
*Context gathered: 2026-03-15*
