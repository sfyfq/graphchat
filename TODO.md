# TODO: Fix Sidebar Hover Overlay Bug

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Add `const [isHoveringCanvas, setIsHoveringCanvas] = useState(false)`.
- [ ] Update `handleNodeHover`:
    - Set `setIsHoveringCanvas(!!commitId)`.
- [ ] Update `SquashTooltip` usage:
    - Change `onTurnHover={setHoveredId}` to a wrapper that calls `setHoveredId(id)` and `setIsHoveringCanvas(false)`.
- [ ] Update `showTooltip` logic:
    - Change to `const showTooltip = hoveredCommit && !dialogs[hoveredId!] && isHoveringCanvas`.

## Phase 2: Validation
- [ ] Verify that hovering over a node on the canvas shows the tooltip.
- [ ] Verify that hovering over a turn in the sidebar highlights the node but **no tooltip** appears.
- [ ] Run `npx tsc` to ensure no type regressions.
