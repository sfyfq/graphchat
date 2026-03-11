# TODO: Fix Minimized Dialog Tracking

- [x] **Phase 1: ChatDialog Logic Update**
    - [x] Modify `handleMinimize` in `ChatDialog.tsx` to use `tipId`.

- [x] **Phase 2: App.tsx State Update**
    - [x] Update `handleMinimize` in `App.tsx` to correctly key the minimized state by `tipId`.
    - [x] Ensure the old `commit.id` key is removed from active `dialogs`.
    - [x] Verify `handleRestore` uses the correct key.
