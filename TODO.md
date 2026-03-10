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
