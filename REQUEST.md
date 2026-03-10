bugfix: deleting a session should close the session dropdown menu.
--- Tue Mar 10 15:15:00 PDT 2026 ---
Analysis: The delete button in the session list doesn't trigger a state update to close the dropdown. When the active session is deleted, the store automatically switches to another session (or creates a new one), but the UI stays in its "menu open" state.
Plan: Add `setShowSessions(false)` to the delete button's click handler in `Toolbar.tsx`.
