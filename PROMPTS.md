**Your Optimized Prompt:**
Implement "Atomic Streaming Turns" and "User-Node Draft" behavior. This refactor changes how the graph evolves and how users interact with history.

1.  **Interaction Refactor (`src/App.tsx`)**:
    - Update `handleNodeClick`: 
        - If `commit.role === 'assistant'`, set `HEAD` to `commit.id` and pass `""` as initial input to the dialog.
        - If `commit.role === 'user'`, set `HEAD` to `commit.parentId` (the assistant checkpoint) and pass `commit.content` as initial input to the dialog.

2.  **Streaming Support (`src/lib/anthropic.ts`)**:
    - Update the `sendMessage` function (or create `streamMessage`) to support SSE/Streaming.
    - Return an `AsyncIterable` or provide a callback for partial updates.

3.  **Transactional Logic (`src/components/ChatDialog/ChatDialog.tsx`)**:
    - Introduce `streamingContent` local state.
    - On `handleSend`:
        - Do NOT call `addCommit` for the user message yet.
        - Execute the streaming request.
        - Update `streamingContent` as chunks arrive.
        - Upon **successful completion**:
            - Generate a UUID for the User commit.
            - Generate a UUID for the Assistant commit.
            - Call `addCommit` for the User node (parent: current `HEAD`).
            - Call `addCommit` for the Assistant node (parent: new User node).
            - Set the new Assistant node as `HEAD`.
        - Upon **failure**:
            - Keep the user's text in the input area.
            - Show the error.
            - Graph remains unchanged.

**Key Improvements:**
• Enforces a "clean graph" philosophy where only successful, completed turns are recorded.
• Enables seamless "what-if" branching by editing previous turns.
• Provides modern streaming UX.

**Techniques Applied:** Transactional state management, Async streaming patterns.
