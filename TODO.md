# TODO: Enhance Initial Experience

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Initialize `dialogs` state with root node data.
- [ ] Ensure `commits['root']` availability or handle initial loading gracefully.

### Task 2: Update `src/components/Canvas/Canvas.tsx`
- [ ] Refactor initial auto-fit `useEffect`:
    - Find `root` position in `layout`.
    - Calculate `pan` such that `root.x` is horizontal center and `root.y` is at 70% vertical.

## Phase 2: Validation
- [ ] Refresh the page.
- [ ] Verify the root dialog is open and centered.
- [ ] Verify the root node is visible on the canvas, positioned in the lower third.
- [ ] Run `npx tsc`.
