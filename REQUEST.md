# Request: Fix Minimized Dialog Tracking

Minimized dialogs currently track the original commit ID they were opened with, causing them to "revert" to an older conversation state when restored.

## Requirements:
- **Track Latest State:** When minimizing, use the `tipId` (the current head of the conversation in the dialog) instead of the original `commit.id`.
- **Restore Latest State:** Ensure that when a dialog is restored, it opens at the `tipId` that was active at the moment of minimization.
- **Content Persistence:** Preserve any uncommitted text in the input field.
