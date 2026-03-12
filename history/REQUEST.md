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
# Request: Fix Branch Counting Logic

The "Session Stats" panel currently shows an incorrect number of branches (e.g., 1 instead of 3). This is because it only counts nodes with an explicit `branchLabel`.

## Requirements:
- Redefine "Branches" to reflect the actual number of active conversation paths in the graph.
- A branch should be defined as a **leaf node** (a node that has no outgoing edges/children).
- Ensure the logic works correctly for branched graphs where some paths are longer than others.
# Request: Fix ChatDialog Enter to Send

Pressing "Enter" in the `ChatDialog` textarea currently performs a carriage return instead of sending the message. This was likely introduced during the LaTeX preview implementation.

## Requirements:
- Pressing "Enter" (without Shift) should trigger the `handleSend` function.
- Pressing "Shift+Enter" should still perform a carriage return (new line).
- Ensure the behavior is consistent with standard chat application UX.
# Request: Dialog Minimization

Add the ability to minimize open chat dialogs to the right side of the viewport.

## Requirements:
- **Minimize Button:** Add a minimize button (next to close) in the `ChatDialog` header.
- **Capacity:** Limit the total number of minimized dialogs to **5**. If a 6th is added, prevent it or rotate the oldest out (user choice: prevent).
- **Minimized UI:** Display minimized dialogs as vertical pills or icons on the right edge of the screen.
- **Hover Summary:** Show the first few words or a summary of the last assistant message when hovering over a minimized item.
- **Restore:** Clicking a minimized item restores it to its previous position (or centers it).
# Request: Dialog Minimization Sidebar

Add the ability to minimize up to 5 chat dialogs into a vertical sidebar on the right side of the screen.

## Requirements:
- **Minimize Button:** Add a minimize button ("−") in the `ChatDialog` header.
- **Capacity:** Limit the total number of minimized dialogs to **5**.
- **Minimized UI:** Display minimized dialogs as vertical pills/icons on the right edge of the screen.
- **Hover Summary:** Show a summary of the most recent message (assistant or user) when hovering over a minimized icon.
- **Restore:** Clicking a minimized icon restores it to its previous position.
# Request: UI Improvement - Pending User Message

Improve the message-sending UX by showing the user's message immediately after sending, even while the assistant's reply is still streaming and before both messages are officially committed to the graph.

## Requirements:
- **Immediate Feedback:** When the user clicks "Send", their message should appear in the `MessageList` instantly.
- **Pending State:** This message should be treated as "pending" or "uncommitted" until the assistant finishes streaming.
- **Visual Consistency:** The pending user message should look identical to committed user messages.
- **Transactional Commit:** Both the user message and the assistant message should still be committed together once the streaming is complete.
# Request: Fix Minimized Dialog Tracking

Minimized dialogs currently track the original commit ID they were opened with, causing them to "revert" to an older conversation state when restored.

## Requirements:
- **Track Latest State:** When minimizing, use the `tipId` (the current head of the conversation in the dialog) instead of the original `commit.id`.
- **Restore Latest State:** Ensure that when a dialog is restored, it opens at the `tipId` that was active at the moment of minimization.
- **Content Persistence:** Preserve any uncommitted text in the input field.
# Request: Hybrid Auth & Cloudflare Proxy Implementation

Implement a hybrid access system where guests use a Mock LLM and whitelisted Google users use a real Gemini LLM via a secure Cloudflare Worker proxy.

## Requirements:
- **Guest Mode:** By default, the app uses a `MockLLMProvider` that simulates responses locally.
- **Authentication:** Add a "Sign In" button to the UI (Toolbar) using Google OAuth.
- **Persistence:** Persist the login state in LocalStorage (Zustand) so returning friends don't have to re-login.
- **Secure Proxy:** 
    - Create a `ProxyLLMProvider` that sends prompts + Google ID Token to a Cloudflare Worker.
    - The Worker verifies the token, checks an email whitelist, and uses a server-side Gemini API Key to fetch responses.
- **UX:** If a logged-in user is NOT on the whitelist, show a "Guest Only" notification and revert them to the Mock Provider.
# Request: Cloudflare Worker Configuration & Deployment

Configure and deploy the Cloudflare Worker for the GraphChat secure proxy.

