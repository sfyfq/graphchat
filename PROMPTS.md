# Bugfix: ChatDialog Enter to Send

## Objective
Restore the "Enter to send" functionality in the `ChatDialog` component by re-attaching the `handleKeyDown` event handler to the `textarea`.

## Implementation Details
- Update `src/components/ChatDialog/ChatDialog.tsx`:
    - Locate the `textarea` inside the return statement.
    - Add the prop `onKeyDown={handleKeyDown}` to the `textarea` component.
    - Verify that `handleKeyDown` is correctly defined to trigger `handleSend()` on "Enter" and allow "Shift+Enter" for new lines.
