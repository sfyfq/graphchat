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

--- Mon Mar  9 17:21:24 PDT 2026 ---

## TODO: Fix Squash Logic and Expanded State

- [ ] **Execution Phase:**
    - [ ] **Modify `src/lib/squash.ts`:**
        - [ ] Update `collapsible` definition: Allow `assistant` nodes to be collapsible if strictly linear.
        - [ ] Set `MIN_SIZE = 1`.
        - [ ] Ensure that branch tips and fork points remain visible as landmarks.
    - [ ] **Modify `src/components/Canvas/CommitNode.tsx`:**
        - [ ] Add `isExpandedRep` and `onCollapse` props.
        - [ ] Render a small "collapse" icon/button if `isExpandedRep` is true.
    - [ ] **Modify `src/App.tsx`:**
        - [ ] Pass `isExpandedRep={expandedGroups.has(commit.id)}` to `CommitNode`.
        - [ ] Pass `onCollapse={() => toggleGroup(commit.id)}` to `CommitNode`.
        - [ ] Ensure `expandedGroups` is kept in sync with `allGroups`.
- [ ] **Validation:**
    - [ ] Inspect the canvas to ensure long linear conversations are squashed correctly.
    - [ ] Verify that an expanded group can be collapsed via a UI element.
    - [ ] Confirm that closing a dialog allows nodes to return to their squashed state if appropriate.
- [ ] **Approval & Merge:**
    - [ ] Present the fix to the user.
    - [ ] Upon approval, merge `bugfix/squash-logic` into `dev`.
- [ ] **Archive:**
    - [ ] Append methodology files to `history/` and remove locals.
# TODO: Visible Root Node Implementation

## Phase 1: Research & Validation
- [x] Identify where `root` is explicitly skipped in the codebase.
- [ ] Verify `src/lib/layout.ts` behavior for `root` node positioning.
- [ ] Confirm `root` node structure in `src/lib/seeds.ts`.

## Phase 2: Implementation

### Task 1: Store Initialization
- [ ] Modify `src/store/conversationStore.ts`:
    - Initialize `commits` with only the `root` entry.
    - Initialize `edges` as an empty array `[]`.
    - Set `HEAD` to `'root'`.

### Task 2: Canvas Rendering
- [ ] Modify `src/components/Canvas/CommitNode.tsx`:
    - Remove `if (commit.id === 'root') return null`.
    - Add logic to render a unique shape for `root` (e.g., Rounded Rect).
    - Update colors/icons if needed for the root node.
- [ ] Modify `src/components/Canvas/Canvas.tsx`:
    - Remove `if (commit.id === 'root') return null` in the `commits.map` loop.
    - Ensure edges from `root` are still rendered (they should be, but check `visibleEdges` logic).

### Task 3: Chat & UI Integration
- [ ] Modify `src/components/ChatDialog/ChatDialog.tsx`:
    - Update the message chain logic to include the `root` message.
