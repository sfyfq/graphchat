**Your Optimized Prompt:**
Fix the squash group interaction bug by decoupling "hovered" and "expanded" states in `App.tsx`.

1.  **Requirement**:
    - An expanded squash group (persistent sidebar) should remain visible even when the user hovers over other squash groups on the canvas.
    - Hovering over a squash group should show a temporary "top-level" overlay (sidebar position) that is dismissed when the mouse leaves.
    - The persistent expanded sidebar should only be replaced when a different group is explicitly clicked (expanded).

2.  **Implementation in `App.tsx`**:
    - Replace `activeSquashGroup` state with two separate states:
        - `hoveredSquashGroup`: `SquashGroup | null` (transient).
        - `expandedSquashGroup`: `SquashGroup | null` (persistent).
    - Update `handleSquashHover` to only set/clear `hoveredSquashGroup`.
    - Update `toggleGroup` to set/clear `expandedSquashGroup` based on clicks.
    - In the render block:
        - Render a persistent `SquashTooltip` for `expandedSquashGroup`.
        - Render a transient `SquashTooltip` for `hoveredSquashGroup` ONLY if it is not the same as the expanded one.
        - Ensure the hovered one has a higher Z-index or is rendered later to appear on top.

**Key Improvements:**
• Restores stable interaction for expanded groups.
• Allows "peek" functionality via hover without losing expansion context.

**Techniques Applied:** State decoupling, defensive UI logic.
