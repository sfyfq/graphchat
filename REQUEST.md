# Request: Dialog Minimization

Add the ability to minimize open chat dialogs to the right side of the viewport.

## Requirements:
- **Minimize Button:** Add a minimize button (next to close) in the `ChatDialog` header.
- **Capacity:** Limit the total number of minimized dialogs to **5**. If a 6th is added, prevent it or rotate the oldest out (user choice: prevent).
- **Minimized UI:** Display minimized dialogs as vertical pills or icons on the right edge of the screen.
- **Hover Summary:** Show the first few words or a summary of the last assistant message when hovering over a minimized item.
- **Restore:** Clicking a minimized item restores it to its previous position (or centers it).