- [ ] Check `src/components/Search/SearchPanel.tsx`:
    - Decide if `root` should be searchable (it probably should if it's the welcome message).
- [ ] Check `src/components/Toolbar/Toolbar.tsx`:
    - Update commit count logic to include `root` if it's now considered a real node.

## Phase 3: Validation
- [ ] Verify the root node is visible on startup.
- [ ] Verify the root node looks different.
- [ ] Verify clicking the root node opens the chat dialog with the welcome message.
- [ ] Verify adding a new message from the root node works as expected.
- [ ] Run lint/type-check.
# TODO: Refine Squash Logic

## Phase 1: Implementation

### Task 1: Update `src/lib/squash.ts`
- [ ] Set `MIN_SIZE = 3`.
- [ ] Modify `computeSquashGroups`:
    - [ ] Update the `collapsible` identification logic if necessary (though the core "1 parent, 1 child" rule still applies to nodes *inside* the group).
    - [ ] Update the `walkGroup` / run-growing logic to be more discerning.
    - [ ] Logic:
        1. Find a contiguous run of "strictly linear" nodes (1 parent, 1 child, not pinned).
        2. Identify the parent of the run and the child of the run.
        3. If parent is not 'assistant' or child is not 'assistant', this run cannot be squashed in its entirety.
        4. Trim the run to start and end with a 'user' node.
        5. Ensure the trimmed run has an odd length.
        6. Check if the resulting trimmed run's length is `>= MIN_SIZE`.
        7. If valid, create the `SquashGroup`.

## Phase 2: Validation
- [ ] Verify that created groups always have odd lengths (3, 5, 7...).
- [ ] Verify that the representative node (first node) is always a 'user' node.
- [ ] Verify that the node before the group is an 'assistant'.
- [ ] Verify that the node after the group is an 'assistant'.
- [ ] Run `npx tsc` to ensure no type regressions.
# TODO: Fix Squash Logic Root Exclusion Bug

## Phase 1: Implementation

### Task 1: Update `src/lib/squash.ts`
- [ ] Modify `computeSquashGroups`:
    - [ ] Locate the loop that populates the `candidates` set.
    - [ ] Change `if (!parents[id] || parents[id] === 'root') return` to `if (!parents[id]) return`.
    - [ ] This allows nodes connected to the root to be considered for squashing.

## Phase 2: Validation
- [ ] Verify the logic with the reported case: `root -> u1 -> a1 -> u2 -> a2 -> u3 -> a3`.
- [ ] Confirm that `[u1, a1, u2, a2, u3]` is correctly identified as a run and squashed.
- [ ] Run `npx tsc` to ensure no type regressions.
# TODO: Fix Sidebar Hover Overlay Bug

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Add `const [isHoveringCanvas, setIsHoveringCanvas] = useState(false)`.
- [ ] Update `handleNodeHover`:
    - Set `setIsHoveringCanvas(!!commitId)`.
- [ ] Update `SquashTooltip` usage:
    - Change `onTurnHover={setHoveredId}` to a wrapper that calls `setHoveredId(id)` and `setIsHoveringCanvas(false)`.
- [ ] Update `showTooltip` logic:
    - Change to `const showTooltip = hoveredCommit && !dialogs[hoveredId!] && isHoveringCanvas`.

## Phase 2: Validation
- [ ] Verify that hovering over a node on the canvas shows the tooltip.
- [ ] Verify that hovering over a turn in the sidebar highlights the node but **no tooltip** appears.
- [ ] Run `npx tsc` to ensure no type regressions.
# TODO: Refine Squash Expansion & Sidebar

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Modify `toggleGroup`:
    - If `isExpanding` is true, set `expandedGroups` to a new `Set([groupId])`.
    - This ensures only one group is expanded at a time.

### Task 2: Update `src/components/Canvas/SquashNode.tsx`
- [ ] Modify `SquashTooltip` container styles:
    - Add `maxHeight: 'calc(100vh - 240px)'`.
    - Add `overflowY: 'auto'`.
    - Ensure the "X" button and header are always visible or handle scrolling gracefully.

## Phase 2: Validation
- [ ] Verify that opening a new squash group closes the previous one.
- [ ] Verify that long squash groups in the sidebar can be scrolled.
- [ ] Verify that the sidebar does not cover the legend at the bottom left.
- [ ] Run `npx tsc`.
# TODO: Decouple Squash Hover and Expansion States

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Remove `activeSquashGroup` state.
- [ ] Add `const [hoveredSquashGroup, setHoveredSquashGroup] = useState<SquashGroup | null>(null)`.
- [ ] Add `const [expandedSquashGroup, setExpandedSquashGroup] = useState<SquashGroup | null>(null)`.
- [ ] Update `handleSquashHover`:
    - Only call `setHoveredSquashGroup(group)`.
- [ ] Update `toggleGroup`:
    - When expanding a group, call `setExpandedSquashGroup(allGroups.get(groupId))`.
    - When collapsing, call `setExpandedSquashGroup(null)`.
- [ ] Update `handleCollapseGroup`:
    - Call `setExpandedSquashGroup(null)`.
- [ ] Update `pinned` memo:
    - Use `expandedSquashGroup` instead of `activeSquashGroup`.
- [ ] Update rendering logic:
    - Render `SquashTooltip` for `expandedSquashGroup` (if exists).
    - Render `SquashTooltip` for `hoveredSquashGroup` if exists AND `hoveredSquashGroup.id !== expandedSquashGroup?.id`.

## Phase 2: Validation
- [ ] Expand a group (A). Sidebar shows A.
- [ ] Hover over another group (B). A temporary overlay shows B.
- [ ] Leave group B. Overlay disappears, sidebar still shows A.
- [ ] Hover over A. No redundant overlay appears (sidebar is enough).
- [ ] Run `npx tsc`.
# TODO: Enhance HEAD Commit Visibility

## Phase 1: Implementation

### Task 1: Update `src/components/Canvas/CommitNode.tsx`
- [ ] Define a "glow" filter in the SVG or use inline styles for shadow.
- [ ] Modify the rendering of `isHEAD`:
    - [ ] Add a `<g>` for the "HEAD" label positioned at `translate(0, -${NODE_R + 16})`.
    - [ ] Render a rounded rect and "HEAD" text inside this group.
    - [ ] Increase `strokeWidth` of the node body to `3` when `isHEAD`.
    - [ ] Update pulse rings to be slightly more opaque or have a wider range.

## Phase 2: Validation
- [ ] Verify the "HEAD" label appears above the active node.
- [ ] Verify the active node is significantly more prominent than others.
- [ ] Ensure the label is readable and fits within the node's bounds.
- [ ] Run `npx tsc`.
# TODO: Prevent Component Overlap

## Phase 1: Implementation

### Task 1: Update `src/lib/layout.ts`
- [ ] Increase `H_GAP` from `96` to `160`.
- [ ] (Optional) Slightly increase `V_GAP` if needed for vertical breathing room (e.g., to `140`).

## Phase 2: Validation
- [ ] Verify that branches are spaced further apart horizontally.
- [ ] Verify that adjacent squash pills no longer overlap.
- [ ] Run `npx tsc`.
# TODO: Double Chat Dialog Width

## Phase 1: Implementation

### Task 1: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Change `width` from `430` to `860`.
- [ ] Update drag boundary: `window.innerWidth - 440` -> `window.innerWidth - 870`.

### Task 2: Update `src/App.tsx`
- [ ] Update spawn boundary: `window.innerWidth - 450` -> `window.innerWidth - 880`.

## Phase 2: Validation
- [ ] Verify dialog is wider.
- [ ] Verify dragging still respects screen edges correctly.
- [ ] Verify new dialogs spawn within visible bounds.
- [ ] Run `npx tsc`.
# TODO: Defer Squash Expansion

## Phase 1: Implementation

### Task 1: Refactor `src/App.tsx`
- [ ] Remove `expandedGroupIds` calculation.
- [ ] Update `Canvas` prop: `expandedGroups={new Set()}` (for now, or remove if unused).
- [ ] Update `toggleGroup` centering:
    - If expanding, center on `[groupId, group.parentId, group.childId]`.
- [ ] Update `handleSidebarTurnClick`:
    - Add `window.dispatchEvent(new CustomEvent('graphchat:fit-nodes', { detail: [commit.id] }))`.

## Phase 2: Validation
- [ ] Verify clicking a pill opens the sidebar but the pill remains a pill on the canvas.
- [ ] Verify clicking a turn in the sidebar opens a dialog and that specific node appears on the canvas.
- [ ] Verify the view centers on the selected node.
- [ ] Run `npx tsc`.
# TODO: Close Sidebar on Turn Click

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Modify `handleSidebarTurnClick`:
    - Add `setExpandedSquashGroup(null)`.

## Phase 2: Validation
- [ ] Expand a group.
- [ ] Click a turn in the sidebar.
- [ ] Verify the sidebar closes immediately.
- [ ] Verify the corresponding dialog opens and the node is revealed on canvas.
- [ ] Run `npx tsc`.
# TODO: Atomic Streaming Turns & User-Node Drafts

## Phase 1: Library & Store Updates
- [ ] Update `src/lib/anthropic.ts` to support streaming (dummy implementation if no real key, but structure for SSE).
- [ ] Ensure `conversationStore.ts` can handle rapid sequential `addCommit` calls or add a `addTurn(user, assistant)` action.

## Phase 2: App Interaction Refactor
- [ ] Modify `App.tsx` state to support passing initial input to `ChatDialog`.
- [ ] Update `handleNodeClick` logic:
    - User node -> move HEAD back, fill input.
    - Assistant node -> move HEAD forward, clear input.

## Phase 3: ChatDialog Refactor
- [ ] Implement `streamingContent` display in `MessageList` or `ChatDialog`.
- [ ] Refactor `handleSend` to be transactional:
    - Hold User commit in memory.
    - Stream Assistant response into local state.
    - Success -> Dispatch both to store.
    - Failure -> Revert UI, keep input.

## Phase 4: Validation
- [ ] Verify `HEAD` is never a User node after a turn.
- [ ] Verify clicking a User node acts as an "Edit" function.
- [ ] Verify streaming text appears in real-time.
- [ ] Verify graph doesn't update if the API call fails.
- [ ] Run `npx tsc`.
# TODO: Fix User-Node Message List Inclusion

## Phase 1: Implementation

### Task 1: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Refactor `tipId` initialization:
    - Use `const [tipId, setTipId] = useState(commit.role === 'user' && commit.parentId ? commit.parentId : commit.id);`

## Phase 2: Validation
- [ ] Click a User node.
- [ ] Verify the User message is in the input box.
- [ ] Verify the User message is **not** the last message in the chat history list.
- [ ] Run `npx tsc`.
# TODO: Rebrand to GraphChat

## Phase 1: Global Renaming
- [ ] Replace "gitchat" with "graphchat" in:
    - [ ] `package.json`
    - [ ] `index.html`
    - [ ] `README.md`
    - [ ] `src/App.tsx`
    - [ ] `src/components/Canvas/Canvas.tsx`
    - [ ] `src/components/Toolbar/Toolbar.tsx`
    - [ ] `history/PROMPTS.md`
    - [ ] `history/TODO.md`
- [ ] Replace "GitChat" with "GraphChat" in:
    - [ ] `index.html`
    - [ ] `README.md`
    - [ ] `src/components/Toolbar/Toolbar.tsx`

## Phase 2: License Creation
- [ ] Create `LICENSE` file with MIT text.

## Phase 3: Validation
- [ ] Run `npm install` to update `package-lock.json`.
- [ ] Run `npx tsc`.
- [ ] Verify branding in UI (Toolbar logo).
# TODO: Center and Dynamically Resize Chat Dialogs

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Refactor `handleNodeClick` initial position logic:
    - Calculate `centeredX` and `centeredY`.
    - Use `860` for width and `400` as a placeholder for initial height.
    - Update the `clamp` boundaries for spawning.

### Task 2: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Update `maxHeight` in the style object to `min(85vh, 900px)`.
- [ ] Ensure the container correctly grows with content (verify `flex` and `overflow` interaction).
- [ ] Update `onMove` drag clamping to use the new width and a safer height boundary.

## Phase 2: Validation
- [ ] Open a new dialog and verify it starts in the center of the screen.
- [ ] Send multiple messages and verify the dialog height increases automatically.
- [ ] Verify it stops growing at the `maxHeight` limit and starts scrolling.
- [ ] Drag the dialog and verify it stays within screen bounds.
- [ ] Run `npx tsc`.
# TODO: Fix Initial Dialog Positioning

## Phase 1: Implementation

### Task 1: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Refactor `ResizeObserver` callback:
    - If `oldHeight === 0`:
        - Calculate if bottom exceeds bounds: `pos.y + newHeight > window.innerHeight - 10`.
        - If so, update `pos.y` to `window.innerHeight - newHeight - 10` (clamped to min 10).
    - Else (standard delta centering):
        - Continue using the existing `delta / 2` logic.

## Phase 2: Validation
- [ ] Open an existing node with many turns.
- [ ] Verify the dialog is fully within the viewport immediately.
- [ ] Verify a new dialog still opens in the center.
- [ ] Run `npx tsc`.
# TODO: Enhance Initial Experience

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Initialize `dialogs` state with root node data.
- [ ] Ensure `commits['root']` availability or handle initial loading gracefully.

### Task 2: Update `src/components/Canvas/Canvas.tsx`
- [ ] Refactor initial auto-fit `useEffect`:
    - Find `root` position in `layout`.
    - Calculate `pan` such that `root.x` is horizontal center and `root.y` is at 70% vertical.

## Phase 2: Validation
- [ ] Refresh the page.
- [ ] Verify the root dialog is open and centered.
- [ ] Verify the root node is visible on the canvas, positioned in the lower third.
- [ ] Run `npx tsc`.
# TODO: Multi-Session & Persistence Implementation

## Phase 1: Types & Library Setup
- [ ] Update `src/types.ts` with `ChatSession` and `Attachment`.
- [ ] (Done) Install `idb-keyval`.

## Phase 2: Store Refactoring
- [ ] Update `conversationStore.ts`:
    - Implement `State` and `Actions`.
    - Setup `persist` with `idb-keyval`.
    - Create initialization logic (ensure 1 session exists).
    - Update graph actions to be session-aware.

## Phase 3: UI Implementation
- [ ] Refactor `src/components/Toolbar/Toolbar.tsx`:
    - Add Session Switcher UI next to logo.
    - Add "New Session" button.
- [ ] Update `src/App.tsx`:
    - Listen for session changes and reset local UI state (dialogs, etc).

## Phase 4: Validation
- [ ] Create a session, chat, then refresh. Data should persist.
- [ ] Create a second session. Switch between them.
- [ ] Verify automatic session naming on the first turn.
- [ ] Run `npx tsc`.
# TODO: Adjust Dialog Top Clamping

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] In `handleNodeClick`, change `y` clamping:
    - `clamp(..., 10, ...)` -> `clamp(..., 80, ...)`

