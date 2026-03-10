# TODO: Adjust Dialog Top Clamping

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] In `handleNodeClick`, change `y` clamping:
    - `clamp(..., 10, ...)` -> `clamp(..., 80, ...)`

### Task 2: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Define `SAFE_TOP = 80`.
- [ ] In `ResizeObserver` (auto-centering logic):
    - Change `Math.max(10, ...)` -> `Math.max(SAFE_TOP, ...)`.
- [ ] In `onMove` (drag logic):
    - Ensure it still uses `10` or `0` for the top clamp.

## Phase 2: Validation
- [ ] Open a new dialog. Verify it spawns at or below 80px from the top.
- [ ] Add messages until it grows. Verify the top edge doesn't cross the 80px line.
- [ ] Drag the dialog to the very top of the screen (10px). Verify this is still allowed.
- [ ] Run `npx tsc`.
