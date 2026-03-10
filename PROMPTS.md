**Your Optimized Prompt:**
Implement Markdown rendering for messages in `src/components/ChatDialog/MessageList.tsx`.

1.  **Dependencies**:
    - Use `react-markdown` for rendering Markdown.
    - Optionally use `remark-gfm` for GitHub Flavored Markdown (better support for tables, lists, and line breaks).

2.  **Implementation**:
    - In `MessageList.tsx`, wrap the content of assistant messages and the `streamingContent` in a `ReactMarkdown` component.
    - User messages can also be wrapped or kept as plain text (wrapping both is usually more consistent).
    - Use custom components for `react-markdown` to ensure `p`, `ul`, `ol` tags don't have excessive margins that break the bubble layout.

3.  **Styling**:
    - Ensure `white-space: pre-wrap` or equivalent Markdown behavior is maintained.
    - Add styles for `bold`, `italic`, and lists within the chat bubble context.

**Key Improvements:**
• Transforms plain text blobs into readable, structured content.
• Supports essential formatting like line breaks, bold, and italic.
• Professional chat experience similar to major LLM interfaces.

**Techniques Applied:** Markdown integration, component-level styling overrides.