### Task 2: Update `src/components/ChatDialog/ChatDialog.tsx`
- [ ] Define `SAFE_TOP = 80`.
- [ ] In `ResizeObserver` (auto-centering logic):
    - Change `Math.max(10, ...)` -> `Math.max(SAFE_TOP, ...)`.
- [ ] In `onMove` (drag logic):
    - Ensure it still uses `10` or `0` for the top clamp.

## Phase 2: Validation
- [ ] Open a new dialog. Verify it spawns at or below 80px from the top.
- [ ] Add messages until it grows. Verify the top edge doesn't cross the 80px line.
- [ ] Drag the dialog to the very top of the screen (10px). Verify this is still allowed.
- [ ] Run `npx tsc`.
# TODO: Stable Navigation - Remove Auto-Zoom

## Phase 1: Implementation

### Task 1: Update `src/App.tsx`
- [ ] Refactor `toggleGroup`:
    - Remove the `isExpanding` block that dispatches `graphchat:fit-nodes`.
- [ ] Refactor `handleSidebarTurnClick`:
    - Remove the `setTimeout` block that dispatches `graphchat:fit-nodes`.

## Phase 2: Validation
- [ ] Expand a squash group. Verify the canvas does not move.
- [ ] Click a turn in the sidebar. Verify the dialog opens but the canvas stays at its current zoom/pan.
- [ ] Verify manual zoom and pan still work correctly.
- [ ] Run `npx tsc`.
# TODO: Fix Session Reset Auto-Fit