## Requirements:
- **Configuration:** Create a `worker/wrangler.json` file.
- **Environment Secrets:** Provide instructions for setting `GEMINI_API_KEY`, `ALLOWED_EMAILS`, and `GOOGLE_CLIENT_ID` securely in Cloudflare.
- **Deployment Guide:** Step-by-step instructions for deploying the TypeScript worker using Wrangler.
# Request: Fix LLM Provider Selection & Mock Mode Trap

The application currently defaults to MOCK MODE even after sign-in if the whitelist validation hasn't completed or if a local API key is present but ignored.

## Requirements:
- **Prioritize Local Key:** If `useConfigStore.apiKey` is present, use `geminiProvider` (local mode) as the highest priority.
- **Graceful Transition:** If the user is logged in but `isWhitelisted` is not yet determined, wait or provide a better fallback than immediate mock mode.
- **Explicit Mode Selection:**
    1. If `VITE_LLM_API_KEY` (local) exists -> `geminiProvider`.
    2. If `idToken` exists AND `isWhitelisted` is true -> `proxyProvider`.
    3. Else -> `mockProvider`.
- **Bugfix:** Ensure that signing in actually triggers the switch to the real LLM once whitelisted.
# Request: Fix LLM Provider Selection & Mock Mode Trap

The application currently defaults to MOCK MODE even after sign-in because it strictly requires `isWhitelisted` to be true before even attempting the proxy.

## Requirements:
- **Priority Shift:** Prioritize `idToken` presence over `isWhitelisted` status in the provider selector.
- **Self-Healing:** Update `isWhitelisted` to true upon any successful 200 response from the Worker.
- **Robust Selection:**
    1. Local Key -> Gemini
    2. ID Token -> Proxy
    3. Else -> Mock
# Request: Fix Cloudflare Worker CORS for Localhost

The Cloudflare Worker proxy is currently blocking requests from `localhost` due to CORS policy, preventing local development and testing of the proxy provider.

## Requirements:
- **Dynamic CORS:** Update the Worker to allow requests from both the production domain and `localhost`.
- **Security:** Ensure that only authorized origins can access the proxy.
- **Preflight Support:** Correctly handle `OPTIONS` requests with appropriate headers.
# Request: Fix Assistant Message Formatting

Assistant messages received via the Cloudflare Worker proxy are not being formatted correctly (Markdown is broken).

## Requirements:
- **Robust Stream Parsing:** Refactor the Worker's stream processing to correctly decode Gemini's NDJSON output.
- **Unescape Content:** Ensure that JSON-escaped characters (like `\n`) are properly unescaped before being sent to the frontend.
- **Preserve Markdown:** Verify that the resulting text preserves all Markdown syntax for the frontend renderer.
# Request: Fix Cloudflare Pages Build Conflict

The Cloudflare Pages build is failing because it incorrectly identifies the repository as a Worker project due to the presence of `worker/wrangler.json`.

## Requirements:
- **De-conflict Build:** Rename `worker/wrangler.json` to something non-standard (e.g., `wrangler.proxy.json`) so the Pages builder ignores it.
- **Update Documentation:** Update `worker/README.md` to reflect the new config filename for manual deployment.
- **Verification:** Ensure the Worker can still be deployed manually with the new filename.



# Request: Add Testing Framework

As the app gets complicated, we need to have tests to prevent regression. Propose and implement a testing framework.

## Requirements:
- Propose a suitable framework for a Vite + React + TypeScript + Cloudflare Worker project.
- Configure the framework.
- Add example tests for:
    - A React component (e.g., `Tooltip` or `MessageList`).
    - A utility function (e.g., `src/lib/utils.ts` or `src/lib/squash.ts`).
    - The Cloudflare Worker (if possible).
- Integrate with `package.json` scripts.

--- Wed Mar 11 20:27:47 PDT 2026 ---


--- Wed Mar 11 21:02:40 PDT 2026 ---

# Request: Auth Status Modal Implementation

We need to provide more explicit feedback after authentication and whitelist validation through a modal dialog.

## Requirements:
- **Visibility:** A modal dialog that appears **only after the first login** in a session or after a manual login/validation event.
- **States & Messaging:**
    - **Friend Mode (Whitelisted):** "Welcome! Your account is whitelisted. You are now using the real Gemini LLM via our secure proxy."
    - **Guest Mode (Not Whitelisted):** "Logged in as [Email], but you are not currently on the whitelist. You will be using the Mock AI for now. (Mock AI provides simulated responses for testing purposes.)"
    - **Local Mode (Canary):** "Local API Key detected. Using your personal Gemini key."
