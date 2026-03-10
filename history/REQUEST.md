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
feature: the current design doesn't display the root node. I want the root node to represent the welcome message of the assistant. so the changes needed are: make the root visible and shaped differently; and when starting a new chat session, do not load from the seed, just display the root node only.
--- Mon Mar  9 17:30:00 PDT 2026 ---
feature: refine the squash logic.
- MIN_SIZE = 3.
- SquashGroup size must be odd.
- SquashGroup must begin and end with a 'user' node.
- SquashGroup must have exactly one parent node (assistant) and one child node (assistant).
--- Tue Mar 10 09:18:00 PDT 2026 ---
bug: when the canvas consists of root-user-assistant-user-assistant-user-assistant, i expect the layout to become root-squashed-assistant, but I get root-user-assistant-squashed-assistant.
--- Tue Mar 10 09:25:00 PDT 2026 ---
Analysis: The `computeSquashGroups` function in `src/lib/squash.ts` explicitly excludes nodes whose parent is 'root' from being candidates for squashing. This prevents the first user-assistant pair from being included in a squash group even if they meet all other criteria.
bugfix: when using the sidebar to explore the nodes, a floating overlay next to the node shall not be shown. The floating overlay shall only be when the user is actually hovering on the node.
--- Tue Mar 10 10:15:00 PDT 2026 ---
Analysis: `App.tsx` uses a shared `hoveredId` state for both canvas node hovers and sidebar turn hovers. The `showTooltip` logic relies only on `hoveredId`, causing the floating `Tooltip` to appear even when the hover originates from the sidebar. We need to distinguish the source of the hover.
improvement: refine squash group expansion and sidebar usability.
- Enforce at most one expanded squash group at a time. Opening a new one replaces the current one.
- Make the squash group sidebar scrollable to avoid overlapping with the legend at the bottom.
--- Tue Mar 10 10:30:00 PDT 2026 ---
bug: when a squashGroup is active, hovering on another one would close the active one, leaving the expanded group in an expanded group without a means to close it. so hovering on a squashgroup should create a toplevel overlay that is automatically dismissed without affecting the active one.
--- Tue Mar 10 10:45:00 PDT 2026 ---
Analysis: The `activeSquashGroup` state in `App.tsx` is being overloaded for both "hover" and "expansion". When a user hovers over a different group, `activeSquashGroup` is updated, and when they leave, it's cleared if the new group isn't expanded. This effectively "evicts" the previously expanded group from the sidebar.
Plan: Decouple these states. Maintain a persistent `expandedSquashGroup` and a transient `hoveredSquashGroup`. Render both as separate instances of `SquashTooltip` if they differ.
feature: make the last active commit more visible.
- The HEAD commit should be immediately obvious in the graph.
- Add a "HEAD" indicator label.
- Intensify the visual styling (pulse, stroke, or glow).
--- Tue Mar 10 11:00:00 PDT 2026 ---
feature: ensure no components are overlapping, specifically adjacent squashGroup pills.
- Increase H_GAP in layout logic to accommodate the width of SquashNode pills.
- SquashNode width is 144px (PILL_W * 2), while H_GAP is currently 96px.
--- Tue Mar 10 11:15:00 PDT 2026 ---
feature: make the dialog window twice wider.
- Increase ChatDialog width from 430px to 860px.
- Adjust clamping logic in App.tsx and ChatDialog.tsx to accommodate the new width.
--- Tue Mar 10 11:30:00 PDT 2026 ---
improvement: defer canvas expansion of squash groups.
- When a squash pill is clicked, open the sidebar but do not automatically expand the nodes on the canvas.
- Defer expansion until the user clicks a specific turn in the sidebar.
- Clicking a sidebar turn opens a dialog, which pins the node and makes it visible on the canvas.
- Adjust auto-centering logic to focus on the pill when the sidebar opens, and on the specific node when a turn is clicked.
--- Tue Mar 10 11:45:00 PDT 2026 ---
bugfix: when the user clicks on a node from the sidebar to bring up a dialog, nodes on both sides of the active node (HEAD) are squashed, leaving the active sidebar stale. Automatically close the squashGroup sidebar when the user picks a node from there.
--- Tue Mar 10 12:00:00 PDT 2026 ---
Analysis: When a turn is clicked in the sidebar, a dialog opens, pinning that node. The graph re-calculates, often splitting the original run into multiple new groups. The sidebar, which holds a snapshot of the original group, becomes visually and logically disconnected from the new canvas state. Closing the sidebar on click provides a clean transition to the newly revealed node.
feature: Atomic turns with streaming and User-node editing.
- HEAD must always point to an Assistant node.
- Clicking a User node: Set HEAD to parent Assistant, pre-fill dialog input with user node content.
- Clicking an Assistant node: Set HEAD to self, empty dialog input.
- Sending a message: Do not commit User node immediately. Wait for Assistant response (streaming).
- Atomic Commit: Only after the Assistant stream finishes successfully, commit BOTH the User and Assistant nodes to the store.
- Error handling: If the request fails, the User message stays in the input field; nothing is committed to the graph.
--- Tue Mar 10 12:15:00 PDT 2026 ---
bugfix: clicking a user node (draft) should not show that user message in the dialog's message list.
- When a User node is clicked, the dialog should display the conversation up to its parent Assistant node.
- The clicked User node's content should only appear in the input textfield.
--- Tue Mar 10 12:30:00 PDT 2026 ---
Analysis: `ChatDialog` was initializing its `tipId` state to the clicked node's ID. For User nodes, this caused the message list to include the User message itself. We should initialize `tipId` to the parent ID if the clicked node is a User node.
feature: rename project from gitchat to graphchat and add MIT license.
- Replace all occurrences of "gitchat" and "GitChat" with "graphchat" and "GraphChat".
- Update package.json, README.md, index.html, and code files (custom events, logo).
- Update history files for consistency.
- Create an MIT LICENSE file.
--- Tue Mar 10 12:45:00 PDT 2026 ---
improvement: center dialog on open and allow vertical expansion.
- Initial position should be centered on the screen.
- The dialog height should be dynamic, growing as messages are added, up to a reasonable limit (e.g., 85% of viewport height).
- Update drag and spawn boundaries to handle the new dimensions.
--- Tue Mar 10 13:00:00 PDT 2026 ---
bug: while the initial dialog correctly expands vertically in both directions, the dialog for an existing node may appear partially outside the viewport.
--- Tue Mar 10 13:30:00 PDT 2026 ---
Analysis: `App.tsx` spawns dialogs with an `assumedHeight` of 400px. For existing nodes with a long history, the actual height might be much larger (up to 900px). The `ResizeObserver` in `ChatDialog.tsx` currently only adjusts position when the height *changes* (using `oldHeight > 0`), so the initial render uses the "bad" assumed position without correction.
Plan: Modify the `ResizeObserver` logic to perform a "safety clamp" on the first measurement. If the initially rendered height causes the dialog to exceed viewport bounds, adjust `pos.y` immediately to bring it back into view.
improvement: auto-open root dialog and position root node in bottom 1/3.
- On startup, automatically open the chat dialog for the root node.
- Adjust the initial canvas layout so that the root node is centered horizontally but positioned in the bottom 1/3 of the screen.
- This ensures both the centered dialog and the root node are visible and clear.
--- Tue Mar 10 13:45:00 PDT 2026 ---
feature: multi-session support and IndexedDB persistence.
- Refactor store to manage multiple sessions (id -> SessionObject).
- Use IndexedDB (via idb-keyval) for persistent storage to support future attachments.
- Add UI for session listing, switching, creating, and deleting in the Toolbar.
- Replace commit count with Session Manager.
- Ensure "Draft" logic and local UI state are cleared upon session switch.
--- Tue Mar 10 14:00:00 PDT 2026 ---
adjustment: ensure initial dialog position and automatic growth respect the toolbar area.
- The top edge of the dialog should not go above the bottom of the session dropdown menu (approx 80px) during initial spawn or automatic vertical growth.
- Manual dragging should still allow the dialog to be moved anywhere within the viewport.
--- Tue Mar 10 14:15:00 PDT 2026 ---
Analysis: Currently, all clamping (initial, auto-growth, and dragging) uses a 10px top margin. We need to bifurcate this logic: use a larger margin (e.g., 80px) for computer-controlled positioning and keep the tighter margin (10px) for user-controlled dragging.
improvement: remove auto-centering/zoom-in for squash groups.
- Clicking a squash pill should open the sidebar but not trigger an auto-fit/zoom.
- Clicking a turn in the sidebar should open the dialog but not trigger an auto-fit/zoom.
- This prevents disorienting layout shifts as the graph re-squashes during interaction.
--- Tue Mar 10 14:30:00 PDT 2026 ---
bugfix: when a session is deleted or switched, the new session's root node positioning is incorrect.
--- Tue Mar 10 15:00:00 PDT 2026 ---
Analysis: `Canvas.tsx` uses an `initialised` ref to run the "Auto-fit on first render" logic exactly once. However, this ref persists even when the underlying session changes (e.g., via deletion or switching). Consequently, the auto-centering logic for the new session's `root` node never runs.
Plan: Reset the `initialised` ref whenever the current session ID changes. This ensures that every time a new graph is loaded, the `root` node is correctly framed in the lower third of the viewport.
bugfix: deleting a session should close the session dropdown menu.
--- Tue Mar 10 15:15:00 PDT 2026 ---
Analysis: The delete button in the session list doesn't trigger a state update to close the dropdown. When the active session is deleted, the store automatically switches to another session (or creates a new one), but the UI stays in its "menu open" state.
Plan: Add `setShowSessions(false)` to the delete button's click handler in `Toolbar.tsx`.
feature: Structured LLM API support with multi-vendor capability.
- Create a dedicated `src/lib/llm/` folder.
- Implement Gemini API support as the first provider.
- Use `gemini-3.1-flash-lite-preview` model for testing.
- Define a generic `LLMProvider` interface to ensure future-proof enhancements.
- Support both standard and streaming messages.
--- Tue Mar 10 15:30:00 PDT 2026 ---
Analysis: The current single-file integration in `src/lib/llm.ts` is insufficient for a multi-vendor future. We need a provider-based architecture where each vendor (Gemini, Anthropic, OpenAI) implements a common interface. This allows the application to remain agnostic of the specific LLM being used.
feature: Implement Markdown support for assistant replies.
- Support line breaks, bold, italic, and other Markdown features.
- Use `react-markdown` for rendering.
- Apply custom styling to ensure Markdown elements fit well within chat bubbles.
- Update `MessageList.tsx` to handle both finished messages and streaming content.
--- Tue Mar 10 16:00:00 PDT 2026 ---
feature: add Latex support to both user message (auto render as typing) and assistant message.
- Use KaTeX for high-performance LaTeX rendering.
- Integrate `remark-math` and `rehype-katex` with `react-markdown`.
- Implement a "Live Preview" in the ChatDialog that renders the user's input as they type.
- Ensure assistant replies (including streaming) render LaTeX correctly.
--- Wed Mar 11 10:00:00 PDT 2026 ---
improvement: Make LaTeX live preview a floating overlay instead of a layout-changing box.
- The preview should only appear when the cursor is inside a LaTeX delimiter pair ($...$ or $$...$$).
- It should be positioned as a floating tooltip above the cursor/active input area.
- It should not change the overall dialog layout.
--- Wed Mar 11 10:15:00 PDT 2026 ---
Analysis: Currently, the preview is a static block above the textarea. To make it a floating overlay, we need:
1. Logic to detect if the cursor is within math delimiters.
2. A way to calculate the (x, y) coordinates of the cursor relative to the textarea or container.
3. A floating div that uses these coordinates for absolute positioning.
# Request: Enhanced Session Stats Panel

Convert the current legend box in the `Toolbar` component into a more useful "Session Stats" panel.

## Requirements:
- Display the number of turns in the current session.
- Display the total number of estimated tokens.
- Remove the static text explaining how to use the application (scroll, zoom, etc.).
- Add other relevant session-level metrics.
- Maintain the aesthetic of the existing floating panel.
# Request: Dynamic API Key Provisioning

Implement a mechanism for the user to provide an LLM API key if it's missing from the environment.

## Requirements:
- **Provisoning:** Prompt the user for the API key only when they try to send a message and no key is available.
- **Storage:** Store the provided API key in memory only (using a non-persistent Zustand store).
- **Security:** Do not persist the key to LocalStorage or IndexedDB.
- **User Experience:** Use a clean UI (e.g., a modal or inline prompt) within the ChatDialog or as a global overlay.