## Phase 1: Implementation

### Task 1: Update `src/components/Canvas/Canvas.tsx`
- [ ] Add a `useEffect` to reset `initialised.current = false` when `currentSession.id` changes.

## Phase 2: Validation
- [ ] Create multiple sessions.
- [ ] Delete the current session.
- [ ] Verify the new active session's root node is correctly positioned in the bottom 1/3.
- [ ] Switch between sessions and verify consistent framing.
- [ ] Run `npx tsc`.
 Here is the updated code:
# TODO: Fix Session Reset Auto-Fit

## Phase 1: Implementation

### Task 1: Update `src/components/Canvas/Canvas.tsx`
- [ ] Add a `useEffect` to reset `initialised.current = false` when `currentSession.id` changes.

## Phase 2: Validation
- [ ] Create multiple sessions.
- [ ] Delete the current session.
- [ ] Verify the new active session's root node is correctly positioned in the bottom 1/3.
- [ ] Switch between sessions and verify consistent framing.
- [ ] Run `npx tsc`.
# TODO: LLM Provider Refactor

## Phase 1: Directory Structure & Types
- [ ] Create `src/lib/llm/` directory.
- [ ] Implement `src/lib/llm/types.ts`:
    - Define `LLMMessage` (reusing/refining from `context.ts`).
    - Define `LLMProvider` interface.

