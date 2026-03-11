# TODO: Fix LLM Provider Selection

- [x] **Phase 1: Logic Refactor (index.ts)**
    - [x] Update `src/lib/llm/index.ts` with correct priority logic (Local Key > Proxy > Mock).

- [x] **Phase 2: Error Handling (ProxyProvider)**
    - [x] Update `src/lib/llm/ProxyProvider.ts` to handle 401 status.

- [x] **Phase 3: UX Refinement (Toolbar)**
    - [x] Add a `isValidating` state to `Toolbar.tsx` to show a loading indicator during whitelist check.
    - [x] Ensure `validateToken` is triggered correctly.
