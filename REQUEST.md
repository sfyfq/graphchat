# Request: Dynamic API Key Provisioning

Implement a mechanism for the user to provide an LLM API key if it's missing from the environment.

## Requirements:
- **Provisoning:** Prompt the user for the API key only when they try to send a message and no key is available.
- **Storage:** Store the provided API key in memory only (using a non-persistent Zustand store).
- **Security:** Do not persist the key to LocalStorage or IndexedDB.
- **User Experience:** Use a clean UI (e.g., a modal or inline prompt) within the ChatDialog or as a global overlay.
