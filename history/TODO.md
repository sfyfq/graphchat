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
