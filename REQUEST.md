bug: while the initial dialog correctly expands vertically in both directions, the dialog for an existing node may appear partially outside the viewport.
--- Tue Mar 10 13:30:00 PDT 2026 ---
Analysis: `App.tsx` spawns dialogs with an `assumedHeight` of 400px. For existing nodes with a long history, the actual height might be much larger (up to 900px). The `ResizeObserver` in `ChatDialog.tsx` currently only adjusts position when the height *changes* (using `oldHeight > 0`), so the initial render uses the "bad" assumed position without correction.
Plan: Modify the `ResizeObserver` logic to perform a "safety clamp" on the first measurement. If the initially rendered height causes the dialog to exceed viewport bounds, adjust `pos.y` immediately to bring it back into view.
