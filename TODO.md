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
