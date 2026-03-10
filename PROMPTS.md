**Your Optimized Prompt:**
Refactor the LaTeX live preview into a floating overlay in `src/components/ChatDialog/ChatDialog.tsx`.

1.  **Selection Detection**:
    - Add state to track the active LaTeX segment at the cursor: `activeMath: string | null`.
    - In `handleInputChange` and a new `handleKeyUp` (for arrow keys), check if `selectionStart` is within a `$ $` or `$$ $$` block.
    - If it is, extract that specific math string and set `activeMath`.

2.  **Positioning**:
    - Implement a way to find the cursor's pixel position within the textarea. *Hint: Using a hidden mirror div or a lightweight utility is standard for this.*
    - Alternatively, position the overlay at a fixed offset above the textarea if precise cursor tracking is too complex for this turn, but ensure it's an `absolute` overlay that doesn't push layout.

3.  **UI/UX**:
    - The `Live Preview` should be an absolutely positioned div.
    - Give it a higher `zIndex`, a subtle shadow, and a dark, blurred background (`backdropFilter`).
    - Use an "arrow" or "speech bubble" style to point down towards the input.

**Key Improvements:**
• Non-disruptive UI: The dialog size doesn't jump as the user types math.
• Focused feedback: Shows exactly what the user is currently editing.

**Techniques Applied:** Floating UI patterns, context-aware selection extraction.
