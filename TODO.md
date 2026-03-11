# TODO: Dialog Minimization Sidebar

- [x] **Phase 1: Component Refactor (ChatDialog)**
    - [x] Update `ChatDialog.tsx` to include a minimize button.
    - [x] Implement `handleMinimize` logic to capture current state and latest content.

- [x] **Phase 2: UI (Minimized Sidebar)**
    - [x] Create `src/components/Canvas/MinimizedSidebar.tsx`.
    - [x] Implement hover summaries and branch color indicators.

- [x] **Phase 3: State & Integration (App.tsx)**
    - [x] Add `minimizedDialogs` state to `App.tsx`.
    - [x] Implement `handleMinimize` and `handleRestore` actions.
    - [x] Integrate the sidebar and add CSS animations.
