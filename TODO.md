# TODO: LaTeX Overlay Preview

## Phase 1: Math Detection Logic
- [ ] Implement `getMathAtCursor(text, position)` helper function.
- [ ] Add `activeMath` state to `ChatDialog`.
- [ ] Update `handleInputChange` and `onKeyUp` to set `activeMath`.

## Phase 2: Overlay UI
- [ ] Create an absolutely positioned `MathPreviewOverlay` component (or inline div).
- [ ] Style it as a floating bubble above the textarea.
- [ ] Remove the old static `Live Preview` block.

## Phase 3: Validation
- [ ] Verify the overlay appears only when the cursor is inside `$ $`.
- [ ] Verify the overlay content updates as you type.
- [ ] Verify the dialog layout remains stable.
- [ ] Run `npx tsc`.
