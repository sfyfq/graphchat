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
