**Your Optimized Prompt:**
Adjust the `ChatDialog` positioning logic to prevent automatic overlap with the Toolbar/Session menu.

1.  **Constants**:
    - Define a `SAFE_TOP = 80` (representing the area below the Toolbar).
    - Continue using `SCREEN_MARGIN = 10` for general viewport edges.

2.  **Initial Spawning (`src/App.tsx`)**:
    - Update `handleNodeClick` initial `y` calculation.
    - Change the `clamp` minimum from `10` to `SAFE_TOP`.

3.  **Automatic Growth (`src/components/ChatDialog/ChatDialog.tsx`)**:
    - In the `ResizeObserver` logic, update the `pos.y` clamping.
    - Change the `Math.max(10, ...)` to `Math.max(SAFE_TOP, ...)`.
    - This ensures that as the dialog grows and centers itself, it doesn't "creep" into the Toolbar area.

4.  **Manual Dragging (`src/components/ChatDialog/ChatDialog.tsx`)**:
    - In the `onMove` handler, keep the clamping as is (or ensure it uses the smaller `10px` margin).
    - This satisfies the requirement that it "may be moved around anywhere within the viewport."

**Key Improvements:**
• Prevents the dialog from obscuring critical navigation elements (Session Switcher, Logo) on open.
• Respects user intent by allowing manual overrides via dragging.

**Techniques Applied:** Logical bifurcation of constraints, layout safety zones.
