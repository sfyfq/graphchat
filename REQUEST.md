feature: Structured LLM API support with multi-vendor capability.
- Create a dedicated `src/lib/llm/` folder.
- Implement Gemini API support as the first provider.
- Use `gemini-3.1-flash-lite-preview` model for testing.
- Define a generic `LLMProvider` interface to ensure future-proof enhancements.
- Support both standard and streaming messages.
--- Tue Mar 10 15:30:00 PDT 2026 ---
Analysis: The current single-file integration in `src/lib/llm.ts` is insufficient for a multi-vendor future. We need a provider-based architecture where each vendor (Gemini, Anthropic, OpenAI) implements a common interface. This allows the application to remain agnostic of the specific LLM being used.
