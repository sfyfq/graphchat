# Bugfix: Remove Mock Mode Trap

## Objective
Ensure that authenticated users are directed to the `proxyProvider` immediately upon login, bypassing the strict `isWhitelisted` check in the provider selector.

## 1. Provider Selection Refactor (`src/lib/llm/index.ts`)
- Simplify the priority logic:
    1. If `apiKey` (local) exists -> `geminiProvider`.
    2. Else if `idToken` exists -> `proxyProvider`.
    3. Else -> `mockProvider`.
- This ensures that as soon as `login()` is called and the `idToken` is set, the very next message will use the Proxy.

## 2. Proxy Provider Enhancement (`src/lib/llm/ProxyProvider.ts`)
- Ensure that a successful response (status 200) from the Worker automatically calls `setWhitelisted(true)`. This makes the whitelist status self-healing based on actual API success.
