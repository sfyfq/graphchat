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
