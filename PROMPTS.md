# Feature: Enhanced Stats & Shared Attachment Library

## Objective
Convert the static Legend into a dynamic "Session Stats" panel and implement a global "Attachment Library" system where binary files are stored separately in IndexedDB and referenced by ID.

## 1. Data Layer & Storage
- Update `src/types.ts`:
    - `Attachment` should have optional `width`, `height`, and `duration`.
    - `Commit` should store `attachmentIds: string[]` instead of full objects.
    - `ChatSession` remains focused on graph structure.
- Implementation for `src/lib/storage.ts`:
    - Create a dedicated file for blob storage using `idb-keyval`.
    - Functions: `saveBlob(id, blob)`, `getBlob(id)`, `deleteBlob(id)`.

## 2. Store Logic (`src/store/conversationStore.ts`)
- Add a `library: Record<string, AttachmentMetadata>` to the global state.
- Update `addCommit` and `addTurn` to handle `attachmentIds`.
- Add actions: `uploadAttachment(file)`, `addToSession(sessionId, attachmentId)`.

## 3. Session Stats Panel (`src/components/Toolbar/Toolbar.tsx`)
- Replace the Legend/Instruction box with a "Session Stats" panel.
- **Metrics to calculate:**
    - **Turns:** Count of assistant commits.
    - **Tokens:** (Text Chars / 4) + (258 per image) + (32 per sec of audio).
    - **Depth:** Path length from current `HEAD` to `root`.
    - **Branches:** Count of nodes with a `branchLabel`.
    - **Nodes:** Total commits in the session.
    - **Last Updated:** Relative time using `timeAgo`.
- **Visuals:** Keep the aesthetic of the existing floating panel (blurred background, Syne font headers).

## 4. Library Sidebar (`src/components/Library/LibrarySidebar.tsx`)
- Create a slide-over sidebar (right side).
- Show "This Session" vs "Global Library" sections.
- Display file previews (thumbnails for images, icons for others).
- Show metadata (size, dimensions/duration if available).
