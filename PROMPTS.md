**Your Optimized Prompt:**
Fix the "User-node message list" bug in `src/components/ChatDialog/ChatDialog.tsx`.

1.  **Requirement**:
    - If the `commit` prop passed to `ChatDialog` is a `user` node, the message list inside the dialog should stop at its **parent** (the assistant checkpoint).
    - The current `HEAD` (set in `App.tsx`) already correctly points to the parent assistant node, but the dialog was still using the clicked node as the tip of its message chain.

2.  **Implementation**:
    - In `ChatDialog.tsx`, update the initialization of the `tipId` state.
    - If `commit.role === 'user'`, set `tipId` to `commit.parentId` (if available).
    - Otherwise, use `commit.id`.

**Key Improvements:**
• Restores logical consistency: the message list shows the "history," and the input field shows the "draft."
• Prevents the confusing UI where a message appears both in the chat history and in the editable input box simultaneously.

**Techniques Applied:** State initialization refinement.
