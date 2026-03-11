# Feature: Dialog Minimization Sidebar

## Objective
Implement a system to minimize chat dialogs into a right-side vertical sidebar with hover summaries and easy restoration.

## 1. State Management (`src/App.tsx`)
- Add `minimizedDialogs` state to track minimized items (including position, color, and summary).
- Implement `handleMinimize` with a 5-item limit check.
- Implement `handleRestore` to move items back to the active `dialogs` state.

## 2. ChatDialog Component (`src/components/ChatDialog/ChatDialog.tsx`)
- Add `onMinimize` prop.
- Add minimize button ("−") to the header.
- On minimize, send current state and a summary of the latest content.

## 3. Minimized Sidebar (`src/components/Canvas/MinimizedSidebar.tsx`)
- Create a floating vertical stack on the right edge.
- Display branch-colored icons for each minimized item.
- Implement glassmorphism tooltips for hover summaries.

## 4. UI Refinements
- Add `sidebar-in` and update `tooltip-in` animations in `src/index.css`.
