**Your Optimized Prompt:**
Fix the Gemini "role 'user'" error by shifting the initial assistant root message to the `systemInstruction`.

1.  **Refactor `src/lib/llm/utils.ts`**:
    - Update `reconstructMessages` to return an object: `{ systemInstruction: string, history: LLMMessage[] }`.
    - If the first node in the chronological chain is the `root` node (assistant), extract its content as `systemInstruction`.
    - Ensure the `history` array only contains subsequent nodes, starting with the first `user` node.

2.  **Refactor `src/lib/llm/gemini.ts`**:
    - Update `sendMessage` and `streamMessage` to handle the new return object from `reconstructMessages`.
    - Pass the `systemInstruction` when calling `genAI.getGenerativeModel`.
    - Pass the filtered `history` to `model.startChat`.

3.  **App Integration**:
    - Update `src/components/ChatDialog/ChatDialog.tsx` if needed to accommodate the change in `reconstructMessages` (it currently uses it for token estimation).

**Key Improvements:**
• Resolves the Gemini API constraint while preserving the context of the welcome message.
• Aligns with LLM best practices for system instructions.

**Techniques Applied:** API constraint adaptation, data structure refinement.
