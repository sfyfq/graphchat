# Request: Hybrid Auth & Cloudflare Proxy Implementation

Implement a hybrid access system where guests use a Mock LLM and whitelisted Google users use a real Gemini LLM via a secure Cloudflare Worker proxy.

## Requirements:
- **Guest Mode:** By default, the app uses a `MockLLMProvider` that simulates responses locally.
- **Authentication:** Add a "Sign In" button to the UI (Toolbar) using Google OAuth.
- **Persistence:** Persist the login state in LocalStorage (Zustand) so returning friends don't have to re-login.
- **Secure Proxy:** 
    - Create a `ProxyLLMProvider` that sends prompts + Google ID Token to a Cloudflare Worker.
    - The Worker verifies the token, checks an email whitelist, and uses a server-side Gemini API Key to fetch responses.
- **UX:** If a logged-in user is NOT on the whitelist, show a "Guest Only" notification and revert them to the Mock Provider.