## Phase 2: Provider Implementation
- [ ] Implement `src/lib/llm/gemini.ts`:
    - Use `@google/generative-ai`.
    - Model: `gemini-3.1-flash-lite-preview`.
    - Implement `sendMessage` and `streamMessage`.
- [ ] Implement `src/lib/llm/index.ts`:
    - Export active provider instance.

## Phase 3: App Integration
- [ ] Update `src/components/ChatDialog/ChatDialog.tsx` to use the new module.
- [ ] (Optional) Move `reconstructMessages` and `estimateTokens` from `context.ts` to `llm/utils.ts` if it makes sense.

## Phase 4: Validation
- [ ] Remove old `src/lib/llm.ts`.
- [ ] Verify streaming works with the new Gemini model.
- [ ] Run `npx tsc`.
---
# TODO: Implement Markdown Support

## Phase 1: Setup
- [ ] Install `react-markdown` and `remark-gfm`.

## Phase 2: Implementation
- [ ] Update `src/components/ChatDialog/MessageList.tsx`:
    - [ ] Import `ReactMarkdown` and `remarkGfm`.
    - [ ] Define custom components for `ReactMarkdown` to handle styling (remove default margins).
    - [ ] Apply `ReactMarkdown` to message content and `streamingContent`.

## Phase 3: Validation
- [ ] Verify line breaks are rendered correctly.
- [ ] Verify **bold** and *italic* formatting works.
- [ ] Verify lists and other Markdown features work.
- [ ] Ensure the scrolling still works correctly with Markdown content.
- [ ] Run `npx tsc`.
# TODO: Implement LaTeX Support

