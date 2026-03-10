**Your Optimized Prompt:**
Fix the "sidebar hover overlay" bug where hovering over a turn in the sidebar causes a floating tooltip to appear on the canvas node.

1.  **Requirement**:
    - Sidebar turn hovering should highlight the corresponding node on the canvas (this part works via `hoveredId`).
    - Sidebar turn hovering should **not** display the floating `Tooltip` component next to the canvas node.
    - The floating `Tooltip` should only appear when the user hovers their mouse directly over a node or squash pill on the canvas.

2.  **Implementation**:
    - In `App.tsx`, introduce a new state `isHoveringCanvas` (boolean).
    - Update `handleNodeHover` to set `isHoveringCanvas` to `true` when a node is hovered and `false` when the hover ends.
    - In the `SquashTooltip` component's `onTurnHover` prop, ensure `isHoveringCanvas` is set to `false`.
    - Update the `showTooltip` boolean logic to include `isHoveringCanvas`.

**Key Improvements:**
• Prevents UI clutter by only showing floating info when the user is interacting directly with the graph elements.
• Maintains the useful node-highlighting feature for sidebar exploration.

**Techniques Applied:** State refinement, conditional rendering.
