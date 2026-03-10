# TODO: Double Chat Dialog Width

## Phase 1: Implementation

### Task 1: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Change `width` from `430` to `860`.
- [ ] Update drag boundary: `window.innerWidth - 440` -> `window.innerWidth - 870`.

### Task 2: Update `src/App.tsx`
- [ ] Update spawn boundary: `window.innerWidth - 450` -> `window.innerWidth - 880`.

## Phase 2: Validation
- [ ] Verify dialog is wider.
- [ ] Verify dragging still respects screen edges correctly.
- [ ] Verify new dialogs spawn within visible bounds.
- [ ] Run `npx tsc`.