## Phase 1: Implementation - Message History
- [ ] Update `src/components/ChatDialog/MessageList.tsx`:
    - [ ] Import `remarkMath` and `rehypeKatex`.
    - [ ] Import `katex/dist/katex.min.css`.
    - [ ] Update `ReactMarkdown` props to include `remarkMath` and `rehypeKatex`.

## Phase 2: Implementation - Live Preview
- [ ] Update `src/components/ChatDialog/ChatDialog.tsx`:
    - [ ] Import `ReactMarkdown`, `remarkMath`, `rehypeKatex`.
    - [ ] Add a `Preview` area inside the dialog, just above the input zone.
    - [ ] Render `input` in this area using the Markdown/KaTeX setup.
    - [ ] Style the preview area for clarity.

## Phase 3: Validation
- [ ] Type `$x^2$` in the input. Verify it renders as a mathematical formula in the preview.
- [ ] Send a message with LaTeX. Verify the assistant response (if it contains LaTeX) renders correctly.
- [ ] Verify both inline `$math$` and block `$$math$$` notation work.
- [ ] Run `npx tsc`.
# TODO: LaTeX Overlay Preview

## Phase 1: Math Detection Logic
- [ ] Implement `getMathAtCursor(text, position)` helper function.
- [ ] Add `activeMath` state to `ChatDialog`.
- [ ] Update `handleInputChange` and `onKeyUp` to set `activeMath`.

## Phase 2: Overlay UI
- [ ] Create an absolutely positioned `MathPreviewOverlay` component (or inline div).
- [ ] Style it as a floating bubble above the textarea.
- [ ] Remove the old static `Live Preview` block.

## Phase 3: Validation
- [ ] Verify the overlay appears only when the cursor is inside `$ $`.
- [ ] Verify the overlay content updates as you type.
- [ ] Verify the dialog layout remains stable.
- [ ] Run `npx tsc`.
# TODO: Session Stats & Attachment Library

- [x] **Phase 1: Foundation (Data & Storage)**
    - [x] Update `src/types.ts` with new metadata fields and relationship.
    - [x] Create `src/lib/storage.ts` for Blob management.
    - [x] Update `src/lib/utils.ts` with the new token estimation logic.

- [x] **Phase 2: State (Store Refactor)**
    - [x] Add `library` to `useConversationStore`.
    - [x] Refactor `addCommit` / `addTurn` actions for attachment IDs.
    - [x] Create `uploadAttachment` action with metadata extraction (Promise-based).

- [x] **Phase 3: UI (Stats & Toolbar)**
    - [x] Implement `Toolbar.tsx` with dynamic stats calculations.
    - [x] Add `useMemo` hooks for calculating Tokens, Depth, and Nodes.

- [x] **Phase 4: Sidebar (Library)**
    - [x] Create `src/components/Library/LibrarySidebar.tsx`.
    - [x] Integrate Sidebar button into the `Toolbar` (top-right).
    - [x] Add image thumbnail previews using the blob storage.
# TODO: Dynamic API Key Provisioning

- [x] **Phase 1: Foundation & State**
    - [x] Create `src/store/configStore.ts` for in-memory settings.
    - [x] Refactor `src/lib/llm/gemini.ts` to use dynamic key resolution from the store.

- [x] **Phase 2: UI (Modal)**
    - [x] Create `src/components/Modals/ApiKeyModal.tsx` with styling consistent with current UI.
    - [x] Add basic validation logic.
    - [x] Mount the modal in `src/App.tsx`.

