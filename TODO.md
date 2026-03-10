# TODO: Defer Squash Expansion

## Phase 1: Implementation

### Task 1: Refactor `src/App.tsx`
- [ ] Remove `expandedGroupIds` calculation.
- [ ] Update `Canvas` prop: `expandedGroups={new Set()}` (for now, or remove if unused).
- [ ] Update `toggleGroup` centering:
    - If expanding, center on `[groupId, group.parentId, group.childId]`.
- [ ] Update `handleSidebarTurnClick`:
    - Add `window.dispatchEvent(new CustomEvent('gitchat:fit-nodes', { detail: [commit.id] }))`.

## Phase 2: Validation
- [ ] Verify clicking a pill opens the sidebar but the pill remains a pill on the canvas.
- [ ] Verify clicking a turn in the sidebar opens a dialog and that specific node appears on the canvas.
- [ ] Verify the view centers on the selected node.
- [ ] Run `npx tsc`.
