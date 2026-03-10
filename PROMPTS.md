**Your Optimized Prompt:**
Implement a robust multi-session architecture with IndexedDB persistence.

1.  **Data Model (`src/types.ts`)**:
    - Define `ChatSession` containing `id`, `name`, `commits`, `edges`, `HEAD`, and `lastModified`.
    - Add optional `attachments` field to `Commit`.

2.  **Persistent Store (`src/store/conversationStore.ts`)**:
    - Refactor to use `sessions: Record<string, ChatSession>` and `currentSessionId: string`.
    - Integrate `persist` middleware with a custom storage engine using `idb-keyval`.
    - Implement `createSession`, `switchSession(id)`, `deleteSession(id)`, and `renameSession(id, name)`.
    - Update graph manipulation actions (`addTurn`, `addCommit`, `fork`) to update the currently active session.

3.  **UI Integration**:
    - **Toolbar**: Replace commit count with a "Session Selector" (dropdown) and a "New Chat" (+) button.
    - **App**: Clear `dialogs`, `hoveredId`, and `activeSquashGroup` states when `currentSessionId` changes.
    - **Naming**: Automatically name sessions based on the first assistant response summary.

**Key Improvements:**
• Enables users to manage multiple independent conversation threads.
• Future-proofs storage for high-volume data (attachments) using IndexedDB.
• Provides a professional, application-like workflow for session management.

**Techniques Applied:** Refactoring, persistent state patterns, asynchronous storage integration.
