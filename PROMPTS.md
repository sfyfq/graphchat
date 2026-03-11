# Improvement: Pending User Message UI

## Objective
Enhance the ChatDialog UI to display the user's latest message immediately after submission, creating a more responsive experience while waiting for the assistant's reply.

## 1. ChatDialog Refactor (`src/components/ChatDialog/ChatDialog.tsx`)
- Add state: `pendingUserContent: string`.
- In `handleSend`:
    - Set `pendingUserContent` to the current `input` text right before clearing it.
    - Pass `pendingUserContent` to the `MessageList` component.
    - Clear `pendingUserContent` once the assistant message is committed.

## 2. MessageList Refactor (`src/components/ChatDialog/MessageList.tsx`)
- Add prop: `pendingUserContent?: string`.
- Update the render logic:
    - If `pendingUserContent` is present, render it as a user message (right-aligned, blue gradient) after the list of committed messages but **before** the streaming assistant message.
