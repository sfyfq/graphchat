**Your Optimized Prompt:**
Fix the initial positioning bug in `src/components/ChatDialog/ChatDialog.tsx` to ensure dialogs with existing content spawn within the viewport.

1.  **Logic Update**:
    - Refactor the `ResizeObserver` in `useLayoutEffect`.
    - Handle the case where `oldHeight === 0` (the first measurement).
    - On the first measurement, check if the dialog's current bottom (`pos.y + newHeight`) exceeds the window height.
    - If it does, update `pos.y` to a safe value (e.g., `window.innerHeight - newHeight - 10`).
    - This ensures that a heavily populated dialog doesn't "start" partially off-screen.

2.  **Consistency**:
    - Ensure this initial correction doesn't conflict with the `delta / 2` centering logic used for subsequent growth.
    - Maintain the rule that we don't auto-move the dialog if the user is currently dragging it.

**Key Improvements:**
• Guarantees that every dialog, whether fresh or historical, is fully visible upon opening.
• Eliminates the need for manual repositioning immediately after opening an old thread.

**Techniques Applied:** Robust viewport clamping, initial state correction.
