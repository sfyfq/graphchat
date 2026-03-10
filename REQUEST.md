improvement: Make LaTeX live preview a floating overlay instead of a layout-changing box.
- The preview should only appear when the cursor is inside a LaTeX delimiter pair ($...$ or $$...$$).
- It should be positioned as a floating tooltip above the cursor/active input area.
- It should not change the overall dialog layout.
--- Wed Mar 11 10:15:00 PDT 2026 ---
Analysis: Currently, the preview is a static block above the textarea. To make it a floating overlay, we need:
1. Logic to detect if the cursor is within math delimiters.
2. A way to calculate the (x, y) coordinates of the cursor relative to the textarea or container.
3. A floating div that uses these coordinates for absolute positioning.
