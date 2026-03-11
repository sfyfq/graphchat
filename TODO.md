# TODO: Dialog Minimization Sidebar

- [x] **Phase 1: Component Refactor (ChatDialog)**
    - [x] Update `ChatDialog.tsx` to include a minimize button.
    - [x] Implement `handleMinimize` logic to capture current state and most recent content.

- [x] **Phase 2: UI (Minimized Sidebar)**
    - [x] Create `src/components/Canvas/MinimizedSidebar.tsx`.
    - [x] Design the floating items with branch color indicators.
    - [x] Implement the hover tooltip for message summaries.

- [x] **Phase 3: State & Integration (App.tsx)**
    - [x] Add `minimizedDialogs` state to `App.tsx`.
    - [x] Implement `handleMinimize` and `handleRestore` actions.
    - [x] Add the 5-item limit validation.
    - [x] Integrate the sidebar into the main layout.
