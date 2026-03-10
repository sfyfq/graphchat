# TODO: LLM Provider Refactor

## Phase 1: Directory Structure & Types
- [ ] Create `src/lib/llm/` directory.
- [ ] Implement `src/lib/llm/types.ts`:
    - Define `LLMMessage` (reusing/refining from `context.ts`).
    - Define `LLMProvider` interface.

## Phase 2: Provider Implementation
- [ ] Implement `src/lib/llm/gemini.ts`:
    - Use `@google/generative-ai`.
    - Model: `gemini-3.1-flash-lite-preview`.
    - Implement `sendMessage` and `streamMessage`.
- [ ] Implement `src/lib/llm/index.ts`:
    - Export active provider instance.

## Phase 3: App Integration
- [ ] Update `src/components/ChatDialog/ChatDialog.tsx` to use the new module.
- [ ] (Optional) Move `reconstructMessages` and `estimateTokens` from `context.ts` to `llm/utils.ts` if it makes sense.

## Phase 4: Validation
- [ ] Remove old `src/lib/llm.ts`.
- [ ] Verify streaming works with the new Gemini model.
- [ ] Run `npx tsc`.
---
