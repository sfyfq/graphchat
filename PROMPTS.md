# Bugfix: Correct Tracking for Minimized Dialogs

## Objective
Ensure that minimized dialogs preserve the latest state of the conversation by using the `tipId` (current branch head) instead of the original spawn `commitId`.

## 1. ChatDialog Refactor (`src/components/ChatDialog/ChatDialog.tsx`)
- Update `handleMinimize`:
    - Change `commitId: commit.id` to `commitId: tipId`.
    - This ensures the state object sent to `onMinimize` reflects the current conversation progress.

## 2. App State Refactor (`src/App.tsx`)
- Update `handleMinimize`:
    - When moving a dialog to `minimizedDialogs`, use the `state.commitId` (which is now `tipId`) as the key in the state.
    - Ensure the original active dialog (keyed by `commit.id`) is removed from the `dialogs` map.
- Update `handleRestore`:
    - Correctly restore the dialog using the saved `commitId` from the minimized state.
