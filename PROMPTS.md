**Your Optimized Prompt:**
Double the width of the chat dialog window and ensure layout clamping is updated accordingly.

1.  **Dimensions**:
    - In `src/components/ChatDialog/ChatDialog.tsx`, change `width: 430` to `860`.
    - Update the drag clamping in `ChatDialog.tsx` from `window.innerWidth - 440` to `window.innerWidth - 870`.

2.  **Spawning Logic**:
    - In `src/App.tsx`, update the initial dialog spawn clamping.
    - Change `window.innerWidth - 450` to `window.innerWidth - 880`.

3.  **Visuals**:
    - Ensure the increased width looks intentional and the message list scales correctly (it should, as it uses flex/width: 100%).

**Key Improvements:**
• Provides more space for reading long messages and code snippets.
• Improves readability on wider screens.

**Techniques Applied:** Constant-based layout adjustment.
