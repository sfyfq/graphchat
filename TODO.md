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
