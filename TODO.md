# TODO: Fix Initial Dialog Positioning

## Phase 1: Implementation

### Task 1: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Refactor `ResizeObserver` callback:
    - If `oldHeight === 0`:
        - Calculate if bottom exceeds bounds: `pos.y + newHeight > window.innerHeight - 10`.
        - If so, update `pos.y` to `window.innerHeight - newHeight - 10` (clamped to min 10).
    - Else (standard delta centering):
        - Continue using the existing `delta / 2` logic.

## Phase 2: Validation
- [ ] Open an existing node with many turns.
- [ ] Verify the dialog is fully within the viewport immediately.
- [ ] Verify a new dialog still opens in the center.
- [ ] Run `npx tsc`.
