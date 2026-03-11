# Request: Fix LLM Provider Selection & Mock Mode Trap

The application currently defaults to MOCK MODE even after sign-in because it strictly requires `isWhitelisted` to be true before even attempting the proxy.

## Requirements:
- **Priority Shift:** Prioritize `idToken` presence over `isWhitelisted` status in the provider selector.
- **Self-Healing:** Update `isWhitelisted` to true upon any successful 200 response from the Worker.
- **Robust Selection:**
    1. Local Key -> Gemini
    2. ID Token -> Proxy
    3. Else -> Mock
