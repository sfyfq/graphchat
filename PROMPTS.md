**Your Optimized Prompt:**
Remove all automatic canvas centering and zooming logic tied to squash group interactions in `src/App.tsx`.

1.  **Interaction Refactor**:
    - In `toggleGroup`, remove the logic that dispatches the `graphchat:fit-nodes` event when a group is expanding.
    - In `handleSidebarTurnClick`, remove the logic that dispatches the `graphchat:fit-nodes` event when a sidebar turn is clicked.

2.  **Rationale**:
    - This eliminates disorienting canvas jumps during history exploration.
    - Users can now navigate the graph and sidebar independently without the camera moving automatically.

3.  **Cleanup**:
    - Ensure the `Canvas.tsx` listener for `graphchat:fit-nodes` remains, as it may be useful for other features (like the logo auto-fit or future enhancements), but it should no longer be triggered by standard squash/turn interactions.

**Key Improvements:**
• Provides a more stable and predictable navigation experience.
• Respects the user's manual zoom and pan settings during exploration.

**Techniques Applied:** Interaction stabilization, event removal.
