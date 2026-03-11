# Feature: Hybrid Auth & Cloudflare LLM Proxy

## Objective
Implement a multi-layered access system using Google OAuth and a Cloudflare Worker proxy to provide "Guest Mode" (Mock AI) and "Friend Mode" (Real AI).

## 1. Authentication State (`src/store/authStore.ts`)
- Create a persistent Zustand store (`auth-storage`).
- **State:** `user: GoogleProfile | null`, `idToken: string | null`, `isWhitelisted: boolean`.
- **Actions:** `login(profile, token)`, `logout()`, `setWhitelisted(status)`.

## 2. LLM Provider Refactor (`src/lib/llm/`)
- **`MockProvider.ts`:** Implements `LLMProvider`. Generates fake streaming text (e.g., "I am a guest-mode AI. Sign in to access Gemini...").
- **`ProxyProvider.ts`:** Implements `LLMProvider`. Sends prompt + `idToken` to your Cloudflare Worker URL using `fetch`.
- **`index.ts`:** Export a dynamic `llm` object that switches between `MockProvider` and `ProxyProvider` based on `authStore` status.

## 3. UI Entry Point (`src/components/Toolbar/Toolbar.tsx`)
- Add a "Sign In" button (Google icon) to the top-right.
- Once logged in, show the user's Google avatar and a "Sign Out" option in a small menu.
- Display a small badge or indicator if they are in "Pro/Friend Mode" vs "Guest Mode".

## 4. Cloudflare Worker Template
- Create a `worker/` directory with a sample `index.ts`.
- Logic:
    - Receive `POST` request with prompt and `Authorization: Bearer <ID_TOKEN>`.
    - Verify token with Google's public keys.
    - Check if `email` is in `ALLOWED_EMAILS` (environment variable).
    - If valid, forward the request to Google Gemini API using the server-side `GEMINI_API_KEY`.
