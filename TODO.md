# TODO: Fix Gemini History Role Constraint

## Phase 1: Utils Refactor
- [ ] Update `src/lib/llm/utils.ts`:
    - Modify `reconstructMessages` to return `{ systemInstruction: string, history: LLMMessage[] }`.
    - Logic: if first node is assistant, set as `systemInstruction` and skip in `history`.

## Phase 2: Provider Refactor
- [ ] Update `src/lib/llm/gemini.ts`:
    - Update `sendMessage` and `streamMessage` to use the new object.
    - Pass `systemInstruction` to `getGenerativeModel`.

## Phase 3: ChatDialog Integration
- [ ] Update `src/components/ChatDialog/ChatDialog.tsx`:
    - Handle the new return type of `reconstructMessages` for token estimation and message sending.

## Phase 4: Validation
- [ ] Verify message sending works without the "role 'user'" error.
- [ ] Run `npx tsc`.
