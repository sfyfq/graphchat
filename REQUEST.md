adjustment: ensure initial dialog position and automatic growth respect the toolbar area.
- The top edge of the dialog should not go above the bottom of the session dropdown menu (approx 80px) during initial spawn or automatic vertical growth.
- Manual dragging should still allow the dialog to be moved anywhere within the viewport.
--- Tue Mar 10 14:15:00 PDT 2026 ---
Analysis: Currently, all clamping (initial, auto-growth, and dragging) uses a 10px top margin. We need to bifurcate this logic: use a larger margin (e.g., 80px) for computer-controlled positioning and keep the tighter margin (10px) for user-controlled dragging.
