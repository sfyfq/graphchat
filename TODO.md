# TODO: Center and Dynamically Resize Chat Dialogs

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Refactor `handleNodeClick` initial position logic:
    - Calculate `centeredX` and `centeredY`.
    - Use `860` for width and `400` as a placeholder for initial height.
    - Update the `clamp` boundaries for spawning.

### Task 2: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Update `maxHeight` in the style object to `min(85vh, 900px)`.
- [ ] Ensure the container correctly grows with content (verify `flex` and `overflow` interaction).
- [ ] Update `onMove` drag clamping to use the new width and a safer height boundary.

## Phase 2: Validation
- [ ] Open a new dialog and verify it starts in the center of the screen.
- [ ] Send multiple messages and verify the dialog height increases automatically.
- [ ] Verify it stops growing at the `maxHeight` limit and starts scrolling.
- [ ] Drag the dialog and verify it stays within screen bounds.
- [ ] Run `npx tsc`.
