bugfix: when using the sidebar to explore the nodes, a floating overlay next to the node shall not be shown. The floating overlay shall only be when the user is actually hovering on the node.
--- Tue Mar 10 10:15:00 PDT 2026 ---
Analysis: `App.tsx` uses a shared `hoveredId` state for both canvas node hovers and sidebar turn hovers. The `showTooltip` logic relies only on `hoveredId`, causing the floating `Tooltip` to appear even when the hover originates from the sidebar. We need to distinguish the source of the hover.
