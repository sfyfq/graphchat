# Bugfix: LLM Provider Selection Priority

## Objective
Correct the dynamic `llm` provider selection logic to prioritize local API keys and ensure authenticated users can access the real model once validated.

## 1. Provider Logic Update (`src/lib/llm/index.ts`)
- Update the `llm` wrapper to check states in this order:
    1. If `useConfigStore.getState().apiKey` exists -> Use `geminiProvider`.
    2. Else if `useAuthStore.getState().idToken` exists AND `isWhitelisted` is true -> Use `proxyProvider`.
    3. Else -> Use `mockProvider`.

## 2. Whitelist Validation UX (`src/components/Toolbar/Toolbar.tsx`)
- Ensure that `validateToken` is called immediately upon `login`. (Already there, but verify).
- Update the "Guest Mode" indicator to be clearer if a validation is in progress.

## 3. Proxy Provider Robustness (`src/lib/llm/ProxyProvider.ts`)
- Add handling for 401 Unauthorized (invalid/expired token) by clearing the `idToken` and `isWhitelisted` status in `authStore`.
