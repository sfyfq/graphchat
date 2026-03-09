## TODO: Bring Dialog to Foreground on Click

- [ ] **Research/Strategy Phase:** (Completed) Already identified that `App.tsx` and `ChatDialog.tsx` need modifications.
- [ ] **Execution Phase:**
    - [ ] **Modify `ChatDialog.tsx`:**
        - [ ] Add `onFocus` callback prop to `Props`.
        - [ ] Update `onHeaderMouseDown` (or the whole dialog `onMouseDown`) to trigger `onFocus`.
    - [ ] **Modify `App.tsx`:**
        - [ ] Update `handleNodeClick` to correctly reorder dialogs when clicking an already open node.
        - [ ] Add `focusDialog` helper function to reorder dialogs by moving the focused dialog to the end of the `dialogs` state.
        - [ ] Pass `onFocus={() => focusDialog(commitId)}` to `ChatDialog` in the rendering loop.
- [ ] **Validation Phase:**
    - [ ] Since it's a UI issue, I'll rely on code inspection and ensure no syntax errors.
    - [ ] Verify that dialogs are still functional and draggable.

--- Mon Mar  9 16:03:48 PDT 2026 ---

## TODO: Refine Squash Logic and Conversation Flow

- [ ] **Squash Logic Refinement (`src/lib/squash.ts`):**
    - [ ] Change `MIN_SIZE` to 1.
    - [ ] Update `collapsible` criteria: exclude nodes where `commits[id].role === 'assistant'`.
- [ ] **HEAD Management Update:**
    - [ ] **`ChatDialog.tsx`:** In `handleSend`, remove `setHEAD(userId)`. Keep `setHEAD(assistantId)`.
    - [ ] **`App.tsx`:** In `handleNodeClick`, set `HEAD` to the node's assistant descendant if available.
- [ ] **Data Loss Prevention (`ChatDialog.tsx`):**
    - [ ] Add `handleClose` function that checks for non-empty `input` and prompts for confirmation.
    - [ ] Update close button `onClick` to use `handleClose`.
- [ ] **Validation:**
    - [ ] Ensure `assistant` nodes are never squashed in the canvas.
    - [ ] Verify that single `user` nodes between `assistant` nodes are squashed into pills.
    - [ ] Confirm that closing a dialog with text prompts the user.
    - [ ] Verify that HEAD remains at the assistant landmark during generation.

--- Mon Mar  9 16:08:45 PDT 2026 ---

## TODO: Setup Git Repository

- [ ] **Initial Setup Phase:**
    - [ ] `git init` - Initialize the repo.
    - [ ] `git checkout -b main` - Ensure the default branch is named `main`.
    - [ ] `git checkout -b dev` - Create the `dev` branch for all current and future work.
- [ ] **Staging & Commit Phase:**
    - [ ] `git add .` - Stage all project files (respecting existing `.gitignore`).
    - [ ] `git commit -m "initial commit on dev branch"` - Commit initial state strictly to `dev`.
- [ ] **Validation:**
    - [ ] Verify `git branch` shows both `main` and `dev`.
    - [ ] Confirm `main` is clean and contains no commits yet, or that it is ready for the user to perform the first merge.
- [ ] **Final Instruction to User:**
    - [ ] Provide the command for the user to perform the first merge to `main`.
- [ ] **Archive 4-D Files:**
    - [ ] Append methodology files to `history/` and remove locals.
