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
