# Feature: Dynamic API Key Modal & In-Memory Storage

## Objective
Implement a centralized modal to collect and validate an LLM API key when missing or invalid, storing it only in memory for the current browser session.

## 1. State Management (`src/store/configStore.ts`)
- Create a new Zustand store **without** the `persist` middleware.
- **State:** `apiKey: string | null`, `showKeyModal: boolean`.
- **Actions:** `setApiKey(key)`, `toggleKeyModal(show)`.
- **Initialization:** Initialize `apiKey` with `import.meta.env.VITE_LLM_API_KEY || null`.

## 2. Gemini Provider Refactor (`src/lib/llm/gemini.ts`)
- Remove the static `genAI` instance.
- Create a helper to get or initialize the `GoogleGenerativeAI` instance using the latest key from `configStore`.
- Update `sendMessage` and `streamMessage` to use this dynamic initialization.

## 3. API Key Modal (`src/components/Modals/ApiKeyModal.tsx`)
- Create a visually consistent modal (glassmorphism style).
- **Validation:** Ensure the key is not empty and follows basic Gemini key patterns (if applicable).
- **UX:** Provide a clear "Save" button and a link to get a key from Google AI Studio.

## 4. Integration Logic (`src/components/ChatDialog/ChatDialog.tsx`)
- In `handleSend`:
    - Check if `apiKey` is present in `configStore`.
    - If missing, call `toggleKeyModal(true)` and abort the send (or wait for the key).
    - In the `catch` block for LLM calls:
        - If the error indicates an "Invalid API Key" (e.g., 401/403), trigger the modal and clear the invalid key.
