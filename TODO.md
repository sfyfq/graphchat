# TODO: Stable Navigation - Remove Auto-Zoom

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Refactor `toggleGroup`:
    - Remove the `isExpanding` block that dispatches `graphchat:fit-nodes`.
- [ ] Refactor `handleSidebarTurnClick`:
    - Remove the `setTimeout` block that dispatches `graphchat:fit-nodes`.

## Phase 2: Validation
- [ ] Expand a squash group. Verify the canvas does not move.
- [ ] Click a turn in the sidebar. Verify the dialog opens but the canvas stays at its current zoom/pan.
- [ ] Verify manual zoom and pan still work correctly.
- [ ] Run `npx tsc`.
