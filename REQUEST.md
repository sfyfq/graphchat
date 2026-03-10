bugfix: Gemini API error - First content should be with role 'user', got model.
--- Tue Mar 10 15:45:00 PDT 2026 ---
Analysis: Gemini's `startChat` history MUST begin with a 'user' message. Our `root` node is an 'assistant' message (the welcome message). This violates the API constraint.
Plan: 
1. Modify `reconstructMessages` in `src/lib/llm/utils.ts` to detect and extract the `root` assistant message if it's at the start of the chain.
2. In `src/lib/llm/gemini.ts`, use the content of the `root` node as the `systemInstruction` when initializing the model, rather than including it in the `history`.
3. This ensures the actual `history` array passed to `startChat` always starts with the first user message.
