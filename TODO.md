# TODO: Implement LaTeX Support

## Phase 1: Implementation - Message History
- [ ] Update `src/components/ChatDialog/MessageList.tsx`:
    - [ ] Import `remarkMath` and `rehypeKatex`.
    - [ ] Import `katex/dist/katex.min.css`.
    - [ ] Update `ReactMarkdown` props to include `remarkMath` and `rehypeKatex`.

## Phase 2: Implementation - Live Preview
- [ ] Update `src/components/ChatDialog/ChatDialog.tsx`:
    - [ ] Import `ReactMarkdown`, `remarkMath`, `rehypeKatex`.
    - [ ] Add a `Preview` area inside the dialog, just above the input zone.
    - [ ] Render `input` in this area using the Markdown/KaTeX setup.
    - [ ] Style the preview area for clarity.

## Phase 3: Validation
- [ ] Type `$x^2$` in the input. Verify it renders as a mathematical formula in the preview.
- [ ] Send a message with LaTeX. Verify the assistant response (if it contains LaTeX) renders correctly.
- [ ] Verify both inline `$math$` and block `$$math$$` notation work.
- [ ] Run `npx tsc`.
