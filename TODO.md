# TODO: Implement Markdown Support

## Phase 1: Setup
- [ ] Install `react-markdown` and `remark-gfm`.

## Phase 2: Implementation
- [ ] Update `src/components/ChatDialog/MessageList.tsx`:
    - [ ] Import `ReactMarkdown` and `remarkGfm`.
    - [ ] Define custom components for `ReactMarkdown` to handle styling (remove default margins).
    - [ ] Apply `ReactMarkdown` to message content and `streamingContent`.

## Phase 3: Validation
- [ ] Verify line breaks are rendered correctly.
- [ ] Verify **bold** and *italic* formatting works.
- [ ] Verify lists and other Markdown features work.
- [ ] Ensure the scrolling still works correctly with Markdown content.
- [ ] Run `npx tsc`.
