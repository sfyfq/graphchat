feature: Atomic turns with streaming and User-node editing.
- HEAD must always point to an Assistant node.
- Clicking a User node: Set HEAD to parent Assistant, pre-fill dialog input with user node content.
- Clicking an Assistant node: Set HEAD to self, empty dialog input.
- Sending a message: Do not commit User node immediately. Wait for Assistant response (streaming).
- Atomic Commit: Only after the Assistant stream finishes successfully, commit BOTH the User and Assistant nodes to the store.
- Error handling: If the request fails, the User message stays in the input field; nothing is committed to the graph.
--- Tue Mar 10 12:15:00 PDT 2026 ---
