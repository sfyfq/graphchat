# Request: Fix ChatDialog Enter to Send

Pressing "Enter" in the `ChatDialog` textarea currently performs a carriage return instead of sending the message. This was likely introduced during the LaTeX preview implementation.

## Requirements:
- Pressing "Enter" (without Shift) should trigger the `handleSend` function.
- Pressing "Shift+Enter" should still perform a carriage return (new line).
- Ensure the behavior is consistent with standard chat application UX.
