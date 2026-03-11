# TODO: Remove Mock Mode Trap

- [x] **Phase 1: Logic Refactor (index.ts)**
    - [x] Remove `isWhitelisted` requirement from `llm` provider selection.
    - [x] Direct all authenticated users (with `idToken`) to `proxyProvider`.

- [x] **Phase 2: Self-Healing Whitelist (ProxyProvider)**
    - [x] Update `ProxyProvider.ts` to call `setWhitelisted(true)` on successful 200 responses.
    - [x] Verify both `sendMessage` and `streamMessage` handle this.
