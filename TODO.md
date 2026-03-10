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
