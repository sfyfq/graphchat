feature: multi-session support and IndexedDB persistence.
- Refactor store to manage multiple sessions (id -> SessionObject).
- Use IndexedDB (via idb-keyval) for persistent storage to support future attachments.
- Add UI for session listing, switching, creating, and deleting in the Toolbar.
- Replace commit count with Session Manager.
- Ensure "Draft" logic and local UI state are cleared upon session switch.
--- Tue Mar 10 14:00:00 PDT 2026 ---
