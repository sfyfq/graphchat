A thread dialog sitting behind another one doesn't come to the foreground when clicking on the header.
--- Mon Mar  9 16:03:48 PDT 2026 ---


--- Mon Mar  9 16:08:45 PDT 2026 ---

Set up a git repository for the project.
- Initialize the repository.
- Create a `main` branch.
- Create a `dev` branch.
- Ensure all initial project files are tracked.
- **Constraint**: I can commit to `dev` or other feature branches, but I must NEVER commit directly to `main` or perform merges into `main`. Merging to `main` is reserved for the user.
--- Mon Mar  9 17:21:24 PDT 2026 ---

Refine the squash logic to correctly handle linear paths and implement a way to collapse expanded groups.
1.  **Fix Squash Logic:** Modify `src/lib/squash.ts` to allow `assistant` nodes to be collapsible if they are part of a strictly linear chain. Set `MIN_SIZE` to 1 to ensure that even short linear segments (like a single user message or a turn) can be squashed if they are between visible landmarks. Ensure no `user -> user` paths are visible.
2.  **Collapsible State:** Implement a way for users to collapse a group that was previously expanded. Add a "collapse" button or action to the representative node of an expanded group.
3.  **State Management:** Ensure that expanded groups can be collapsed and that closing dialogs allows nodes to return to their squashed state if they are no longer pinned and not in the `expandedGroups` set.
