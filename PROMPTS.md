**Your Optimized Prompt:**
Refactor the LLM integration into a provider-based architecture.

1.  **Architecture**:
    - Create `src/lib/llm/` folder.
    - `src/lib/llm/types.ts`: Define `LLMProvider` interface with `sendMessage` and `streamMessage` methods.
    - `src/lib/llm/gemini.ts`: Implement `LLMProvider` for Google Gemini using `@google/generative-ai`.
    - `src/lib/llm/index.ts`: Export a default provider (currently Gemini).

2.  **Implementation Details**:
    - Use `gemini-3.1-flash-lite-preview` as the default model in `gemini.ts`.
    - Ensure `LLMProvider` methods accept the conversation history in a format that can be easily mapped to vendor-specific requirements.
    - Leave provisions for future features like `systemInstruction`, `safetySettings`, and `attachments`.

3.  **App Integration**:
    - Update `src/components/ChatDialog/ChatDialog.tsx` to import the streaming function from the new `src/lib/llm/index.ts`.

**Key Improvements:**
• Decouples the application logic from specific LLM vendors.
• Simplifies the process of adding new AI providers in the future.
• Centralizes LLM configuration and error handling.

**Techniques Applied:** Interface-based programming, Strategy pattern.