- [x] **Phase 3: Integration & Error Handling**
    - [x] Update `src/components/ChatDialog/ChatDialog.tsx` to check for key before sending.
    - [x] Implement retry/modal trigger logic in the `catch` block of `handleSend`.
    - [x] Add specific error detection for "Invalid API Key" responses.
# TODO: Fix Branch Counting

- [ ] **Bugfix: Topological Branch Counting**
    - [ ] Modify `src/components/Toolbar/Toolbar.tsx`.
    - [ ] Implement leaf-node detection logic in `useMemo`.
    - [ ] Verify the branch count accurately reflects the graph paths.
# TODO: Fix ChatDialog Enter to Send

- [ ] **Bugfix: Restore onKeyDown Prop**
    - [ ] Modify `src/components/ChatDialog/ChatDialog.tsx`.
    - [ ] Add `onKeyDown={handleKeyDown}` to the `textarea`.
    - [ ] Verify `handleKeyDown` logic for Enter vs Shift+Enter.
# TODO: Dialog Minimization Sidebar

- [x] **Phase 1: Component Refactor (ChatDialog)**
    - [x] Update `ChatDialog.tsx` to include a minimize button.
    - [x] Implement `handleMinimize` logic to capture current state and most recent content.

- [x] **Phase 2: UI (Minimized Sidebar)**
    - [x] Create `src/components/Canvas/MinimizedSidebar.tsx`.
    - [x] Design the floating items with branch color indicators.
    - [x] Implement the hover tooltip for message summaries.

- [x] **Phase 3: State & Integration (App.tsx)**
    - [x] Add `minimizedDialogs` state to `App.tsx`.
    - [x] Implement `handleMinimize` and `handleRestore` actions.
    - [x] Add the 5-item limit validation.
    - [x] Integrate the sidebar into the main layout.
# TODO: Dialog Minimization Sidebar

- [x] **Phase 1: Component Refactor (ChatDialog)**
    - [x] Update `ChatDialog.tsx` to include a minimize button.
    - [x] Implement `handleMinimize` logic to capture current state and latest content.

- [x] **Phase 2: UI (Minimized Sidebar)**
    - [x] Create `src/components/Canvas/MinimizedSidebar.tsx`.
    - [x] Implement hover summaries and branch color indicators.

- [x] **Phase 3: State & Integration (App.tsx)**
    - [x] Add `minimizedDialogs` state to `App.tsx`.
    - [x] Implement `handleMinimize` and `handleRestore` actions.
    - [x] Integrate the sidebar and add CSS animations.
# TODO: UI Improvement - Pending User Message

- [x] **Phase 1: ChatDialog State Update**
    - [x] Add `pendingUserContent` state to `ChatDialog.tsx`.
    - [x] Update `handleSend` to set and clear this state correctly.

- [x] **Phase 2: MessageList Component Update**
    - [x] Add `pendingUserContent` prop to `MessageList.tsx`.
    - [x] Implement rendering logic for the uncommitted user message.
    - [x] Ensure smooth scrolling includes the pending message.
# TODO: Fix Minimized Dialog Tracking

- [x] **Phase 1: ChatDialog Logic Update**
    - [x] Modify `handleMinimize` in `ChatDialog.tsx` to use `tipId`.

- [x] **Phase 2: App.tsx State Update**
    - [x] Update `handleMinimize` in `App.tsx` to correctly key the minimized state by `tipId`.
    - [x] Ensure the old `commit.id` key is removed from active `dialogs`.
    - [x] Verify `handleRestore` uses the correct key.
# TODO: Hybrid Auth & Cloudflare Proxy

- [x] **Phase 1: Foundation (Auth Store)**
    - [x] Create `src/store/authStore.ts`.
    - [x] Install `@react-oauth/google` and `jwt-decode`.
    - [x] Wrap `main.tsx` with `GoogleOAuthProvider`.

- [x] **Phase 2: LLM Providers Refactor**
    - [x] Implement `src/lib/llm/MockProvider.ts`.
    - [x] Implement `src/lib/llm/ProxyProvider.ts` (using fetch to Worker).
    - [x] Update `src/lib/llm/index.ts` to switch providers dynamically.

- [x] **Phase 3: UI Integration**
    - [x] Add Google Login to `Toolbar.tsx`.
    - [x] Add Profile Menu (Avatar + Sign Out) to `Toolbar.tsx`.
    - [x] Add "Whitelisted" validation call to Worker on login.

