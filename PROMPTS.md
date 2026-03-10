**Your Optimized Prompt:**
Fix the session-reset auto-fit bug in `src/components/Canvas/Canvas.tsx`.

1.  **Problem**: The canvas framing logic (placing `root` in the bottom third) only runs on the very first mount of the component. When switching or deleting sessions, the component stays mounted but the data changes, and the framing logic is skipped because of the `initialised` ref.

2.  **Implementation**:
    - Inside the `Canvas` component, add a `useEffect` that monitors `currentSession.id`.
    - When the ID changes, set `initialised.current = false`.
    - This allows the existing auto-fit `useEffect` (which depends on `layout`) to re-run for the new session's data.

**Key Improvements:**
• Guarantees consistent initial framing for every session.
• Fixes the "random positioning" issue experienced after session deletion.

**Techniques Applied:** Ref-state synchronization, lifecycle management.
 Here is the updated code:
**Your Optimized Prompt:**
Fix the session-reset auto-fit bug in `src/components/Canvas/Canvas.tsx`.

1.  **Problem**: The canvas framing logic (placing `root` in the bottom third) only runs on the very first mount of the component. When switching or deleting sessions, the component stays mounted but the data changes, and the framing logic is skipped because of the `initialised` ref.

2.  **Implementation**:
    - Inside the `Canvas` component, add a `useEffect` that monitors `currentSession.id`.
    - When the ID changes, set `initialised.current = false`.
    - This allows the existing auto-fit `useEffect` (which depends on `layout`) to re-run for the new session's data.

**Key Improvements:**
• Guarantees consistent initial framing for every session.
• Fixes the "random positioning" issue experienced after session deletion.

**Techniques Applied:** Ref-state synchronization, lifecycle management.
