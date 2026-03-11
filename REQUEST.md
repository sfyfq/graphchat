# Request: UI Improvement - Pending User Message

Improve the message-sending UX by showing the user's message immediately after sending, even while the assistant's reply is still streaming and before both messages are officially committed to the graph.

## Requirements:
- **Immediate Feedback:** When the user clicks "Send", their message should appear in the `MessageList` instantly.
- **Pending State:** This message should be treated as "pending" or "uncommitted" until the assistant finishes streaming.
- **Visual Consistency:** The pending user message should look identical to committed user messages.
- **Transactional Commit:** Both the user message and the assistant message should still be committed together once the streaming is complete.
