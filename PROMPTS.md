**Your Optimized Prompt:**
Refine the squash group UI to support single-expansion behavior and scrollable sidebar content.

1.  **Mutual Exclusivity**:
    - Update `App.tsx` so that `expandedGroups` effectively holds at most one ID.
    - Modify `toggleGroup` to clear any existing expanded group before adding the new one (if opening).

2.  **Scrollable Sidebar**:
    - Modify `SquashTooltip` in `src/components/Canvas/SquashNode.tsx`.
    - Add `maxHeight: 'calc(100vh - 220px)'` (or similar padding to avoid the legend).
    - Add `overflowY: 'auto'` to the main container.
    - Ensure the header remains fixed or is part of the scrollable area depending on preference (usually header fixed is better, but simple scroll is fine for now).

**Key Improvements:**
• Prevents layout clutter by limiting expanded nodes.
• Ensures the UI remains usable even with large squashed runs.

**Techniques Applied:** State constraint enforcement, CSS layout refinement.
