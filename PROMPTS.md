**Your Optimized Prompt:**
Refactor the squash group expansion logic to defer canvas un-squashing until a specific turn is selected in the sidebar.

1.  **State & Logic Refinement**:
    - In `src/App.tsx`, remove the `expandedGroupIds` memo that forces groups to expand based on sidebar membership.
    - Pass an empty `Set` (or remove the logic that populates it) to the `Canvas` component's `expandedGroups` prop.
    - This ensures that a `SquashGroup` remains rendered as a pill even when its contents are being explored in the sidebar.

2.  **Interaction Updates**:
    - Update `toggleGroup`: When a pill is clicked, auto-center on the pill (`groupId`) and its immediate parent/child, rather than the entire (hidden) node list.
    - Update `handleSidebarTurnClick`: After opening the dialog, trigger a `gitchat:fit-nodes` event for the specific commit ID to ensure the newly expanded node is centered in the view.

3.  **Cleanup**:
    - Remove any redundant `expandedGroups` (Set) state if it's no longer used for canvas rendering.

**Key Improvements:**
• Keeps the canvas clean and focused while exploring history.
• Provides a "surgical" expansion experience where only relevant nodes are revealed.
• Maintains a stable visual reference (the pill) until the user decides to "pull" a node out of it.

**Techniques Applied:** Interaction deferral, surgical UI updates.
