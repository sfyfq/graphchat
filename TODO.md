# TODO: UI Improvement - Pending User Message

- [x] **Phase 1: ChatDialog State Update**
    - [x] Add `pendingUserContent` state to `ChatDialog.tsx`.
    - [x] Update `handleSend` to set and clear this state correctly.

- [x] **Phase 2: MessageList Component Update**
    - [x] Add `pendingUserContent` prop to `MessageList.tsx`.
    - [x] Implement rendering logic for the uncommitted user message.
    - [x] Ensure smooth scrolling includes the pending message.
