# Request: Fix LLM Provider Selection & Mock Mode Trap

The application currently defaults to MOCK MODE even after sign-in if the whitelist validation hasn't completed or if a local API key is present but ignored.

## Requirements:
- **Prioritize Local Key:** If `useConfigStore.apiKey` is present, use `geminiProvider` (local mode) as the highest priority.
- **Graceful Transition:** If the user is logged in but `isWhitelisted` is not yet determined, wait or provide a better fallback than immediate mock mode.
- **Explicit Mode Selection:**
    1. If `VITE_LLM_API_KEY` (local) exists -> `geminiProvider`.
    2. If `idToken` exists AND `isWhitelisted` is true -> `proxyProvider`.
    3. Else -> `mockProvider`.
- **Bugfix:** Ensure that signing in actually triggers the switch to the real LLM once whitelisted.