- [x] **Phase 4: Backend Setup**
    - [x] Create `worker/index.ts` template for Cloudflare Workers.
    - [x] Document environment variables needed for Worker (GEMINI_KEY, ALLOWED_EMAILS).
# TODO: Cloudflare Worker Deployment Setup

- [x] **Phase 1: Configuration**
    - [x] Create `worker/wrangler.json`.
    - [x] Set `compatibility_date` to current.

- [x] **Phase 2: Documentation**
    - [x] Create `worker/README.md` with step-by-step deployment guide.
    - [x] Include detailed instructions for secret management.
# TODO: Fix LLM Provider Selection

- [x] **Phase 1: Logic Refactor (index.ts)**
    - [x] Update `src/lib/llm/index.ts` with correct priority logic (Local Key > Proxy > Mock).

- [x] **Phase 2: Error Handling (ProxyProvider)**
    - [x] Update `src/lib/llm/ProxyProvider.ts` to handle 401 status.

- [x] **Phase 3: UX Refinement (Toolbar)**
    - [x] Add a `isValidating` state to `Toolbar.tsx` to show a loading indicator during whitelist check.
    - [x] Ensure `validateToken` is triggered correctly.
# TODO: Remove Mock Mode Trap

- [x] **Phase 1: Logic Refactor (index.ts)**
    - [x] Remove `isWhitelisted` requirement from `llm` provider selection.
    - [x] Direct all authenticated users (with `idToken`) to `proxyProvider`.

- [x] **Phase 2: Self-Healing Whitelist (ProxyProvider)**
    - [x] Update `ProxyProvider.ts` to call `setWhitelisted(true)` on successful 200 responses.
    - [x] Verify both `sendMessage` and `streamMessage` handle this.
# TODO: Fix Cloudflare Worker CORS

- [x] **Bugfix: Dynamic CORS Handling**
    - [x] Update `worker/index.ts` with a dynamic origin whitelist.
    - [x] Handle `OPTIONS` preflight requests correctly.
    - [x] Add CORS headers to all response types (json, text, event-stream).
    - [x] Verify that `localhost` is allowed.
# TODO: Fix Assistant Message Formatting

- [x] **Bugfix: Robust Stream Parsing in Worker**
    - [x] Modify `worker/index.ts`.
    - [x] Replace the simplified regex parser with a robust JSON object extractor.
    - [x] Ensure `JSON.parse` is used to unescape text content.
    - [x] Verify that newlines and Markdown syntax are preserved in the frontend.
# TODO: Fix Cloudflare Pages Build Conflict

- [x] **Phase 1: Rename Configuration**
    - [x] Rename `worker/wrangler.json` to `worker/wrangler.proxy.json`.

- [x] **Phase 2: Update Documentation**
    - [x] Update `worker/README.md` with new `npx wrangler` commands using the `-c` flag.
    - [x] Verify that instructions are clear for manual deployment.



# TODO: Implementation Plan for Testing Framework

## Phase 1: Setup & Dependencies
- [x] Install devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `happy-dom`, `@vitest/coverage-v8`.
- [x] Create `vitest.setup.ts` to include `@testing-library/jest-dom`.
- [x] Modify `vite.config.ts` to include `test` configuration (environment, setup file).
- [x] Update `package.json` with `test`, `test:watch`, and `test:coverage` scripts.

## Phase 2: Frontend Tests
- [x] Implement `src/lib/squash.test.ts` for unit testing the complex squash logic.
- [x] Implement `src/components/Tooltip.test.tsx` for component testing.
- [x] (Optional) Add tests for `src/lib/utils.ts` or `src/lib/storage.ts`.

## Phase 3: Worker Tests
- [x] Install `@cloudflare/vitest-pool-workers` for idiomatic Cloudflare Worker testing.
- [x] Create `worker/vitest.config.ts` for the worker directory.
- [x] Implement `worker/index.test.ts` to test the proxy logic (mocking `fetch` and Gemini responses).

## Phase 4: Verification & Coverage
- [x] Run `npm test` to ensure all tests pass.
- [x] Run `npm run test:coverage` to verify coverage reporting.
- [x] Ask the user for feedback and finalize.

--- Wed Mar 11 20:27:47 PDT 2026 ---

