**Your Optimized Prompt:**
Refactor the initial application state and canvas layout for a better "first-look" experience.

1.  **Auto-open Root Dialog (`src/App.tsx`)**:
    - Initialize the `dialogs` state with the `root` node already open.
    - `x = (window.innerWidth - 860) / 2`
    - `y = (window.innerHeight - 400) / 2`
    - `initialInput = ""`

2.  **Initial Canvas Positioning (`src/components/Canvas/Canvas.tsx`)**:
    - Update the "Auto-fit on first render" `useEffect`.
    - Instead of centering the whole graph, specifically calculate the pan to place the `root` node at:
        - `x = window.innerWidth / 2`
        - `y = window.innerHeight * 0.7` (approx bottom 1/3).
    - Account for the current `zoom` (which starts at 1).

**Key Improvements:**
• Removes the need for the user's first action to be a click.
• Provides an immediate, balanced view of both the interface (dialog) and the data (root node).

**Techniques Applied:** State initialization, viewport-aware layout math.
