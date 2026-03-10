**Your Optimized Prompt:**
Refactor the `ChatDialog` positioning and sizing logic for better initial visibility and dynamic growth.

1.  **Centering on Open (`src/App.tsx`)**:
    - Update `handleNodeClick` to calculate initial `x` and `y` coordinates that center the dialog on the screen.
    - Dialog width is `860px`. Assume an initial height of approximately `400px` for centering purposes.
    - `x = (window.innerWidth - 860) / 2`
    - `y = (window.innerHeight - 400) / 2` (clamped to ensure it stays on screen).

2.  **Vertical Expansion (`src/components/ChatDialog/ChatDialog.tsx`)**:
    - Increase `maxHeight` from `560` to a more generous value like `Math.min(window.innerHeight * 0.85, 900)`.
    - Ensure the container uses `height: 'auto'` (implicit with flex and no fixed height) so it only takes as much space as needed.
    - Update the drag clamping logic to respect the dynamic height if possible, or use a safe constant for the bottom edge.

3.  **Spawning Logic**:
    - Update the clamping in `App.tsx` to allow centered spawning even on smaller screens.

**Key Improvements:**
• Provides a "hero" focus when opening a thread.
• Optimizes screen real estate by only occupying the height necessary for the current conversation.

**Techniques Applied:** Dynamic layout calculation, viewport-relative sizing.