- **Expiration:** If the user is logged in but the token has expired, prompt them to log in again.
- **Interaction:** A simple "Dismiss" button.
- **Consistency:** Use the app's existing aesthetic (dark theme, Syne/DM Sans fonts, rounded corners).

--- Wed Mar 11 21:34:28 PDT 2026 ---

# Request: Hashed KV Whitelist for Cloudflare Worker

Implement a privacy-preserving, dynamic whitelist using Cloudflare KV to store individual SHA-256 hashes of email addresses.

## Requirements:
- **Privacy:** Store SHA-256 hashes of normalized emails in the `WHITELIST_KV` namespace.
- **Individual Keys:** Each hash should be its own key in the KV store for efficient lookup.
- **Lookup Logic:**
    1. Receive verified email from Google Auth.
    2. Normalize (lowercase, trim).
    3. Compute SHA-256 hash using `crypto.subtle`.
    4. Perform a direct lookup in `WHITELIST_KV` using the hash as the key.
    5. **Fallback:** If not found in KV, check the legacy `ALLOWED_EMAILS` environment variable (raw text).
- **Configuration:** Update `wrangler.proxy.json` with the KV binding.
- **Helper Script:** Add a script to `package.json` to hash emails and generate management commands.
- **Testing:** Update worker tests to mock the KV lookup.

--- Wed Mar 11 22:31:15 PDT 2026 ---

# Request: Multi-User Data Isolation

Implement strict data isolation between different Google accounts stored in the same browser.

## Requirements:
- **Namespacing:** Prefix all IndexedDB keys with a unique identifier based on the authenticated user.
    - Logged in: `user:<google_sub>:...`
    - Guest: `guest:...`
- **Dynamic Switching:** When a user logs in or out, the application must immediately switch to the corresponding data store (re-hydrate sessions, commits, and library).
- **Blob Isolation:** Ensure that uploaded files (blobs) are also isolated by the same namespace to prevent cross-user access to the shared library.
- **Performance:** Switching users should be smooth and trigger a clean re-render of the UI.

--- Wed Mar 11 23:08:22 PDT 2026 ---

# Request: Complete Library/Attachment Functionality

Finish the implementation of the attachment system so users can actually use files in their conversations.

## Requirements:
- **Chat Input UI:**
    - Add a "Paperclip" icon to the `ChatDialog` input area.
    - Support uploading new files directly from the input.
    - Show a horizontal list of thumbnails for files currently attached to the pending message.
- **Validation:**
    - **File Size Check:** Prevent uploading or sending files larger than **10MB** to the LLM. Show a clear error message if a file is too large.
- **Message Rendering:**
    - Update `MessageList.tsx` to render attached images, audio, and video within the chat bubbles.
    - Show file metadata (name, size) for non-media files.
- **LLM Integration:**
    - Fetch raw blobs from IndexedDB and convert them to Base64.
    - Update the LLM payload construction to include these attachments as `inlineData` parts.
- **Consistency:** Maintain the dark, translucent aesthetic and high-performance feel.

--- Wed Mar 11 23:36:41 PDT 2026 ---


--- Wed Mar 11 23:40:28 PDT 2026 ---

# Request: Worker Payload Size Enforcement

Implement server-side enforcement of request size limits in the Cloudflare Worker to protect against memory exhaustion and large unauthorized transfers.

## Requirements:
- **Immediate Check:** Check the `Content-Length` header as the first step in the `fetch` handler.
- **Limit:** Set a maximum limit of **15MB** (to accommodate 10MB raw files + Base64 overhead).
- **Response:** Return a `413 Payload Too Large` response if the limit is exceeded.
- **Security:** Ensure the check happens before any authentication or data processing to minimize resource usage.
# Feature Request: Context Actions for Selected Text (Revised)

## User Intent
The user wants to add context actions to text selected from assistant messages. These actions help with quick lookups and focused follow-up questions.

## Goals
- Detect text selection within assistant messages.
- Display a floating menu with two primary actions:
    1.  **Explain (Quick lookup):** Create a new branch from the current message, send a prompt to explain the selected text succinctly, and show the response. "Ask and discard" pattern.
    2.  **Ask (Follow-up):** Focus the chat input and prepopulate it with the selected text to allow for a follow-up question in the current thread.

## Technical Considerations
- Capture selection in `MessageList.tsx`.
- Calculate floating menu position based on selection coordinates.
- "Explain" action requires programmatically triggering a message send on a new branch.
- "Ask" action requires communicating back to `ChatDialog.tsx` to update the input field.
