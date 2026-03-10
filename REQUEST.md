bugfix: when a session is deleted or switched, the new session's root node positioning is incorrect.
--- Tue Mar 10 15:00:00 PDT 2026 ---
Analysis: `Canvas.tsx` uses an `initialised` ref to run the "Auto-fit on first render" logic exactly once. However, this ref persists even when the underlying session changes (e.g., via deletion or switching). Consequently, the auto-centering logic for the new session's `root` node never runs.
Plan: Reset the `initialised` ref whenever the current session ID changes. This ensures that every time a new graph is loaded, the `root` node is correctly framed in the lower third of the viewport.
