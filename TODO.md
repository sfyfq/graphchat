# TODO: Refine Squash Expansion & Sidebar

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Modify `toggleGroup`:
    - If `isExpanding` is true, set `expandedGroups` to a new `Set([groupId])`.
    - This ensures only one group is expanded at a time.

### Task 2: Update `src/components/Canvas/SquashNode.tsx`
- [ ] Modify `SquashTooltip` container styles:
    - Add `maxHeight: 'calc(100vh - 240px)'`.
    - Add `overflowY: 'auto'`.
    - Ensure the "X" button and header are always visible or handle scrolling gracefully.

## Phase 2: Validation
- [ ] Verify that opening a new squash group closes the previous one.
- [ ] Verify that long squash groups in the sidebar can be scrolled.
- [ ] Verify that the sidebar does not cover the legend at the bottom left.
- [ ] Run `npx tsc`.
