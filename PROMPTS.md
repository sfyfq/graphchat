**Your Optimized Prompt:**
Fix the stale sidebar bug by automatically closing the expanded squash group sidebar when a turn is selected.

1.  **Requirement**:
    - When a user clicks on a message turn in the `SquashTooltip` sidebar, the sidebar should immediately close (`expandedSquashGroup` set to `null`).
    - This prevents the sidebar from showing a "stale" group structure that may have been split or re-squashed by the new pin (the clicked node).

2.  **Implementation**:
    - In `src/App.tsx`, update the `handleSidebarTurnClick` callback.
    - Inside the callback, add `setExpandedSquashGroup(null)`.

**Key Improvements:**
• Ensures the UI state accurately reflects the current graph structure.
• Provides a smoother transition from "exploring history" to "interacting with a specific turn."

**Techniques Applied:** State reset on interaction.
