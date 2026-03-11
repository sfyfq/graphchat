# Feature: Dialog Minimization Sidebar

## Objective
Implement a system to minimize up to 5 chat dialogs into a vertical sidebar on the right side of the screen, with hover summaries and easy restoration.

## 1. State Management (`src/App.tsx`)
- Add state: `minimizedDialogs: Record<string, DialogState & { summary: string, color: string }>`.
- Track the order of minimization to enforce the **5-item limit**.
- Ensure that switching sessions clears the minimized state.

## 2. ChatDialog Component (`src/components/ChatDialog/ChatDialog.tsx`)
- Add an `onMinimize` prop.
- In the header, add a "−" (minimize) button next to the "×" (close) button.
- When clicked, call `onMinimize` with the current `DialogState` and a summary of either the last message in the branch or the current input text.

## 3. Minimized Sidebar (`src/components/Canvas/MinimizedSidebar.tsx`)
- Create a new component to render the vertical stack of minimized items.
- **Visuals:** 
    - Floating on the right edge, centered vertically.
    - Each item: A circle/square with a chat-box icon and a dot of the branch color.
    - Glassmorphism style (blur + transparency).
- **Hover:** Show a tooltip with the `summary` (truncated).
- **Click:** Restore the dialog by moving it from `minimizedDialogs` back to the active `dialogs` state.

## 4. UX Refinements
- When restoring, return the dialog to its **original position** saved during minimization.
- If the user tries to minimize a 6th dialog, show a brief warning (e.g., "Max 5 minimized chats").
