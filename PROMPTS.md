**Your Optimized Prompt:**
Enhance the visibility of the `HEAD` commit in `src/components/Canvas/CommitNode.tsx` to make it the most prominent element in the graph.

1.  **Labeling**:
    - Add a small "HEAD" pill/label above the node (similar to the branch label but positioned at the top).
    - Use a high-contrast color (e.g., Indigo/Indigo-400) for the HEAD label.

2.  **Visual Styling**:
    - Increase the `strokeWidth` of the node when `isHEAD` is true.
    - Intensify the pulse rings: make them larger or more opaque.
    - Add a CSS filter or SVG drop-shadow to create a "glow" effect around the HEAD node.

3.  **Integration**:
    - Ensure the label doesn't overlap with the "collapse" button or other UI elements.
    - Maintain the smooth animation of the pulse rings.

**Key Improvements:**
• Removes ambiguity about which node is the current focus of the conversation.
• Provides a clear "You are here" marker in complex conversation trees.

**Techniques Applied:** Visual hierarchy enhancement, SVG styling.
