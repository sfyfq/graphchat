# TODO: Hybrid Auth & Cloudflare Proxy

- [x] **Phase 1: Foundation (Auth Store)**
    - [x] Create `src/store/authStore.ts`.
    - [x] Install `@react-oauth/google` and `jwt-decode`.
    - [x] Wrap `main.tsx` with `GoogleOAuthProvider`.

- [x] **Phase 2: LLM Providers Refactor**
    - [x] Implement `src/lib/llm/MockProvider.ts`.
    - [x] Implement `src/lib/llm/ProxyProvider.ts` (using fetch to Worker).
    - [x] Update `src/lib/llm/index.ts` to switch providers dynamically.

- [x] **Phase 3: UI Integration**
    - [x] Add Google Login to `Toolbar.tsx`.
    - [x] Add Profile Menu (Avatar + Sign Out) to `Toolbar.tsx`.
    - [x] Add "Whitelisted" validation call to Worker on login.

- [x] **Phase 4: Backend Setup**
    - [x] Create `worker/index.ts` template for Cloudflare Workers.
    - [x] Document environment variables needed for Worker (GEMINI_KEY, ALLOWED_EMAILS).
