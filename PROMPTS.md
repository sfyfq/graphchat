**Your Optimized Prompt:**
Adjust the graph layout constants in `src/lib/layout.ts` to prevent overlapping between adjacent `SquashNode` pills and other components.

1.  **Constants Adjustment**:
    - Increase `H_GAP` to at least `160` (currently `96`) to ensure that `SquashNode` pills (width `144px`) have sufficient clearance between branches.
    - Review `V_GAP` (currently `128`) to ensure it remains proportionate and provides enough vertical space for branch labels and the new "HEAD" label.

2.  **Verification**:
    - Ensure that the layout computation remains correct and that nodes are spaced far enough apart that even the widest components (squash pills with labels) do not collide.

**Key Improvements:**
• Eliminates visual clutter and overlapping elements.
• Ensures a clean, readable graph regardless of branch density or squashing.

**Techniques Applied:** Constant-based layout refinement.
