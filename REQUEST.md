bugfix: clicking a user node (draft) should not show that user message in the dialog's message list.
- When a User node is clicked, the dialog should display the conversation up to its parent Assistant node.
- The clicked User node's content should only appear in the input textfield.
--- Tue Mar 10 12:30:00 PDT 2026 ---
Analysis: `ChatDialog` was initializing its `tipId` state to the clicked node's ID. For User nodes, this caused the message list to include the User message itself. We should initialize `tipId` to the parent ID if the clicked node is a User node.
